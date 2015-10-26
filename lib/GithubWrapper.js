module.exports = (function() {

    var GitHubApi = require('github');
    var Q = require('q');

    var GithubWrapper = function() {
        this.github = GithubWrapper.loadConfig();
    };

    GithubWrapper.loadConfig = function() {
        var github = new GitHubApi({
            version: '3.0.0',
            debug: process.env.DEBUG,
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

    GithubWrapper.prototype.createFromOrg = function(target, candidate, teamId) {
        var deferred = Q.defer();

        this.github.repos.createFromOrg({
            name: target,
            private: true,
            org: candidate.org,
            team_id: teamId
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                console.log(result);
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };

    GithubWrapper.prototype.getTeam = function(candidate) {
        var deferred = Q.defer();

        this.github.orgs.getTeams({
            org: candidate.org
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result.find(function(team) {
                    return team.slug === candidate.teamName;
                }));
            }
        });

        return deferred.promise;
    };

    GithubWrapper.prototype.addCollaborator = function(target, candidate) {
        var deferred = Q.defer();

        this.github.repos.addCollaborator({
            repo: target,
            user: candidate.org,
            collabuser: candidate.candidate
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                console.log(result);
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };

    return GithubWrapper;

}());
