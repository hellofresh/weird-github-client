#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var GithubWrapper = require('../lib/GithubWrapper');
    var Commander = require('../lib/ArchiveTechnicalTestCommander');

    var githubWrapper = new GithubWrapper();

    var commander = new Commander(githubWrapper);
    commander.start();

}());
