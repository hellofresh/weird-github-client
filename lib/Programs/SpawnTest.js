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

/*
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
        var team = null;
        var candidate = null;
        var repo = null;
        var target = null;

        this.askForOrg()
        .then(function (_organization) {
            organization = _organization;
            return commander.githubWrapper.getTeams (organization);
        })
        .then(function (teams) {
            return commander.askForTeam (teams);
        })
        .then(function (_team) {
            team = _team;
            return commander.askForCandidateUsername ();
        })
        .then(function (_candidate) {
            candidate = _candidate;
            return commander.askForRepo ();
        })
        .then(function (_repo) {
            repo = _repo;
            return commander.askForPermission ()
        })
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
        })
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

    SpawnTechnicalTestCommander.prototype.askForTeam = function(teams) {
        var deferred = Q.defer();

        var choices = [];
        for(var i = 0; i < teams.length; i++) {
            choices.push (teams[i].name);
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'team',
                message: 'Pick a team to review the test',
                choices: choices
            }
        ], function(answers) {
            var chosen = null;
    
            for(var i = 0; i < teams.length; i++) {
                if (teams[i].name == answers.team) {
                    chosen = teams[i];
                    break;
                }
            }

            deferred.resolve(chosen);
        });

        return deferred.promise;
    };

    SpawnTechnicalTestCommander.prototype.askForCandidateUsername = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'candidate',
                message: 'Github username of the candidate'
            }
        ], function(answers) {
            deferred.resolve(answers.candidate);
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

    SpawnTechnicalTestCommander.prototype.askForRepo = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'repo',
                message: 'Name of the repo to clone, without the organization name'
            }
        ], function(answers) {
            deferred.resolve(answers.repo);
        });

        return deferred.promise;
    };

    SpawnTechnicalTestCommander.prototype.cloneRepo = function(organization, repo, target) {
        var deferred = Q.defer();

        var sh = 'git clone git@github.com:' + organization + '/' + repo +
                    ' && cd ' + repo +
                    ' && git remote set-url origin git@github.com:' + organization + '/' + target +
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

*/