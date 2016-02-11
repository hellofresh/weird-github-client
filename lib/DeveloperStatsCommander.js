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

            return Q.allSettled (repos.map (function (repo) {
                    console.log ('Getting stats for ' + repo.name + '...')
                    return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
            }));
        })
        .then(function (resolves) {
            console.log ('Stats obtained.')
            commander.digest (resolves);
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

        console.log (repoStats);
        console.log (contributorStats);

        if (process.env.SLACK_ENABLE == 'true') {
            this.slack (repoStats);
            this.slack (contributorStats);
        }

        return;
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
