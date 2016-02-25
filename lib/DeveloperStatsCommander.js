module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;
    var fs = require('fs');
    var moment = require('moment');

    var DeveloperStatsCommander = function(config, githubWrapper, googleSpreadsheetWrapper, slackWrapper) {
        this.repos = config.repos;
        this.nonUsers = config.nonUsers;
        this.defaultOrganization = config.defaultOrganization;
        this.authorWorksheetIndex = config.authorWorksheetIndex;
        this.repoWorksheetIndex = config.repoWorksheetIndex;
        this.contributionsWorksheetIndex = config.contributionsWorksheetIndex;
        this.githubWrapper = githubWrapper;
        this.googleSpreadsheetWrapper = googleSpreadsheetWrapper;
        this.slackWrapper = slackWrapper;
    };

    DeveloperStatsCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var digested = null;
        var resolves = null;

        this.askForPermission ()
        .then(function (){
            return commander.askForOrg ();
        })
        .then(function (_organization) {
            organization = _organization;

            return Q.allSettled (commander.repos.map (function (repo) {
                console.log ('Getting stats for ' + repo + '...')
                return commander.githubWrapper.getContributorStatsForRepo (organization, repo);
            }));
        })
        .then(function (_resolves) {
            console.log ('Digesting...')
            resolves = _resolves;
            digested = commander.digest (resolves, moment().subtract ('20', 'week').format ('X'));

            console.log ('Authenticating on Google Drive...');
            return commander.googleSpreadsheetWrapper.authenticate ();
        })
        .then(function (){
            console.log ('Obtaining spreadsheet info...');
            return commander.googleSpreadsheetWrapper.getInfo (commander.authorWorksheetIndex);
        })
        .then(function (resolves) {
            console.log ('Saving author worksheet...');
            return commander.googleSpreadsheetWrapper.saveRows (commander.authorWorksheetIndex, commander.convertToReport(digested, 'author', 'week', 'commits', 'week'));
        })
        .then(function (resolves) {
            console.log ('Saving repo worksheet...');
            return commander.googleSpreadsheetWrapper.saveRows (commander.repoWorksheetIndex, commander.convertToReport(digested, 'repo', 'week', 'commits', 'week'));
        })
        .then(function (resolves) {
            console.log ('Saving contributions worksheet...');
            return commander.googleSpreadsheetWrapper.saveRows (commander.contributionsWorksheetIndex, commander.convertToReport(digested, 'repo', 'author', 'commits', 'author'));
        })
        .then (function (){
            digested = commander.digest (resolves, moment().subtract ('2', 'week').format ('X'));
            var message = commander.snitch (organization,digested);
            console.log (message);
            console.log ('Reporting to Slack...');
            return commander.slackWrapper.post (message);
        })
        .then (function (){
            console.log ('Wrapping to Slack...');
            var message = 'For more info visit https://docs.google.com/spreadsheets/d/' + process.env.DEV_STATS_GOOGLE_SPREADSHEET_ID;
            console.log (message);
            return commander.slackWrapper.post (message);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    DeveloperStatsCommander.prototype.askForOrg = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'org',
                message: 'Name of your organization on github.com',
                default: this.defaultOrganization,
            }
        ], function(answers) {
            deferred.resolve(answers.org);
        });

        return deferred.promise;
    };


    DeveloperStatsCommander.prototype.convertToReport = function(digested, columnProperty, rowProperty, valueProperty, sortProperty) {
        var deferred = Q.defer();

        var tree = this.convertDigestedToTree (digested, columnProperty, rowProperty, valueProperty);
        var data = this.convertTreeToObjectArray (sortProperty, tree);

        data.sort (function compare(a, b) {
            if (a[sortProperty] > b[sortProperty]) {
              return -1;
            }
            if (a[sortProperty] < b[sortProperty]) {
              return 1;
            }

            return 0;
        });

        console.log ('Columns:');
        console.log (Object.keys (data [0]));

        return data;
    }

