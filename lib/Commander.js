module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');
    var exec = require('child_process').exec;

    var Commander = function() {
        this.init ();
    };

    Commander.prototype.init = function() {
        console.log ('Welcome to the Weird Github Client!');

        var GithubWrapper = require('./GithubWrapper');

        this.githubWrapper = new GithubWrapper({
            token: process.env.GITHUB_API_TOKEN,
        });
    }

    Commander.prototype.run = function () {
        return this.askForOrg ();
    }

    Commander.prototype.askForOrg = function () {
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

    Commander.prototype.askForRepo = function(repos, message) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < repos.length; i++) {
            choices.push (repos[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'repo',
                message: message ? message : 'Pick a repo',
                choices: choices
            }
        ], function(answers) {
            deferred.resolve(answers.repo);
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


    Commander.prototype.askForBranch = function(branches, message) {
        var deferred = Q.defer();
        
        var choices = [];
        for(var i = 0; i < branches.length; i++) {
            choices.push (branches[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'branch',
                message: message ? message : 'Pick a branch',
                choices: choices
            }
        ], function(answers) {
            deferred.resolve(answers.branch);
        });

        return deferred.promise;
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

    Commander.prototype.handleError = function (err) {
        this.say ('Weird GitHub Client aborted.');
        this.say ('Error follows')
        console.log(err);
        this.say ('Sorry about that.');
    }

    Commander.prototype.say = function (message) {
        console.log ('[' + message + ']');
    }

    return Commander;

}());
