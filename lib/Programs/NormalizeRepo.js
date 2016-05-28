module.exports = (function() {

    var NormalizeRepo = function(commander) {
        this.commander = commander;
    };

    NormalizeRepo.prototype.run = function() {
        var commander = this.commander;
        var organization = null;
        var repo = null;
        var teams = null;
        
        return commander.run ()
        .then (function (_organization) {
            organization = _organization;
            return commander.getRepos (organization);
        })
        .then (function (repos) {
            return commander.askForRepo (repos, 'Pick a repo to normalize');
        })
        .then (function (_repo) {
            repo = _repo;
            return commander.askForArray ('Comma separated team ids to attach to ' + organization + '/' + repo, process.env.GITHUB_TEAMS);
        })
        .then (function (teams) {
            return commander.ensureTeams (organization, repo, teams)
        })
        .then (function () {
            return commander.commitPullApproveYml (organization, repo);
        })
        .then (function () {
            return commander.addToPullApprove (organization, repo);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return NormalizeRepo;

}());

/*
module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');
    var exec = require('child_process').exec;

    var NormalizeReposCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
    };

    NormalizeReposCommander.prototype.start = function() {
        var commander = this;

        this.askForOrg ()
        .then (function (organization) {
            console.log ('Getting repos for ' + organization + '...');
            return commander.githubWrapper.getOrgRepos (organization);
        })
        .then (function (repos) {
            return commander.askForRepo (repos);
        })
        .then (function (repo) {
            return commander.normalizeRepo (repo);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    NormalizeReposCommander.prototype.askForRepo = function(repos) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < repos.length; i++) {
            choices.push (repos[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'repo',
                message: 'Pick a repo to archive',
                choices: choices
            }
        ], function(answers) {
            deferred.resolve(answers.repo);
        });

        return deferred.promise;
    };

    NormalizeReposCommander.prototype.askForOrg = function() {
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

    NormalizeReposCommander.prototype.getRepo = function(organization, repo) {
        console.log ('Getting ' + organization + '/' + repo + '...');
        return this.githubWrapper.getRepo (organization, repo);
    }

    NormalizeReposCommander.prototype.normalizeRepo = function(repo) {
        console.log ('Normalizing ' + repo.full_name + '...');
        var commander = this;

        return this.normalizeTeams (repo, [2025781, 2025792, 2025789, 2026865])
        .then (function () {
            return commander.commitPullApproveYml (repo);
        })
        .then (function () {
            return commander.addToPullApprove (repo);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    }

    NormalizeReposCommander.prototype.normalizeTeams = function (repo, expectedTeams) {
        var commander = this;

        if (!expectedTeams) {
            expectedTeams = [];
        }

        return Q.allSettled (expectedTeams.map (function (team) {
                console.log ('Adding team ' + team + ' to ' + repo.full_name + '...')
                return commander.githubWrapper.addTeamToRepo (repo.owner.login, repo.name, team, 'push');
            }));
    }

    NormalizeReposCommander.prototype.commitPullApproveYml = function (repo) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:' + repo.owner.login + '/' + repo.name +
                    ' && cd ' + repo.name +
                    ' && if [[ $(cat .pullapprove.yml | wc -l | awk \'{ print $1 }\') == 1 ]] && [[ $(grep \'extends: hellofresh\' .pullapprove.yml) ]] ; then echo "All good!"; else echo "extends: hellofresh" > \'.pullapprove.yml\' && git add . && git commit -m "weird-github-client normalizing repo and overwriting pullapprove" && git push origin master ; fi' +
                    ' && cd ..' +
                    ' && rm -rf ' + repo.name;

        console.log (sh);

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    NormalizeReposCommander.prototype.addToPullApprove = function (repo) {
        console.log ('Adding to pullapprove...');
        var deferred = Q.defer();

        var sh = 'curl -X POST -H "Content-Type:application/json" -H "Authorization: Token ' + process.env.PULLAPPROVE_API_TOKEN + '" -d \'{"name":"' + repo.name + '"}\' https://pullapprove.com/api/orgs/' + repo.owner.login + '/repos/';

        console.log (sh);

        exec(sh, function(error, stdout, stderr) {
            console.log (stdout)
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    
    return NormalizeReposCommander;

}());
*/