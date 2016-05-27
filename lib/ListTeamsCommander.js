module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var ListTeamsCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    ListTeamsCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var repo = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getOrgTeams (organization);
        })
        .then(function (teams) {
            console.log (teams);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    ListTeamsCommander.prototype.askForOrg = function() {
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

    return ListTeamsCommander;

}());
