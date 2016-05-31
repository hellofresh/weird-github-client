module.exports = (function() {

    var ArchiveRepo = function(commander) {
        this.commander = commander;
    };

    ArchiveRepo.prototype.run = function() {
        var commander = this.commander;
        var organization = null;
        var repos = null;
        var branches = null;
        var repoToArchive = null;
        var branchToArchive = null;
        var archiveRepo = null;
        
        return commander.run ()
        .then(function (_organization) {
            organization = _organization;
            return commander.askForString ('Pick a repo to archive');
        })
        .then(function (_repo) {
            repoToArchive = _repo;
            return commander.getBranches(organization, repoToArchive);
        })
        .then(function (_branches) {
            branches = _branches;
            return commander.askForBranch (branches, 'Pick a branch from ' + organization + '/' + repoToArchive + ' to archive', 'name');
        })
        .then(function (_branch) {

            console.log (_branch);
            branchToArchive = _branch;
            return commander.askForString ('Pick a repo to use as archive');
        })
        .then(function (_repo) {
            archiveRepo = _repo;
            return commander.archiveRepo(organization, repoToArchive, branchToArchive, archiveRepo);
        })
        .then(function (){
            return commander.deleteRepo(organization, repoToArchive);
        })
        .catch(function(e) {
            return commander.handleError (e);
        });
    };

    return ArchiveRepo;

}());