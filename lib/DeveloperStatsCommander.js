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

        var and = this.askForOrg ();

        if (typeof googleSpreadsheetWrapper !== 'undefined') {

            and.then(function (_organization){
                organization = _organization;
    
                console.log ('Authenticating on Google Drive...');
                return commander.googleSpreadsheetWrapper.authenticate ();
            })
            .then(function () {
                console.log ('Authenticated on Google Drive.');
                return Q.allSettled (commander.repos.map (function (repo) {
                    console.log ('Getting stats for ' + repo.name + '...')
                    return commander.githubWrapper.getContributorStatsForRepo (organization, repo);
                }));
            })
            .then(function (resolves) {
                console.log ('Stats obtained for all repos. Digesting...')
                digested = commander.digest (resolves);
    
                console.log ('Digested.')
                console.log ('Obtaining spreadsheet info...');
    
                return commander.googleSpreadsheetWrapper.getInfo (this.authorWorksheetIndex);
            })
            .then(function (resolves) {
                console.log ('Spreadsheet info obtained.');
                console.log ('Obtaining rows for worksheet ' + this.authorWorksheetIndex + '...')
                return commander.googleSpreadsheetWrapper.getRows (this.authorWorksheetIndex);
            })
            .then (function (rows) {
                console.log ('Rows for worksheet ' + this.authorWorksheetIndex + ' obtained.')
                console.log ('Deleting worksheet ' + this.authorWorksheetIndex + ' rows...')
    
                return Q.allSettled (rows.map (function (row) {
                    return commander.googleSpreadsheetWrapper.deleteRow (row);
                }));
            })
            .then (function (){
                console.log ('Deleted worksheet ' + this.authorWorksheetIndex + ' rows.')
                return commander.googleSpreadsheetWrapper.saveRows (this.authorWorksheetIndex, commander.convertToReport(digested, 'author', 'week', 'commits', 'week'));
            })
            .then(function (resolves) {
                console.log ('Spreadsheet info obtained.');
                console.log ('Obtaining rows for worksheet ' + this.repoWorksheetIndex + '...')
                return commander.googleSpreadsheetWrapper.getRows (this.repoWorksheetIndex);
            })
            .then (function (rows) {
                console.log ('Rows for worksheet ' + this.repoWorksheetIndex + ' obtained.')
                console.log ('Deleting worksheet ' + this.repoWorksheetIndex + ' rows...')
    
                return Q.allSettled (rows.map (function (row) {
                    return commander.googleSpreadsheetWrapper.deleteRow (row);
                }));
            })
            .then (function (){
                console.log ('Deleted worksheet ' + this.repoWorksheetIndex + ' rows.')
                return commander.googleSpreadsheetWrapper.saveRows (this.repoWorksheetIndex, commander.convertToReport(digested, 'repo', 'week', 'commits', 'week'));
            })
            .then(function (resolves) {
                console.log ('Spreadsheet info obtained.');
                console.log ('Obtaining rows for worksheet ' + this.contributionsWorksheetIndex + '...')
                return commander.googleSpreadsheetWrapper.getRows (this.contributionsWorksheetIndex);
            })
            .then (function (rows) {
                console.log ('Rows for worksheet ' + this.contributionsWorksheetIndex + ' obtained.')
                console.log ('Deleting worksheet ' + this.contributionsWorksheetIndex + ' rows...')
    
                return Q.allSettled (rows.map (function (row) {
                    return commander.googleSpreadsheetWrapper.deleteRow (row);
                }));
            })
            .then (function (){
                console.log ('Deleted worksheet ' + contributionsWorksheetIndex + ' rows.')
                return commander.googleSpreadsheetWrapper.saveRows (contributionsWorksheetIndex, commander.convertToReport(digested, 'repo', 'author', 'commits', 'author'));
            });
            
        }
    
        if (typeof slackWrapper !== 'undefined') {
            and.then (function (){
                var message = commander.snitch (digested);
                console.log (message);

                console.log ('Reporting to Slack...')
                return commander.slackWrapper.post (message);
            });
        }

        and.catch(function(e) {
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

    DeveloperStatsCommander.prototype.spit = function(table) {
        for (var i = 0; i < table.length; i++) {

            var message = '';

            for (var j = 0; j < table [i].length; j++) {
                message += ((typeof table [i][j] == 'undefined')? 0 : table [i][j]) + '\t';
            }

            console.log (message);
        }
    }

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

    DeveloperStatsCommander.prototype.digest = function (resolves) {

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

                    if (timestamp < moment().subtract ('20', 'week').format ('X'))
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

    DeveloperStatsCommander.prototype.snitch = function (digested) {

        var result = '';
        var zeroes = [];

        for (var p in digested) {

            var totalCommits = 0;
            var totalChanges = 0;
            var line = '';
            var notes = '';


            for (var name in digested [p]) {

                totalCommits += digested[p][name].commits;
                totalChanges += digested[p][name].changed;

                if (notes != '') {
                    notes += ', ';
                }

                notes += name + ': ' + digested[p][name].commits;

            }

            if (totalCommits == 0) {
                zeroes.push (p);
                continue;
            }

            notes = '(' + notes + ')';

            line += '`' + ('   ' + totalCommits).substr(-3) + '` ';
            line += '`' + ('     ±' + totalChanges).substr(-6) + '` ';
            line += '`' + ('      ' + (totalChanges/totalCommits).toFixed (1)).substr(-6) + '` ';
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
