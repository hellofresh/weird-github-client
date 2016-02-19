#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var GithubWrapper = require('../lib/GithubWrapper');
    var GoogleSpreadsheetWrapper = require('../lib/GoogleSpreadsheetWrapper');
    var Commander = require('../lib/DeveloperStatsCommander');

    var githubWrapper = new GithubWrapper();
    var googleSpreadsheetWrapper = new GoogleSpreadsheetWrapper();

    var commander = new Commander(githubWrapper, googleSpreadsheetWrapper);
    commander.start();

}());
