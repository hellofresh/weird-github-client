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
            repos.map (function (repo)) {
                console.log (organization + '/' + repo.name + '\t' + repo.description);

            }
            console.log ('finished');
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };


    return ListReposCommander;

}());
