#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'set-team-permissions';
    var message = 'Edits a team\'s default permissions.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/SetTeamPermissions');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());
