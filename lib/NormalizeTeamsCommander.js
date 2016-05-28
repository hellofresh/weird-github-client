module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var fs = require('fs');

    var NormalizeReposCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
    };

    NormalizeReposCommander.prototype.start = function() {
        
        var commander = this;

        var config = [
        {
            id: 2025781, // devs
            name: 'Devs',
            permission: 'push'
        },
        {
            id: 2025792, // pm
            name: 'PM',
            permission: 'push'
        },
        {
            id: 2025789, // qa
            name: 'QA',
            permission: 'push'
        },
        {
            id: 2026865, // bots
            name: 'Bots',
            permission: 'pull'
        }]

        this.normalizeTeams ('hellofresh', config)
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    NormalizeReposCommander.prototype.normalizeTeams = function (organization, config) {
        var commander = this;
        return Q.allSettled (config.map (function (team) {
                console.log ('Updating ' + team.name + '(' + team.id + ') with ' + team.permission + '...')
                return commander.githubWrapper.updateTeam (team.id, team.name, team.permission);
            }));
    }

    
    return NormalizeReposCommander;

}());
