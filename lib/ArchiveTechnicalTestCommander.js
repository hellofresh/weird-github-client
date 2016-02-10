module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;

    var ArchiveTechnicalTestCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    ArchiveTechnicalTestCommander.prototype.start = function() {
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
                    return false;
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

    ArchiveTechnicalTestCommander.prototype.askForOrg = function() {
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

    ArchiveTechnicalTestCommander.prototype.askForRepo = function(repos) {
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

    ArchiveTechnicalTestCommander.prototype.askForBranch = function(branches) {
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


    ArchiveTechnicalTestCommander.prototype.askForPermission = function(message) {
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


    ArchiveTechnicalTestCommander.prototype.archiveRepo = function(organization, repo, branch, archive) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:' + organization + '/' + archive +
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

    return ArchiveTechnicalTestCommander;

}());
