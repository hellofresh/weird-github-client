module.exports = (function() {

    var ListRepos = function(commander) {
        this.commander = commander;
    };

    ListRepos.prototype.run = function() {
        var organization = null;
        var commander = this.commander;
        
        commander.run ()
        .then (function (organization) {
            return commander.getRepos (organization);
        })
        .then (function (teams) {
            return commander.echoTable (teams, ['id', 'name', 'description']);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return ListRepos;

}());