//    DeveloperStatsCommander.prototype.spit = function(table) {
//        for (var i = 0; i < table.length; i++) {
//
//            var message = '';
//
//            for (var j = 0; j < table [i].length; j++) {
//                message += ((typeof table [i][j] == 'undefined')? 0 : table [i][j]) + '\t';
//            }
//
//            console.log (message);
//        }
//    }

    DeveloperStatsCommander.prototype.convertTreeToTable = function(name, tree) {
        var table = [];
        var headers = [name];
        var body = [];
        var rows = [];

        for (var p in tree) {
            for (var q in tree [p]) {
                if (rows.indexOf (q) == -1) {
                    rows.push (q);
                }
            }
        }

        for (var i = 0; i < rows.length; i++) {
            var name = rows [i];
            var row = []; 
            row.push (name);

            console.log (name);

            for (var p in tree) {
                if (i == 0) {
                    headers.push (p);
                }
                row.push (tree [p][rows [i]]);
            }

            body.push (row);
        }

        return [headers].concat (body);
    }

    DeveloperStatsCommander.prototype.convertTreeToObjectArray = function(name, tree) {
        var table = [];
        var body = [];
        var rows = [];

        for (var p in tree) {
            for (var q in tree [p]) {
                if (rows.indexOf (q) == -1) {
                    rows.push (q);
                }
            }
        }

        for (var i = 0; i < rows.length; i++) {
            var row = {}; 
            row [name] = rows [i];

            for (var p in tree) {
                row[p] = typeof tree [p][rows [i]] == 'undefined' ? 0 : tree [p][rows [i]];
            }

            body.push (row);
        }

        return body;
    }

    DeveloperStatsCommander.prototype.convertDigestedToTree = function(digested, column, row, value) {
        var result = {};

        for (var i = 0; i < digested.length; i++) {
            var entry = digested [i];

            if (typeof result [entry [column]] == 'undefined') {
                result [entry [column]] = {};
            }

            if (typeof result [entry [column]][entry [row]] == 'undefined') {
                result [entry [column]][entry [row]] = 0;
            }

            result [entry [column]][entry [row]] += entry [value];
        }

        return result;
    }

    DeveloperStatsCommander.prototype.digest = function (resolves, fromTimestamp) {

        var values = this.extractAndEnsureValues (resolves);

        var digested = []; 

        for (var i = 0 ; i < values.length; i++) {

            var originalStatsPayload = values [i];
            var repo = originalStatsPayload.repo;

            for (var p in originalStatsPayload) {

                if (isNaN (p)) {
                    continue;
                }

                var weeklyStats = originalStatsPayload [p];

                for (var w = 0; w < weeklyStats.weeks.length; w++) {

                    if (this.nonUsers.indexOf (weeklyStats.author.login) != -1)
                        continue;

                    var timestamp = weeklyStats.weeks[w].w;

                    if (timestamp < fromTimestamp)
                        continue;

                    var date = moment.unix (timestamp);

                    var entry = {
                        week : date.isoWeekYear () + '-W' + ('0' + date.isoWeek ()).substr(-2),
                        timestamp : timestamp,
                        author: weeklyStats.author.login,
                        repo: repo,
                        commits: weeklyStats.weeks[w].c,
                        added : weeklyStats.weeks[w].a,
                        deleted : weeklyStats.weeks[w].d,
                        changed : weeklyStats.weeks[w].a + weeklyStats.weeks[w].d
                    };

                    digested.push(entry);
                }
            }
        }

        return digested;

    }


    DeveloperStatsCommander.prototype.askForPermission = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to go ahead with calculating the team stats? Dont forget to clean the google spreadsheet first!',
                default: false
            }
        ], function(answers) {
            if (answers.confirm) {
                deferred.resolve();
            } else {
                deferred.reject ();
            }
        });

        return deferred.promise;
    };


    DeveloperStatsCommander.prototype.renderRepoStats = function (organization, digested) {
        var result = '';
        var zeroes = [];

        result += '*Repository activity and authors over the last 2 weeks.*\n';
        result += 'Only contributions to each repository default repo are considered.\n';
        result += '\n';
        result += ':star: (>100), :sunny: (>85), :mostly_sunny: (>50), :partly_sunny: (>25), :partly_sunny_rain: (>10), :rain_cloud: (>3), :thunder_cloud_and_rain: (>0), :snowflake: (0)';
        result += '\n';
        result += '\n';


        for (var p in digested) {

            var totalCommits = 0;
            var line = '';
            var notes = '';

            for (var q in digested [p]) {
                if (digested[p][q] == 0) {
                    continue;
                }

                totalCommits += digested[p][q];

                if (notes != '') {
                    notes += ', ';
                }
                notes += '<https://github.com/' + organization + '/' + p + '/commits?author=' + q + '|' + q + '>';
            }

            var emoji;

            if (totalCommits > 100) {
                emoji = ':star:';
            } else if (totalCommits > 85) {
                emoji = ':sunny:';
            } else if (totalCommits > 50) {
                emoji = ':mostly_sunny:';
            } else if (totalCommits > 25) {
                emoji = ':partly_sunny:';
            } else if (totalCommits > 10) {
                emoji = ':partly_sunny_rain:';
            } else if (totalCommits > 3) {
                emoji = ':rain_cloud:';
            } else if (totalCommits > 0) {
                emoji = ':thunder_cloud_and_rain:';
            } else {
                zeroes.push (p);
                continue;
            }


            line += '`' + ('   ' + totalCommits).substr(-3) + '`';
            line += '  ' + emoji + '  ';
            line += '<https://github.com/' + organization + '/' + p + '|' + p + '>';
            line += (notes) ? (' by ' + notes) : '';
            line += '\n';

            result += line;
        }

        result += '`  0`  :snowflake:  ';

        for (var i = 0; i < zeroes.length; i++) {
            result += '<https://github.com/' + organization + '/' + zeroes [i] + '|' + zeroes [i] + '>' + ((i == zeroes.length - 2) ? ' and ' : ((i == zeroes.length - 1) ? '.' : ', '));
        }

        return result;
    }


    DeveloperStatsCommander.prototype.snitch = function (organization, digested) {
        return this.renderRepoStats (organization, this.convertDigestedToTree (digested, 'repo', 'author', 'commits'));



/*        var result = '';
        var zeroes = [];

        for (var p in digested) {

            var totalCommits = 0;
            var line = '';
            var notes = '';


            for (var name in digested [p]) {

                totalCommits += digested[p][name];

                if (notes != '') {
                    notes += ', ';
                }

                notes += name + ': ' + digested[p][name];

            }

            if (totalCommits == 0) {
                zeroes.push (p);
                continue;
            }

            notes = '(' + notes + ')';

            line += '`' + ('   ' + totalCommits).substr(-3) + '` ';
            line += p;
            line += ' ' + notes;
            line += '\n';

            result += line;
        }


        result += 'No activity: ';

        for (var i = 0; i < zeroes.length; i++) {
            result += zeroes [i] + ((i == zeroes.length - 2) ? ' and ' : ((i == zeroes.length - 1) ? '.' : ', '));
        }

        result += '\n';

*/
        return result;
    }

    DeveloperStatsCommander.prototype.extractAndEnsureValues = function (resolves) {

        var result = [];

        for (var i = 0; i < resolves.length; i++) {

            if (resolves [i].state != 'fulfilled') {
                console.log (resolves[i]);
                throw { message: 'found unfulfilled resolve', object: resolves[i] };
            }

            if (resolves [i].value.meta.status == '204 No Content') {
                continue;
            }

            if (resolves [i].value.meta.status != '200 OK') {
                throw { message: 'found non 200 response', object: resolves [i].value };
            }

            result.push (resolves [i].value);
        }

        return result;
    }

    return DeveloperStatsCommander;

}());
