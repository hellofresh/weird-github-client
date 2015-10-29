module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;

    var Commander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    Commander.prototype.start = function() {
        var commander = this;
        var team = null;
        var candidate = null;

        this.askForOrg()
            .then(function (organization)) {
                return commander.githubWrapper.getTeams (organization);
            })
            .then(function (teams) {
                return commander.askToPickReviewingTeam (teams);
            })
            .then(function (_team)) {
                team = _team;

                return commander.askForCandidateUsername ();
            })
            .then(function (_candidate)) {
                candidate = _candidate;

                return commander.askForRepo ();
            }
            .then (function (repo) {
                return commander.cloneRepo ();
            })
            .catch(function(e) {
                console.error(e);
            });


            /*
            .then(function(_candidate) {
                candidate = _candidate;

                target = candidate.candidate + '-' + candidate.repo;
                console.log('>>> Creating repo ' + candidate.org + '/' + target);

                return commander.githubWrapper.getTeam(candidate);
            })
            .then(function(_team) {

                console.log (_team);
                team = _team;

                return commander.githubWrapper.createFromOrg(target, candidate, team.id);
            })
            .then (function(res) {
                console.log (res); return;
                return commander.githubWrapper.updateTeam(team.id, target, 'push');
            })
            .then(function() {
                return commander.cloneRepo(target, candidate);
            })*/
    };



    Commander.prototype.askForOrg = function() {
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



    Commander.prototype.getCandidate = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'candidate',
                message: 'Github username of the candidate',
                default: process.env.DEFAULT_CANDIDATE
            },
            {
                type: 'input',
                name: 'repo',
                message: 'Name of the repo to clone, without the organization name',
                default: process.env.DEFAULT_REPO
            },
            {
                type: 'input',
                name: 'org',
                message: 'Name of your organization',
                default: process.env.DEFAULT_ORGANIZATION
            },
            {
                type: 'input',  
                name: 'teamName',
                message: 'Name of your team',
                default: process.env.DEFAULT_TEAM_NAME
            }
        ], function(answers) {
            deferred.resolve(answers);
        });

        return deferred.promise;
    };

    Commander.prototype.cloneRepo = function(target, candidate) {
        var deferred = Q.defer();

        console.log('Cloning ' + candidate.repo + ' into local machine, and pushing to ' + target);

        var sh = 'git clone git@github.com:hellofresh/' + candidate.repo +
                    '&& cd ' + candidate.repo +
                    '&& git remote set-url origin git@github.com:hellofresh/' + target +
                    '&& git push origin master' +
                    '&& cd ..' +
                    '&& rm -rf ' + candidate.repo;

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    return Commander;

}());
