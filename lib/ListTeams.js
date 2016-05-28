module.exports = (function() {

    var ListGithubTeams = function(commander) {
        this.commander = commander;
    };

    ListGithubTeams.prototype.run = function() {
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
            return commander.handleError (e);
        });
    };

    return ListGithubTeams;

}());