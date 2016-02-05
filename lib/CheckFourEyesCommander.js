module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var CheckFourEyesCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    CheckFourEyesCommander.prototype.start = function() {
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
            });                 

        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    CheckFourEyesCommander.prototype.askForOrg = function() {
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

    CheckFourEyesCommander.prototype.askForRepo = function() {
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

    return CheckFourEyesCommander;

}());
