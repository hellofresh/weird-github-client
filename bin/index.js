#!/usr/bin/env node

require('dotenv').load();


module.exports = (function() {
    var inquirer = require('inquirer');
    var repo = null;
    var user = null;
    var exec = require('child_process').exec;
    var org = 'hellofresh';
    var team = 1824421;

    // initalize github client
    var GitHubApi = require('github');
    
    var github = new GitHubApi({
        version: '3.0.0',
        debug: true,
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
        token: process.env.GITHUB_API_TOKEN
    });

    inquirer.prompt([
        {
            type: 'input',
            name: 'repo',
            message: 'Which repo do you want to duplicate (hellofresh/{this_name_here})?'
        },
        {
            type: 'input',
            name: 'user',
            message: 'Which user do you want to add to it?'
        },

    ], function(answers) {
        if (answers.repo) {
            repo = answers.repo;
        }

        if (answers.user) {
            user = answers.user;
        }

        if (!repo || !user) {
            console.log ('bad info!');
            return;
        }

        var target = user + '-' + repo;

//        uncomment this if you want to just check the team ids, you might need it if you want to change teams.
//        github.orgs.getTeams ({'org': 'hellofresh'}, function (err, res){    console.log(JSON.stringify(res));});
//        return;

        github.repos.createFromOrg ({'name':  target, 'private' : true, 'org': org, 'team_id':'406537'}, function (){
            exec ('git clone git@github.com:hellofresh/' + repo + ' && cd ' + repo + ' && git remote set-url origin git@github.com:hellofresh/' + target + ' && git push origin master && cd .. && rm -rf ' + repo , function (error, stdout, stderr) {
                if (!error) {
                    console.log (stdout);
                    console.log ('finished!');
                }
                else
                {
                    console.log (error);
                    console.log (stderr);
                }
            });

            github.repos.addCollaborator ({'repo':  target, 'user': org, 'collabuser' : user}, function (err, res){  if (!err) console.log ('added ' + user + ' to ' + target)});
        });
    });
})();


