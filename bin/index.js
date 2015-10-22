#!/usr/bin/env node

require('dotenv').load();


module.exports = (function() {

    var inquirer = require('inquirer');
    var exec = require('child_process').exec;

    var token = process.env.GITHUB_API_TOKEN;

    if (!token) {
        console.log ('please add GITHUB_API_TOKEN to your .env file.');
        return false;
    }

    var candidate = process.env.DEFAULT_CANDIDATE;
    var repo = process.env.DEFAULT_REPO;
    var org = process.env.DEFAULT_ORGANIZATION;
    var team = process.env.DEFAULT_REVIEWER_TEAM_ID;
    var debug = process.env.DEBUG;

    // initalize github client
    var GitHubApi = require('github');
    
    var github = new GitHubApi({
        version: '3.0.0',
        debug: debug,
        protocol: 'https',
        host: 'api.github.com',
        pathPrefix: null,
        timeout: 5000,
        headers: {
            'user-agent': 'HelloFresh Candidate Repo Script'
        }
    });


    github.authenticate({
        type: 'oauth',
        token: token
    });

//        uncomment this if you want to just check the team ids, you might need it if you want to change teams.
//        github.orgs.getTeams ({'org': 'hellofresh'}, function (err, res){    console.log(JSON.stringify(res));});
//        return;


    inquirer.prompt([
        {
            type: 'input',
            name: 'candidate',
            message: 'Github username of the candidate (default: ' + candidate + '):'
        },
        {
            type: 'input',
            name: 'repo',
            message: 'Name of the repo to clone, without the organization name (default: ' + repo + '):'
        },
        {
            type: 'input',
            name: 'org',
            message: 'Name of your organization (default: ' + org + '):'
        },
        {
            type: 'input',
            name: 'team',
            message: 'Reviewer team ID. It\'s an integer. (default: ' + team + '):'
        }

    ], function(answers) {
        if (answers.candidate) {
            candidate = answers.candidate;
        }

        if (answers.repo) {
            repo = answers.repo;
        }

        if (answers.org) {
            org = answers.org;
        }

        if (answers.team) {
            team = answers.team;
        }

        if (!candidate || !repo || !org || !team) {
            console.log ('bad info!');
            return;
        }

        var target = candidate + '-' + repo;

        console.log ('creating repo ' + org + '/' + target);
        github.repos.createFromOrg ({'name':  target, 'private' : true, 'org': org, 'team_id':team}, function (err, res){

            if (err) {
                console.log ('something went wrong creating repo');
                console.log (err);
                return;
            }

            console.log ('cloning ' + repo + ' into local machine, and pushing to ' + target);
            var sh = 'git clone git@github.com:hellofresh/' + repo +
                        '&& cd ' + repo +
                        '&& git remote set-url origin git@github.com:hellofresh/' + target +
                        '&& git push origin master' +
                        '&& cd ..' + 
                        '&& rm -rf ' + repo;
            
            exec (sh, function (error, stdout, stderr) {
                console.log (error);
                console.log (stdout);
                console.log (stderr);

                if (error) {
                    console.log ('something went wrong duplicating the repo.');
                    return;
                }
            });

            console.log ('sharing repo with candidate ' + candidate);
            
            github.repos.addCollaborator ({
                'repo':  target,
                'user': org,
                'collabuser' : candidate
            }, function (err, res) {
                if (!err) {
                    console.log ('added ' + candidate + ' to ' + target)
                    return;
                } else {
                    console.log ('something went wrong sharing repo with candidate.');
                    return;
                }
            });
        });
    });
})();


