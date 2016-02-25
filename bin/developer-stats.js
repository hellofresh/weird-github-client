#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var GithubWrapper = require('../lib/GithubWrapper');
    var GoogleSpreadsheetWrapper = require('../lib/GoogleSpreadsheetWrapper');
    var SlackWrapper = require('../lib/SlackWrapper');
    var Commander = require('../lib/DeveloperStatsCommander');

    var githubWrapper = null;
    var googleSpreadsheetWrapper = null;
    var slackWrapper = null;

    githubWrapper = new GithubWrapper({
        token: process.env.GITHUB_API_TOKEN,
    });

    if (process.env.DEV_STATS_USE_GOOGLE_SPREADSHEET === 'true') {
        googleSpreadsheetWrapper = new GoogleSpreadsheetWrapper({
            spreadsheetId: process.env.DEV_STATS_GOOGLE_SPREADSHEET_ID,
        });
    }

    if (process.env.DEV_STATS_USE_SLACK === 'true') {
        slackWrapper = new SlackWrapper ({
            username: process.env.DEV_STATS_SLACK_USERNAME,
            emoji: process.env.DEV_STATS_SLACK_EMOJI,
            url: process.env.DEV_STATS_SLACK_URL,
        });
    }

    var commander = new Commander({
        authorWorksheetIndex: process.env.DEV_STATS_GOOGLE_AUTHOR_WORKSHEET_INDEX,
        repoWorksheetIndex: process.env.DEV_STATS_GOOGLE_REPO_WORKSHEET_INDEX,
        contributionsWorksheetIndex: process.env.DEV_STATS_GOOGLE_CONTRIBUTIONS_WORKSHEET_INDEX,
        defaultOrganization: process.env.DEFAULT_ORGANIZATION,
        repos: process.env.DEV_STATS_REPOS.split(','),
        'nonUsers': process.env.DEV_STATS_NON_USERS.split(','),
    }, githubWrapper, googleSpreadsheetWrapper, slackWrapper);

    commander.start();
}());
