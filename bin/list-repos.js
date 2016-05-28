#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'list-repos';
    var message = 'Lists the repos of an organization.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/ListRepos');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());
