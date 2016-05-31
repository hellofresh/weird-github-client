module.exports = (function() {

    var NormalizeRepo = function(commander) {
        this.commander = commander;
    };

    NormalizeRepo.prototype.run = function() {
        var commander = this.commander;
        var organization = null;
        var repo = null;
        var teams = null;
        
        return commander.run ()
        .then (function (_organization) {
            organization = _organization;
            return commander.askForString ('Pick a repo to normalize');
        })
        .then (function (_repo) {
            repo = _repo;
            return commander.askForArray ('Comma separated team ids to attach to ' + organization + '/' + repo, process.env.GITHUB_TEAMS);
        })
        .then (function (teams) {
            return commander.ensureTeams (organization, repo, teams)
        })
        .then (function () {
            return commander.commitPullApproveYml (organization, repo);
        })
        .then (function () {
            return commander.addToPullApprove (organization, repo);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return NormalizeRepo;

}());

