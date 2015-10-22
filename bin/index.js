#!/usr/bin/env node

require('dotenv').load();


module.exports = (function() {

    var output = function (error, stdout, stderr){
        console.log('error:');
        console.log(error);
        console.log('stdout');
        console.log(stdout);
        console.log('stderr');
        console.log(stderr);
    };



    var inquirer = require('inquirer');
    var settings = {repo:null, user: null};
    var exec = require('child_process').exec;

    var GitHubApi = require("github");
    
    var github = new GitHubApi({
        // required
        version: "3.0.0",
        // optional
        debug: true,
        protocol: "https",
        host: "api.github.com", // should be api.github.com for GitHub
        pathPrefix: null, // for some GHEs; none for GitHub
        timeout: 5000,
        headers: {
            "user-agent": "HelloFresh Candidate Repo Script" // GitHub is happy with a unique user agent
        }
    });

    github.authenticate({
        type: "oauth",
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
            settings.repo = answers.repo;
        }

        if (answers.user) {
            settings.user = answers.user;
        }

        if (!settings.repo || !settings.user) {
            console.log ("bad info!");
            return;
        }

        //github.orgs.getTeams ({"org": "hellofresh"}, function (err, res){    console.log(JSON.stringify(res));});
        github.repos.createFromOrg ({"name":  settings.user + '-' + settings.repo, "private" : true, "org": "hellofresh", "team_id":"406537"}, function (){
            exec ('git clone git@github.com:hellofresh/' + settings.repo + ' && cd ' + settings.repo + ' && git remote set-url origin git@github.com:hellofresh/' + settings.user + '-' + settings.repo + ' && git push origin master && cd .. && rm -rf ' + settings.repo , function (error, stdout, stderr) {
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

            github.repos.addCollaborator ({"repo":  settings.user + '-' + settings.repo, "user": 'hellofresh', "collabuser" : settings.user}, function (err, res){  if (!err) console.log ("added " + settings.user + ' to ' + settings.user + '-' + settings.repo)});

        });

    });


})();


