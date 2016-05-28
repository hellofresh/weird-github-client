module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');
    var exec = require('child_process').exec;

    var Commander = function(name, message) {
        this.version = 'beta';

        this.name = name;
        this.message = message;

        this.init ();
    };

    Commander.prototype.init = function() {
        this.say ('weird-github-client by HelloFresh (' + this.version + ')');
        this.say ('[' + this.name + '] ' + this.message);

        var GithubWrapper = require('./GithubWrapper');

        this.githubWrapper = new GithubWrapper({
            token: process.env.GITHUB_API_TOKEN,
        });
    }

    Commander.prototype.run = function () {
        return this.askForOrg ();
    }

    Commander.prototype.askForOrg = function () {
        return this.askForString ('Name of your organization on github.com', process.env.DEFAULT_ORGANIZATION)
    };

    Commander.prototype.askForObject = function(objects, message, labelProperty, valueProperty) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < objects.length; i++) {
            choices.push (objects[i][labelProperty]);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'answer',
                message: message ? message : 'Pick an option',
                choices: choices
            }
        ], function(answers) {
            var chosen = null;
    
            for(var i = 0; i < objects.length; i++) {
                if (objects[i][labelProperty] == answers.answer) {
                    chosen = valueProperty ? objects[i][valueProperty] : objects[i];
                    break;
                }
            }

            deferred.resolve(chosen);
        });

        return deferred.promise;
    };



    Commander.prototype.askForTeam = function(teams, message, property) {
        return this.askForObject (teams, message ? message : 'Pick a team', 'name', property);
    };

    Commander.prototype.askForRepo = function(repos, message, property) {
        return this.askForObject (repos, message ? message : 'Pick a repo', 'name', property);
    };

    Commander.prototype.askForBranch = function(branches, message) {
        return this.askForObject (branches, message ? message : 'Pick a branch', 'name', property);
    };


    Commander.prototype.askForString = function (message, dfault) {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message: message,
                default: dfault
            }
        ], function(answers) {
            deferred.resolve(answers.answer);
        });

        return deferred.promise;
    };

    Commander.prototype.askForArray = function (message, dfault) {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'answer',
                message: message,
                default: dfault
            }
        ], function(answers) {
            deferred.resolve(answers.answer.split (','));
        });

        return deferred.promise;
    };


    Commander.prototype.doubleCheck = function(message) {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: message,
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

    Commander.prototype.archiveRepo = function(organization, repo, branch, archive) {
        var commander = this;

        return this.doubleCheck ('Archive repo ' + organization + '/' + repo + '@' + branch + ' into ' + organization + '/' + archive + '?')
        .then (function () {
            return commander.execArchiveRepo (organization, repo, branch, archive);
        })
        .catch (function (e) {
            commander.handleError (e);
        });
    }


    Commander.prototype.execArchiveRepo = function(organization, repo, branch, archive) {
        var deferred = Q.defer();

        var sh = 'git clone --depth=1 git@github.com:' + organization + '/' + archive +
                    ' && cd ' + archive +
                    ' && git subtree add --prefix=' + repo + ' git@github.com:' + organization + '/' + repo + '.git ' + branch +
                    ' && git push' +
                    ' && cd ..' +
                    ' && rm -rf ' + archive;

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



    Commander.prototype.updateTeam = function (id, name, permission) {
        this.say ('Updating ' + name + ' (' + id + ') with ' + permission);
        return this.githubWrapper.updateTeam (id, name, permission);
    };

    Commander.prototype.getTeams = function (organization) {
        this.say ('Getting teams for ' + organization);
        return this.githubWrapper.getOrgTeams (organization);
    };

    Commander.prototype.getRepos = function (organization) {
        return this.githubWrapper.getOrgRepos (organization);
    };

    Commander.prototype.getBranches = function (organization, repo) {
        return this.githubWrapper.getBranches (organization, repo);
    };

    Commander.prototype.deleteRepo = function (organization, repo) {
        var commander = this;

        return this.doubleCheck ('Do you want to delete the archived repo ' + organization + '/' + repo + ' from github?')
        .then (function () {
            return commander.githubWrapper.deleteRepo (organization, repo);
        })
        .catch (function (e) {
            commander.handleError (e);
        });
    };

    Commander.prototype.echoTable = function (data, props) {

        if (!props) {
            console.log (data);
            return Q.resolve (true);
        }

        for (var i = 0; i < data.length; i++) {
            var line = '';

            for (var j = 0; j < props.length; j++) {
                line += data [i][props [j]] + '\t';
            }

            console.log (line);
        }

        return Q.resolve (true);
    };

    Commander.prototype.ensureTeams = function (organization, repo, teams) {
        var commander = this;

        if (!teams) {
            return Q.reject ({error : 'No teams to normalize repo'});
        }

        return Q.allSettled (teams.map (function (team) {
            console.log ('Adding team ' + team + ' to ' + organization + '/' + repo + '...')
            return commander.githubWrapper.addTeamToRepo (organization, repo, team);
        }));
    }

    Commander.prototype.commitPullApproveYml = function (organization, repo, message) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:' + organization + '/' + repo +
                    ' && cd ' + repo +
                    ' && if [[ $(cat .pullapprove.yml | wc -l | awk \'{ print $1 }\') == 1 ]]' +
                    '    && [[ $(grep \'extends: hellofresh\' .pullapprove.yml) ]] ;' +
                    '       then echo "All good!"; ' +
                    '       else echo "extends: hellofresh" > \'.pullapprove.yml\'' +
                    '            && git add .' +
                    '            && git commit -m "' + (message ? message : 'Weird Github Client commiting pullapprove.yml') + '" ' +
                    '            && git push origin master ; ' +
                    '   fi' +
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
    }

    Commander.prototype.addToPullApprove = function (organization, repo) {
        console.log ('Adding to pullapprove...');
        var deferred = Q.defer();

        var sh = 'curl -X POST -H "Content-Type:application/json" -H "Authorization: Token ' + process.env.PULLAPPROVE_API_TOKEN + '" -d \'{"name":"' + repo + '"}\' https://pullapprove.com/api/orgs/' + organization + '/repos/';

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

    Commander.prototype.handleError = function (err) {
        this.say ('Weird GitHub Client aborted.');
        this.say ('Error follows')
        console.log(err);
        this.say ('Sorry about that.');
    }

    Commander.prototype.say = function (message) {
        console.log ('> ' + message);
    }

    return Commander;

}());
