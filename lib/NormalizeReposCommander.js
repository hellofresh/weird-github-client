module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var NormalizeReposCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
    };

    NormalizeReposCommander.prototype.start = function() {
        
        var commander = this;

        this.getRepo ('hellofresh', 'pullapprove-test')
        .then (function (_repo) {
            repo = _repo;
            return commander.normalizeRepo (repo);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    NormalizeReposCommander.prototype.getRepo = function(organization, repo) {
        console.log ('Getting ' + organization + '/' + repo + '...');
        return this.githubWrapper.getRepo (organization, repo);
    }

    NormalizeReposCommander.prototype.normalizeRepo = function(repo) {
        console.log ('Normalizing ' + repo.full_name + '...');

        var commander = this;

        /*
        1. check repo teams
          - dev, qa, pm, bots
          - if these teams are not there, then add them
          - leave other teams intact

        2. check branch protection
          - check all repos have the same branch protection

        3. add pull approve yml file

        4. add repo to pullapprove
        */



        return this.normalizeTeams (repo, ['devs', 'qa', 'pm', 'bots'])
        .then (function () {
            return commander.protectBranches (repo);
        })
        .then (function () {
            return commander.commitPullApproveYml (repo);
        })
        .then (function () {
            return commander.addToPullApprove (repo);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    }

    NormalizeReposCommander.prototype.normalizeTeams = function (repo, expectedTeams) {
        var commander = this;

        if (!expectedTeams) {
            expectedTeams = [];
        }

        return Q.allSettled (expectedTeams.map (function (team) {
                console.log ('Adding ' + team + ' for ' + repo + '...')
                return commander.githubWrapper.addTeamToRepo (repo.owner.login, repo.name, team);
            }));
    }

    
    return NormalizeReposCommander;

}());
