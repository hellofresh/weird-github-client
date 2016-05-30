module.exports = (function() {

    var SetTeamPermissions = function(commander) {
        this.commander = commander;
    };

    SetTeamPermissions.prototype.run = function() {
        var commander = this.commander;
        var team = null;
        
        commander.run ()
        .then (function (organization) {
            return commander.getTeams (organization);
        })
        .then (function (teams) {
            return commander.askForTeam (teams);
        })
        .then (function (_team) {
            team = _team;
            return commander.askForString ('Which permissions to apply to the team? (pull, push, admin)', 'pull');
        })
        .then (function (permission) {
            return commander.updateTeam (team.id, team.name, permission);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return SetTeamPermissions;

}());
