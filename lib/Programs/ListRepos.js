module.exports = (function() {

    var ListRepos = function(commander) {
        this.commander = commander;
    };

    ListRepos.prototype.run = function() {
        var commander = this.commander;
        
        commander.run ()
        .then (function (organization) {
            return commander.getRepos (organization);
        })
        .then (function (repos) {
            return commander.echoTable (repos, ['id', 'name', 'description']);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return ListRepos;

}());

