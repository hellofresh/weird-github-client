module.exports = (function() {

    var SpawnTest = function(commander) {
        this.commander = commander;
    };

    SpawnTest.prototype.run = function() {
        var commander = this.commander;
        var team = null;
        var username = null;
        var repo = null;
        var target = null;
        var organization = null;
        
        commander.run ()
        .then (function (_organization) {
            organization = _organization;
            return commander.getTeams (organization);
        })
        .then (function (teams) {
            return commander.askForTeam (teams, 'Pick a team to review the test');
        })
        .then (function (_team) {
            team = _team;
            return commander.askForString ('GitHub username of the candidate');
        })
        .then (function (_username) {
            username = _username;
            return commander.askForString ('Name of the repo with the test');
        })
        .then (function (_repo) {
            repo = _repo;
            target = username + '-' + repo;

            return commander.doubleCheck ('Are you sure you want to proceed?');
        })
        .then (function () {
            return commander.createRepo (organization, target, team.id);
        })
        .then(function (){
            commander.say ('Cloning ' + repo + ' and pushing to ' + target);
            return commander.cloneRepo(organization, repo, target);
        })
        .then(function (){
            commander.say ('Sharing with candidate ' + username);
            return commander.addCollaborator(organization, target, username);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return SpawnTest;

}());

