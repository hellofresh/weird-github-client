#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'spawn-test';
    var message = 'Creates a new repo to hold a candidate\'s technical test. Adds a reviewing team and initializes that repo with the contents of another repo.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/SpawnTest');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());


