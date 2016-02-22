module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;
    var fs = require('fs');
    var moment = require('moment');

    var DeveloperStatsCommander = function(githubWrapper, googleSpreadsheetWrapper) {
        this.githubWrapper = githubWrapper;
        this.googleSpreadsheetWrapper = googleSpreadsheetWrapper;
        this.answers = {};
    };

    DeveloperStatsCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var team = null;
        var candidate = null;
        var repo = null;
        var target = null;
        var digested = null;
        var authorWorksheetIndex = process.env.DEV_STATS_GOOGLE_DRIVE_AUTHOR_WORKSHEET_INDEX;
        var repoWorksheetIndex = process.env.DEV_STATS_GOOGLE_DRIVE_REPO_WORKSHEET_INDEX;
        var contributionsWorksheetIndex = process.env.DEV_STATS_GOOGLE_DRIVE_CONTRIBUTIONS_WORKSHEET_INDEX;

        this.askForOrg()
        .then(function (_organization){
            organization = _organization;
            console.log ('Authenticating on Google Drive...');
            return commander.googleSpreadsheetWrapper.authenticate ();
        })
        .then(function () {
            console.log ('Authenticated on Google Drive.');

            var targets = process.env.DEV_STATS_REPOS.split(',');
            var repos = []; 

            for (var i = 0; i < targets.length; i++) {
                repos.push ({owner: {login: organization}, name: targets[i]});
            }

            return Q.allSettled (repos.map (function (repo) {
                console.log ('Getting stats for ' + repo.name + '...')
                return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
            }));
        })
        .then(function (resolves) {
            console.log ('Stats obtained for all repos. Digesting...')
            digested = commander.digest (resolves);

            console.log ('Digested.')
            console.log ('Obtaining spreadsheet info...');

            return commander.googleSpreadsheetWrapper.getInfo (authorWorksheetIndex);
        })
        .then(function (resolves) {
            console.log ('Spreadsheet info obtained.');
            console.log ('Obtaining rows for worksheet ' + authorWorksheetIndex + '...')
            return commander.googleSpreadsheetWrapper.getRows (authorWorksheetIndex);
        })
        .then (function (rows) {
            console.log ('Rows for worksheet ' + authorWorksheetIndex + ' obtained.')
            console.log ('Deleting worksheet ' + authorWorksheetIndex + ' rows...')

            return Q.allSettled (rows.map (function (row) {
                return commander.googleSpreadsheetWrapper.deleteRow (row);
            }));
        })
        .then (function (){
            console.log ('Deleted worksheet ' + authorWorksheetIndex + ' rows.')
            return commander.googleSpreadsheetWrapper.saveRows (authorWorksheetIndex, commander.convertToReport(digested, 'author', 'week', 'commits', 'week'));
        })
        .then(function (resolves) {
            console.log ('Spreadsheet info obtained.');
            console.log ('Obtaining rows for worksheet ' + repoWorksheetIndex + '...')
            return commander.googleSpreadsheetWrapper.getRows (repoWorksheetIndex);
        })
        .then (function (rows) {
            console.log ('Rows for worksheet ' + repoWorksheetIndex + ' obtained.')
            console.log ('Deleting worksheet ' + repoWorksheetIndex + ' rows...')

            return Q.allSettled (rows.map (function (row) {
                return commander.googleSpreadsheetWrapper.deleteRow (row);
            }));
        })
        .then (function (){
            console.log ('Deleted worksheet ' + repoWorksheetIndex + ' rows.')
            return commander.googleSpreadsheetWrapper.saveRows (repoWorksheetIndex, commander.convertToReport(digested, 'repo', 'week', 'commits', 'week'));
        })
        .then(function (resolves) {
            console.log ('Spreadsheet info obtained.');
            console.log ('Obtaining rows for worksheet ' + contributionsWorksheetIndex + '...')
            return commander.googleSpreadsheetWrapper.getRows (contributionsWorksheetIndex);
        })
        .then (function (rows) {
            console.log ('Rows for worksheet ' + contributionsWorksheetIndex + ' obtained.')
            console.log ('Deleting worksheet ' + contributionsWorksheetIndex + ' rows...')

            return Q.allSettled (rows.map (function (row) {
                return commander.googleSpreadsheetWrapper.deleteRow (row);
            }));
        })
        .then (function (){
            console.log ('Deleted worksheet ' + contributionsWorksheetIndex + ' rows.')
            return commander.googleSpreadsheetWrapper.saveRows (contributionsWorksheetIndex, commander.convertToReport(digested, 'repo', 'author', 'commits', 'author'));
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
                default: process.env.DEFAULT_ORGANIZATION
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
        var nonUsers = process.env.DEV_STATS_EXCLUDE_USERS.split(',');

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

                    if (nonUsers.indexOf (weeklyStats.author.login) != -1)
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

    DeveloperStatsCommander.prototype.slack = function (message) {

        var sh = 'curl -X POST --data-urlencode \'payload={"username": "' + process.env.DEV_STATS_SLACK_USERNAME + '", "text": "'+ message + '", "icon_emoji": "' + process.env.DEV_STATS_SLACK_EMOJI + '"}\' ' + process.env.DEV_STATS_SLACK_URL;

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                throw error;
            }
        });
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
