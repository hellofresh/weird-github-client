module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;
    var fs = require('fs');

    var Commander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    Commander.prototype.spawnTechnicalTest = function() {
        var commander = this;
        var organization = null;
        var team = null;
        var candidate = null;
        var repo = null;
        var target = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getTeams (organization);
        })
        .then(function (teams) {
            return commander.askForTeam (teams);
        })
        .then(function (_team) {
            team = _team;
            return commander.askForCandidateUsername ();
        })
        .then(function (_candidate) {
            candidate = _candidate;
            return commander.askForRepo ();
        })
        .then(function (_repo) {
            repo = _repo;
            return commander.askForPermission ()
        })
        .then(function (){
            target = candidate + '-' + repo;
            console.log ('Creating repo ' + organization + '/' + target + ' and sharing with team ' + team.name + '.');
            return commander.githubWrapper.createFromOrg(organization, target, team.id);
        })
        .then(function (){
            console.log ('Cloning ' + repo + ' and pushing to ' + target + '.');
            return commander.cloneRepo(organization, repo, target);
        })
        .then(function (){
            console.log ('Sharing with candidate ' + candidate);
            return commander.githubWrapper.addCollaborator(organization, target, candidate);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    Commander.prototype.checkFourEyes = function() {
        var commander = this;
        var organization = null;
        var repo = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.askForRepo (organization);
        })
        .then(function (_repo) {
            repo = _repo;
            console.log ('Checking repo ' + organization + '/' + repo + '.');
            return commander.githubWrapper.getPullRequests (organization, repo);
        })
        .then(function (data) {
            return Q.allSettled (data.map (function (pullRequest) {
                return commander.githubWrapper.getPullRequest (organization, repo, pullRequest.number);
            }));
        })
        .then(function (resolves) {

            var content = '';
            var okCounter = 0;
            var koCounter = 0;

            for (var i = 0; i < resolves.length; i++) {
                var pr = resolves [i];

                if (resolves [i].state == 'fulfilled') {
                    pr = resolves[i].value;
                } else {
                    return Q.reject(resolves[i].reason);
                }

                var creator = (pr.user) ? pr.user.login : null;
                var merger = (pr.merged_by) ? pr.merged_by.login : null;
                var message = '';
                var isOk = (((creator != merger) || (merger == null)) ? true : false);

                if (isOk) {
                    okCounter++;
                } else {
                    koCounter++;
                }


                message += '#' + pr.number + '\t';
                message += pr.created_at + '\t';
                message += pr.state + '\t';
                message += creator + '\t';
                message += merger + '\t';
                message += ((isOk) ? 'OK' : 'KO') + '\t';
                message += pr.title;

                content += message + '\n';
            };

            var filename = organization + '-' + repo + '.tsv';

            fs.writeFile(filename, content, function(err) {
                if(err) {
                    throw err;
                }

                console.log (okCounter + ' pull requests are merged by someone other than the author.');
                console.log (koCounter + ' pull requests are merged by the author.');
                console.log('report saved on ' + filename);

                return true;
            });                 

        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
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

    Commander.prototype.askForTeam = function(teams) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < teams.length; i++) {
            choices.push (teams[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'team',
                message: 'Pick a team to review the test',
                choices: choices
            }
        ], function(answers) {
            var chosen = null;
    
            for(var i = 0; i < teams.length; i++) {
                if (teams[i].name == answers.team) {
                    chosen = teams[i];
                    break;
                }
            }

            deferred.resolve(chosen);
        });

        return deferred.promise;
    };

    Commander.prototype.askForCandidateUsername = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'candidate',
                message: 'Github username of the candidate',
                default: process.env.DEFAULT_CANDIDATE
            }
        ], function(answers) {
            deferred.resolve(answers.candidate);
        });

        return deferred.promise;
    };

    Commander.prototype.askForPermission = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to do this?',
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

    Commander.prototype.askForRepo = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'repo',
                message: 'Name of the repo to clone, without the organization name',
                default: process.env.DEFAULT_REPO
            }
        ], function(answers) {
            deferred.resolve(answers.repo);
        });

        return deferred.promise;
    };

    Commander.prototype.cloneRepo = function(organization, repo, target) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:hellofresh/' + repo +
                    ' && cd ' + repo +
                    ' && git remote set-url origin git@github.com:hellofresh/' + target +
                    ' && git push origin master' +
                    ' && cd ..' +
                    ' && rm -rf ' + repo;

        console.log (sh);

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
