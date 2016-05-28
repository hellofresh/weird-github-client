#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'normalize-repo';
    var message = 'Enforces that particular teams are added to a repo and integrates that repo with pullapprove.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/NormalizeRepo');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());
