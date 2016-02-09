module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;

    var SpawnTechnicalTestCommander = function(githubWrapper) {
        this.githubWrapper = githubWrapper;
        this.answers = {};
    };

    SpawnTechnicalTestCommander.prototype.start = function() {
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

            console.log ('Going to archive:');
            console.log ('organization:' + organization);
            console.log ('repo:' + repo);
            console.log ('branch:' + branch);

            return commander.askForPermission ();
        })/*
        .then(function (){
            target = candidate + '-' + repo;
            console.log ('Creating repo ' + organization + '/' + target + ' and sharing with team ' + team.name + '.');
            return commander.githubWrapper.createFromOrg(organization, target, team.id);
        })
        .then(function (){
            console.log ('Cloning ' + repo + ' and pushing to ' + target + '.');
            return commander.cloneRepo(organization, repo, target);
        })
        .then(function (){
            console.log ('Sharing with candidate ' + candidate);
            return commander.githubWrapper.addCollaborator(organization, target, candidate);
        })*/
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    SpawnTechnicalTestCommander.prototype.askForOrg = function() {
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

    SpawnTechnicalTestCommander.prototype.askForRepo = function(repos) {
        var deferred = Q.defer();

        console.log (repos);
        console.log ('!!!!!!!!!!!');
        
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

    SpawnTechnicalTestCommander.prototype.askForBranch = function(branches) {
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


    SpawnTechnicalTestCommander.prototype.askForPermission = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to do this?',
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


    SpawnTechnicalTestCommander.prototype.cloneRepo = function(organization, repo, target) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:hellofresh/' + repo +
                    ' && cd ' + repo +
                    ' && git remote set-url origin git@github.com:hellofresh/' + target +
                    ' && git push origin master' +
                    ' && cd ..' +
                    ' && rm -rf ' + repo;

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

    return SpawnTechnicalTestCommander;

}());
