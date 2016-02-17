module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;
    var fs = require('fs');
    var moment = require('moment');

    var DeveloperStatsCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    DeveloperStatsCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var team = null;
        var candidate = null;
        var repo = null;
        var target = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getOrgRepos (organization);
        })
        .then(function (repos) {
            repos = commander.filterRepos (repos);
            return Q.allSettled (repos.map (function (repo) {
                    console.log ('Getting stats for ' + repo.name + '...')
                    return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
            }));
        })
        .then(function (resolves) {
            console.log ('Stats obtained.')
            var digested = commander.digest (resolves);

            commander.explainToConsole (digested);
//            commander.storeOnGoogleDriveSpreadsheet (digested);
//            commander.snitchOnSlack (digested);

//            var repoStats = this.snitch (digestedRepoStats);
//        var contributorStats = this.snitch (digestedContributorStats);
//
//        console.log (repoStats);
//        console.log (contributorStats);
//
//        if (process.env.SLACK_ENABLE == 'true') {
//            this.slack (repoStats);
//            this.slack (contributorStats);
//        }

//        return;

        })
//        .catch(function(e) {
//            console.log ('Aborted: ');
//            console.error(e);
//        });
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


    DeveloperStatsCommander.prototype.explainToConsole = function(digested) {

        var tree = this.convertDigestedToTree (digested, 'author', 'timestamp', 'commits');
        var table = this.convertTreeToTable ('-', tree);

//        var authorStats = this.flattenAndSort (digested, 'timestamp', 'author', 'commits', 'asc');

//        console.log (tree);

        for (var i = 0; i < table.length; i++) {

            var message = '';

            for (var j = 0; j < table [i].length; j++) {
                message += ((typeof table [i][j] == 'undefined')? 0 : table [i][j]) + '\t';
            }

            console.log (message);
        }

//        console.log (table);

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
            break;
        }

        for (var i = 0; i < 1 /*rows.length*/; i++) {
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

//        for (var p in tree) {
//
//            headers.push (p);
//            var row = []; 
//
//            for (var q in tree [p]) {
//                if (row.length == 0) {
//                    row.push (q);
//                }
//
//                row.push (tree [p][q]);
//            }
//
//            body.push (row);
//        }

        return [headers].concat (body);
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


    DeveloperStatsCommander.prototype.filterRepos = function(repos) {
        return repos.filter (function (repo) {

            if ((process.env.EXCLUDE_FORKS == 'true') && repo.fork) {
                console.log (repo.name + ' is a fork. excluding.');
                return false;
            }
    
            var regexp = process.env.TEST_REPOS_REGEXP;
    
            if ((typeof (regexp) != 'string') || regexp == '') {
                return true;
            }
    
            if (repo.name.match (new RegExp(regexp))) {
                console.log (repo.name + ' matches ' + regexp + '. excluding.');
                return false;
            }
    
            return true;
        });
    };

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

                    var entry = {
                        timestamp : weeklyStats.weeks[w].w,
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

        var sh = 'curl -X POST --data-urlencode \'payload={"username": "' + process.env.SLACK_USERNAME + '", "text": "'+ message + '", "icon_emoji": "' + process.env.SLACK_EMOJI + '"}\' ' + process.env.SLACK_URL;

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
