module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var Commander = function() {
        this.init ();
    };

    Commander.prototype.init = function() {
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

    Commander.prototype.getGithubTeams = function (organization) {
        return this.githubWrapper.getOrgTeams (organization);
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

    return Commander;

}());
