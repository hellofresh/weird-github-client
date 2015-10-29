module.exports = (function() {

    var GitHubApi = require('github');
    var Q = require('q');

    var GithubWrapper = function() {
        this.github = GithubWrapper.loadConfig();
    };

    GithubWrapper.loadConfig = function() {
        var github = new GitHubApi({
            version: '3.0.0',
            debug: process.env.DEBUG === 'true',
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

        return github;
    };


    // creates repo in organization
    GithubWrapper.prototype.createFromOrg = function(organization, target, teamId) {
        var deferred = Q.defer();

        this.github.repos.createFromOrg({
            name: target,
            private: true,
            org: organization,
            team_id: teamId
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };


    // gets the teams for an organization
    GithubWrapper.prototype.getTeams = function(organization) {
        var deferred = Q.defer();

        this.github.orgs.getTeams({
            org: organization
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };



    GithubWrapper.prototype.addCollaborator = function(organization, target, candidate) {
        var deferred = Q.defer();

        this.github.repos.addCollaborator({
            repo: target,
            user: organization,
            collabuser: candidate
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };

    return GithubWrapper;

}());
