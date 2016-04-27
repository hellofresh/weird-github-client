module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var ListReposCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    ListReposCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var repo = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getOrgRepos (organization);
        })
        .then(function (repos) {
            repos.map (function (repo) {

                if (repo.fork) {
                    return;
                }

                if (
                    repo.name.indexOf ('-backend-test') > -1 ||
                    repo.name.indexOf ('-frontend-test') > -1 ||
                    repo.name.indexOf ('-sysadmin-test') > -1 ||
                    repo.name.indexOf ('-data-engineering-test') > -1 ||
                    repo.name.indexOf ('code-test') > -1 ||
                    repo.name.indexOf ('-ios-test') > -1 || 
                    repo.name.indexOf ('-android-test') > -1 ||
                    repo.name.indexOf ('-qa-test') > -1 ||
                    repo.name.indexOf ('test-archive') > -1 ||
                    ) {
                    return;
                }

                console.log (organization + '/' + repo.name + '\t' + repo.description);

            });
            console.log ('finished');
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    ListReposCommander.prototype.askForOrg = function() {
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

    return ListReposCommander;

}());
