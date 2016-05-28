#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var Commander = require('../lib/Commander');
    var Program = require('../lib/ListTeamsProgram');

    var commander = new Commander();
    var program = new Program (commander);

    program.run();

}());
