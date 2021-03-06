#!/usr/bin/env node

require('dotenv').load();

module.exports = (function() {

    var name = 'archive-repo';
    var message = 'Archives a branch of a repo, adding it as a git subtree to another repo. In the end you may choose to delete the archived repo. You will lose your PRs and comments but you will keep your commit history.';

    var Commander = require('../lib/Commander');
    var Program = require('../lib/Programs/ArchiveRepo');

    var commander = new Commander(name, message);
    var program = new Program (commander);

    program.run();

}());
