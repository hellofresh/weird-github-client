#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'list-teams';
    var message = 'Lists the teams of an organization.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/ListTeams');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());
