module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var ListTeamsProgram = function(commander) {
        this.commander = commander;
    };

    ListTeamsProgram.prototype.run = function() {
        var organization = null;
        var commander = this.commander;
        
        commander.run ()
        .then (function (organization) {
            return commander.getGithubTeams (organization);
        })
        .then (function (teams) {
            return commander.echoTable (teams, ['id', 'name', 'permission', 'description']);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });

//        this.askForOrg()
//        .then(function (_organization) {
//            organization = _organization;
//            return commander.githubWrapper.getOrgTeams (organization);
//        })
//        .then(function (teams) {
//            console.log (teams);
//        })
    };

//    ListTeamsProgram.prototype.askForOrg = function() {
//        var deferred = Q.defer();
//
//        inquirer.prompt([
//            {
//                type: 'input',
//                name: 'org',
//                message: 'Name of your organization on github.com',
//                default: process.env.DEFAULT_ORGANIZATION
//            }
//        ], function(answers) {
//            deferred.resolve(answers.org);
//        });
//
//        return deferred.promise;
//    };

    return ListTeamsProgram;

}());
