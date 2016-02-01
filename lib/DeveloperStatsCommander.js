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

            repos = repos.filter (function (repo) {
                if (repo.fork) {
                    console.log (repo.name + ' is fork.');
                    return false;
                }

                if (repo.name.indexOf('-test') > -1)
                    return false;

                return true;
            });

            return Q.allSettled (repos.map (function (repo) {
//                console.log (repo); return;
                    console.log ('Getting stats for ' + repo.name + '...')
                    return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
            }));
        })
        .then(function (resolves) {
            commander.digest (resolves);
            return null;
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

    DeveloperStatsCommander.prototype.digest = function (resolves) {

        var values = this.extractAndEnsureValues (resolves);

        var digestedContributorStats = {}; 
        var digestedRepoStats = {}; 

        for (var i = 0 ; i < values.length; i++) {

            var originalStatsPayload = values [i];
            var repo = originalStatsPayload.repo;

            for (var p in originalStatsPayload) {

                if (isNaN (p)) {
                    continue;
                }

                var weeklyStats = originalStatsPayload [p];

                for (var w = 0; w < weeklyStats.weeks.length; w++) {

                    var statsTimestamp = weeklyStats.weeks[w].w;
                    var thisWeekTimestamp = moment().startOf('week').add(1, 'hour').format('X');

                    if (statsTimestamp != thisWeekTimestamp) {
                        continue;
                    }

                    if (typeof digestedContributorStats [weeklyStats.author.login] == 'undefined') {
                        digestedContributorStats [weeklyStats.author.login] = {};
                    }

                    if (typeof digestedRepoStats [repo] == 'undefined') {
                        digestedRepoStats [repo] = {};
                    }

                    var entry = {
                        commits: weeklyStats.weeks[w].c,
                        added : weeklyStats.weeks[w].a,
                        deleted : weeklyStats.weeks[w].d,
                        changed : weeklyStats.weeks[w].a + weeklyStats.weeks[w].d
                    };

                    if (entry.commits == 0) {
                        continue;
                    }

                    digestedContributorStats [weeklyStats.author.login][repo] = entry;
                    digestedRepoStats [repo][weeklyStats.author.login] = entry;
                }
            }
        }

        var repoStats = this.snitch (digestedRepoStats);
        var contributorStats = this.snitch (digestedContributorStats);

        if (process.env.SLACK_ENABLE == 'true') {
            this.slack (repoStats);
            this.slack (contributorStats);
        }


/*
        var sh = 'curl -X POST --data-urlencode \'payload={"username": "snitchbot", "text": "'+ repoStats + '\n' + contributorStats + '", "icon_emoji": ":bar_chart:"}\' ' + process.env.SLACK_DEVELOPER_STATS;

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                throw error;
            } else {
                console.log ('done');
            }
        });
*/
        return;
    }


    DeveloperStatsCommander.prototype.slack = function (message) {

        var payload = {};

        payload.username = process.env.SLACK_USERNAME;
        payload.emoji = process.env.SLACK_EMOJI;
        payload.text = message;

        var sh = 'curl -X POST --data-urlencode \'' + JSON.stringify (payload) + '\' ' + process.env.SLACK_DEVELOPER_STATS;

        console.log (sh);

//        exec(sh, function(error, stdout, stderr) {
//            if (error) {
//                throw error;
//            }
//        });
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

/*
    }
            var digested = {};
            var digestedAdditions = {};
            var digestedDeletions = {};

            for (var i = 0; i < resolves.length; i++) {


console.log (resolves [i]); return;
                var resolved = resolves [i];
                var stats = null;
                var repo = null;

//console.log (repo);

                if (!resolved || resolved.state != 'fulfilled') {
                    return Q.reject(resolved.reason);
                }


                stats = resolved.value;
                repo = stats.repo;

                if (stats == null) {
                    console.log ("Waiting for some stats to generate. Try again in a minute...")
                    return;
                }
//console.log (stats); return;

                for (var p in stats) {
                    if (isNaN (p)) {
                        continue;
                    }

                    var contributorStats = stats [p];


                    for (var w = 0; w < contributorStats.weeks.length; w++) {

                        if (contributorStats.weeks[w].w == moment().startOf('week').add(1, 'hour').format('X')) {
                            if (typeof digested [contributorStats.author.login] == 'undefined') {
                                digested [contributorStats.author.login] = {};
                            }

                            if (typeof digestedAdditions [contributorStats.author.login] == 'undefined') {
                                digestedAdditions [contributorStats.author.login] = {};
                            }

                            if (typeof digestedDeletions [contributorStats.author.login] == 'undefined') {
                                digestedDeletions [contributorStats.author.login] = {};
                            }

                            digested [contributorStats.author.login][repo] = contributorStats.weeks[w].c;
                            digestedAdditions [contributorStats.author.login][repo] = contributorStats.weeks[w].a;
                            digestedDeletions [contributorStats.author.login][repo] = contributorStats.weeks[w].d;
                        }
                    }

                }

            }


            var zeroes = [];


            var message = '*Contributions to `master` so far this week*\n';
            var repoTotals = {};

            for (var p in digested) {

                var total = 0;
                var totalAdditions = 0;
                var totalDeletions = 0;
                var line = '';
                var notes = '';

                for (var repoName in digested [p]) {
                    if (digested[p][repoName] == 0)
                        continue;

                    if (repos.indexOf (repoName) == -1)
                        repos.push (repoName);

                    if (typeof (repoTotals [repoName]) == 'undefined') {
                        repoTotals[repoName] = 0;
                    }

                    if (notes != '') {
                        notes += ', ';
                    }

                    notes += repoName + ': ' + digested[p][repoName];
                    total += digested[p][repoName];
                    totalAdditions += digestedAdditions[p][repoName];
                    totalDeletions += digestedDeletions[p][repoName];
                    repoTotals [repoName] += digested[p][repoName];
                }


                if (total == 0) {
                    zeroes.push (p);
                    continue;
                }

                notes = '(' + notes + ')';

                line += '`' + ('   ' + total).substr(-3) + '` ';
                line += '`' + ('      +' + totalAdditions).substr(-6) + '` ';
                line += '`' + ('      -' + totalDeletions).substr(-6) + '` ';
                line += p + ' ';
                line += notes;
                line += '\n';

                message += line;

            }

            message += '\n';

            message += 'No contributions from: ';

            for (var i = 0; i < zeroes.length; i++) {
                message += zeroes [i] + ((i == zeroes.length - 2) ? ' and ' : ((i == zeroes.length - 1) ? '.' : ', '));
            }

            message += '\n';
            message += '\n';
            message += '*Commits to `master` per repo*';
            message += '\n';

            for (var p in repoTotals) {

                var line = '';

                line += '`' + ('   ' + repoTotals [p]).substr(-3) + '` ';
                line += p + ' ';
                line += '\n';

                message += line;
            }

            message += '\n';

            console.log (message);

return;

            var sh = 'curl -X POST --data-urlencode \'payload={"username": "snitchbot", "text": "'+ message + '", "icon_emoji": ":bar_chart:"}\' https://hooks.slack.com/services/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';

            exec(sh, function(error, stdout, stderr) {
                if (error) {
                    throw error;
                } else {
                    console.log ('done');
                }
            });
*/

    DeveloperStatsCommander.prototype.extractAndEnsureValues = function (resolves) {

        var result = [];

        for (var i = 0; i < resolves.length; i++) {

            if (resolves [i].state != 'fulfilled') {
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
