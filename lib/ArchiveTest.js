module.exports = (function() {

    var ListRepos = function(commander) {
        this.commander = commander;
    };

    ListRepos.prototype.run = function() {
        var commander = this.commander;
        var organization = null;
        var repos = null;
        var branches = null;
        var repoToArchive = null;
        var branchToArchive = null;
        var archiveRepo = null;
        
        return commander.run ('Archives the branch of a repo, adding it as a git subtree of another repo. In the end you may choose to delete the archived repo. You will lose your PRs and comments but you will keep your commit history.')
        .then(function (_organization) {
            organization = _organization;
            return commander.getRepos (organization);
        })
        .then(function (_repos) {
            repos = _repos;
            return commander.askForRepo (repos, 'Pick a repo to archive');
        })
        .then(function (_repo) {
            repoToArchive = _repo;
            return commander.getBranches(organization, repoToArchive);
        })
        .then(function (_branches) {
            branches = _branches;
            return commander.askForBranch (branches);
        })
        .then(function (_branch) {
            branchToArchive = _branch;
            return commander.askForRepo (repos, 'Pick a repo to use as archive');
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

    return ListRepos;

}());

/*
module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;

    var ArchiveTest = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    ArchiveTest.prototype.start = function() {
        var commander = this;
        var organization = null;
        var candidate = null;
        var repo = null;
        var branch = null;
        var target = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getOrgRepos (organization);
        })
        .then(function (repos) {
            repos = repos.filter (function (repo) {

                var regexp = process.env.TEST_REPOS_REGEXP;

                if ((typeof (regexp) != 'string') || regexp == '') {
                    return true;
                }

                if (repo.name.match (new RegExp(regexp))) {
                    return true;
                }

                return false;
            });


            return commander.askForRepo (repos);
        })
        .then(function (_repo) {
            repo = _repo;
            return commander.githubWrapper.getBranches(organization, repo);
        })
        .then(function (branches) {
            return commander.askForBranch (branches);
        })
        .then(function (_branch) {
            branch = _branch;

            return commander.askForPermission ('Are you sure you want to archive the repo ' + organization + '/' + repo + '@' + branch + ' into ' + process.env.ARCHIVE_REPO + '?');
        })
        .then(function (){
            return commander.archiveRepo(organization, repo, branch, process.env.ARCHIVE_REPO);
        })
        .then(function (){
            return commander.askForPermission ('Do you want to delete the original repo ' + organization + '/' + repo + ' from github.com?');
        })
        .then(function (){
            return commander.githubWrapper.deleteRepo(organization, repo);
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    ArchiveTest.prototype.askForOrg = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'org',
                message: 'Name of your organization on github.com',
                default: process.env.DEFAULT_ORGANIZATION
            }
        ], function(answers) {
            deferred.resolve(answers.org);
        });

        return deferred.promise;
    };

    ArchiveTest.prototype.askForRepo = function(repos) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < repos.length; i++) {
            choices.push (repos[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'repo',
                message: 'Pick a repo to archive',
                choices: choices
            }
        ], function(answers) {
            deferred.resolve(answers.repo);
        });

        return deferred.promise;
    };

    ArchiveTest.prototype.askForBranch = function(branches) {
        var deferred = Q.defer();
        
        var choices = [];
        for(var i = 0; i < branches.length; i++) {
            choices.push (branches[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'branch',
                message: 'Pick a branch to archive',
                choices: choices
            }
        ], function(answers) {
            deferred.resolve(answers.branch);
        });

        return deferred.promise;
    };


    ArchiveTest.prototype.askForPermission = function(message) {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: message,
                default: false
            }
        ], function(answers) {
            if (answers.confirm) {
                deferred.resolve();
            } else {
                deferred.reject ();
            }
        });

        return deferred.promise;
    };


    ArchiveTest.prototype.archiveRepo = function(organization, repo, branch, archive) {
        var deferred = Q.defer();

        var sh = 'git clone --depth=1 git@github.com:' + organization + '/' + archive +
                    ' && cd ' + archive +
                    ' && git subtree add --prefix=' + repo + ' git@github.com:' + organization + '/' + repo + '.git ' + branch +
                    ' && git push' +
                    ' && cd ..' +
                    ' && rm -rf ' + archive;

        console.log (sh);

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    return ArchiveTest;

}());
*/