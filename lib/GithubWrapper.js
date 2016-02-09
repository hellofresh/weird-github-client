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




    GithubWrapper.prototype.getOrgRepos = function(organization) {
        var deferred = Q.defer();
        var all = [];
        this.crawlOrgRepos (organization, all, 1, deferred.resolve, deferred.reject);

        return deferred.promise;
    };


    GithubWrapper.prototype.crawlOrgRepos = function(organization, collected, page, resolveCallback, rejectCallback) {
        var self = this;

        console.log ('Getting organization repos for ' + organization + '. Page ' + page + '. ' + collected.length + ' collected so far.');

        this.github.repos.getFromOrg({
            org: organization,
            page: page,
            per_page: 50
        }, function(error, result) {
            if (error) {
                rejectCallback(error);
            } else {
                if (page < 2 && (result != null) && (result.length > 0)) {
                    collected = collected.concat (result);
                    page++;
                    self.crawlOrgRepos (organization, collected, page, resolveCallback, rejectCallback);
                }
                else {
                    resolveCallback(collected);
                }
            }
        });
    };







    GithubWrapper.prototype.getBranches = function(organization, repo) {
        var deferred = Q.defer();
        var all = [];
        this.crawlBranches (organization, repo, all, 1, deferred.resolve, deferred.reject);

        return deferred.promise;
    };


    GithubWrapper.prototype.crawlBranches = function(organization, repo, collected, page, resolveCallback, rejectCallback) {
        var self = this;

        console.log ('Getting branches for ' + organization + '/' + repo + '. Page ' + page + '. ' + collected.length + ' collected so far.');
console.log ('---------');
console.log (this.github);
console.log ('---------');
console.log (this.github.repos);
console.log ('---------');

        this.github.repos.getBranches({
            user: organization,
            repo: repo,
            page: page,
            per_page: 50
        }, function(error, result) {
            if (error) {
                rejectCallback(error);
            } else {
                console.log ("result");
                if ((result != null) && (result.length > 0)) {
                    collected = collected.concat (result);
                    console.log (result);
                    page++;
                    self.crawlBranches (organization, repo, collected, page, resolveCallback, rejectCallback);
                }
                else {
                    resolveCallback(collected);
                }
            }
        });
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

    // get pull requests in repo
    GithubWrapper.prototype.getPullRequests = function(organization, repo) {
        var deferred = Q.defer();
        var all = [];
        this.crawlPullRequests (organization, repo, all, 1, deferred.resolve, deferred.reject);

        return deferred.promise;
    };

    GithubWrapper.prototype.crawlPullRequests = function(organization, repo, collected, page, resolveCallback, rejectCallback) {
        var self = this;

        console.log ('Getting pull requests for ' + organization + '/' + repo + '. Page ' + page + '. ' + collected.length + ' collected so far.');

        this.github.pullRequests.getAll({
            user: organization,
            repo: repo,
            state: 'closed',
            page: page
        }, function(error, result) {
            if (error) {
                rejectCallback(error);
            } else {
                if ((result != null) && (result.length > 0)) {
                    collected = collected.concat (result);
                    page++;
                    self.crawlPullRequests (organization, repo, collected, page, resolveCallback, rejectCallback);
                }
                else {
                    resolveCallback(collected);
                }
            }
        });
    };

    // get one pull request in repo
    GithubWrapper.prototype.getPullRequest = function(organization, repo, number) {
        var deferred = Q.defer();

        this.github.pullRequests.get({
            user: organization,
            repo: repo,
            number: number,
            state: 'closed'
        }, function(error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };


    // get contributor stats for repo
    GithubWrapper.prototype.getContributorStatsForRepo = function(organization, repo, number) {
        var deferred = Q.defer();

        this.github.repos.getStatsContributors({
            user: organization,
            repo: repo
        }, function(error, result) {
            if (error) {
                error.repo = repo;
                deferred.reject(error);
            } else {
                result.repo = repo;
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };


    return GithubWrapper;


}());
