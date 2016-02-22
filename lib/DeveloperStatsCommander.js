module.exports = (function() {

    var inquirer = require('inquirer');
    var Q = require('q');
    var exec = require('child_process').exec;
    var fs = require('fs');
    var moment = require('moment');

    var DeveloperStatsCommander = function(githubWrapper, googleSpreadsheetWrapper) {
        this.githubWrapper = githubWrapper;
        this.googleSpreadsheetWrapper = googleSpreadsheetWrapper;
        this.answers = {};
    };

    DeveloperStatsCommander.prototype.start = function() {
        var commander = this;
        var organization = null;
        var team = null;
        var candidate = null;
        var repo = null;
        var target = null;
        var digested = null;

        this.askForOrg()
        .then(function (){
            console.log ('authenticating on Google Drive');
            return commander.googleSpreadsheetWrapper.authenticate ();
        })
        .then(function (repos) {
            //repos = commander.filterRepos (repos);


            repos = [
                {owner:{login: 'hellofresh'}, name: 'android'},
                {owner:{login: 'hellofresh'}, name: 'api'},
                {owner:{login: 'hellofresh'}, name: 'api-v2'},
                {owner:{login: 'hellofresh'}, name: 'automation'},
                {owner:{login: 'hellofresh'}, name: 'automated-tests'},
                {owner:{login: 'hellofresh'}, name: 'business'},
                {owner:{login: 'hellofresh'}, name: 'garbanzo'},
                {owner:{login: 'hellofresh'}, name: 'hq'},
                {owner:{login: 'hellofresh'}, name: 'intfood'},
                {owner:{login: 'hellofresh'}, name: 'ios'},
                {owner:{login: 'hellofresh'}, name: 'lentil'},
                {owner:{login: 'hellofresh'}, name: 'sysadmin'},
                {owner:{login: 'hellofresh'}, name: 'tapioca'},
                {owner:{login: 'hellofresh'}, name: 'webdev'},
                {owner:{login: 'hellofresh'}, name: 'xamarin-android'},
                {owner:{login: 'hellofresh'}, name: 'xamarin-ios'}
            ];
            return Q.allSettled (repos.map (function (repo) {
                console.log ('Getting stats for ' + repo.name + '...')
                return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
            }));
        })
        .then(function (resolves) {
            console.log ('Stats obtained. Digesting...')
            digested = commander.digest (resolves);

            console.log ('Finished digesting.')

            return commander.googleSpreadsheetWrapper.getInfo ();
        })
        .then(function (resolves) {
            console.log ('Getting rows...')
            return commander.googleSpreadsheetWrapper.getRows (0);
        })
        .then (function (rows) {
            console.log ('Deleting rows.')

            return Q.allSettled (rows.map (function (row) {
                console.log ('Deleting row...')
                return commander.googleSpreadsheetWrapper.deleteRow (row);
            }));
        })
        .then (function (){
            return commander.googleSpreadsheetWrapper.saveRows (0, commander.convertToReport(digested, 'week'));
        })
        .catch(function(e) {
            console.log ('Aborted: ');
            console.error(e);
        });
    };

    DeveloperStatsCommander.prototype.askForOrg = function() {
        var deferred = Q.defer();

        inquirer.prompt([
            {
                type: 'input',
                name: 'org',
                message: 'Name of your organization on github.com',
                default: process.env.DEFAULT_ORGANIZATION
            }
        ], function(answers) {
            deferred.resolve(answers.org);
        });

        return deferred.promise;
    };



    DeveloperStatsCommander.prototype.convertToReport = function(digested, sortBy) {
        var deferred = Q.defer();

        var authorTree = this.convertDigestedToTree (digested, 'author', 'week', 'commits');
        var data = this.convertTreeToObjectArray ('week', authorTree);

        data.sort (function compare(a, b) {
            if (a[sortBy] > b[sortBy]) {
              return -1;
            }
            if (a[sortBy] < b[sortBy]) {
              return 1;
            }
            // a must be equal to b
            return 0;
        });

        return data;
    }



/*    DeveloperStatsCommander.prototype.explainToConsole = function(digested) {
        var deferred = Q.defer();

        var authorTree = this.convertDigestedToTree (digested, 'author', 'week', 'commits');
        var data = this.convertTreeToObjectArray ('week', authorTree);

        this.saveOnGoogleDrive (data);

        return deferred.promise;
    }

*/
    DeveloperStatsCommander.prototype.resetGoogleSpreadsheet = function (content) {

        this.googleSpreadsheetWrapper.reset ('14mUWHyrCi7msSqBHxgr-jDmc3N-jMXn7kYM7e3eyySE', 0);

//        var drive = new GoogleSpreadsheetWrapper();
//        var GoogleSpreadsheet = require("google-spreadsheet");
//        var sheet = new GoogleSpreadsheet('14mUWHyrCi7msSqBHxgr-jDmc3N-jMXn7kYM7e3eyySE');
//        var creds = require('client_secret.json');
//
//
//        my_sheet.useServiceAccountAuth(creds, function(err){
//            // getInfo returns info about the sheet and an array or "worksheet" objects 
//            my_sheet.getInfo( function( err, sheet_info ){
//                console.log( sheet_info.title + ' is loaded' );
//                // use worksheet object if you want to stop using the # in your calls 
//         
//                var sheet1 = sheet_info.worksheets[0];
//                sheet1.getRows( function( err, rows ){
//                    console.log ("rows");
//                    console.log (rows);
////                    rows[0].colname = 'new val';
////                    rows[0].save(); //async and takes a callback 
////                    rows[0].del();  //async and takes a callback 
//                });
//
//
//            });
//        });


//        return Q.allSettled (repos.map (function (repo) {
//                console.log ('Getting stats for ' + repo.name + '...')
//                return commander.githubWrapper.getContributorStatsForRepo (repo.owner.login, repo.name);
//        }));


    }


    DeveloperStatsCommander.prototype.saveOnGoogleDrive = function (content) {
        this.googleSpreadsheetWrapper.override ('14mUWHyrCi7msSqBHxgr-jDmc3N-jMXn7kYM7e3eyySE', 0, content);
return;
        var drive = new GoogleSpreadsheetWrapper();
        var GoogleSpreadsheet = require("google-spreadsheet");
        var sheet = new GoogleSpreadsheet('14mUWHyrCi7msSqBHxgr-jDmc3N-jMXn7kYM7e3eyySE');
        var creds = require('client_secret.json');

        my_sheet.useServiceAccountAuth(creds, function(err){
            // getInfo returns info about the sheet and an array or "worksheet" objects 
            my_sheet.getInfo( function( err, sheet_info ){
                console.log( sheet_info.title + ' is loaded' );
                // use worksheet object if you want to stop using the # in your calls 
         
                var sheet1 = sheet_info.worksheets[0];
                sheet1.getRows( function( err, rows ){
                    console.log ("rows");
                    console.log (rows);
//                    rows[0].colname = 'new val';
//                    rows[0].save(); //async and takes a callback 
//                    rows[0].del();  //async and takes a callback 
                });


            });
         
            // column names are set by google and are based 
          // on the header row (first row) of your sheet 
//            my_sheet.addRow( 2, { colname: 'col value'} );
//         
//            my_sheet.getRows( 2, {
//                offset: 100,             // start index 
//                limit: 100,            // number of rows to pull 
//                orderby: 'name'  // column to order results by 
//            }, function(err, row_data){
//                // do something... 
//            });
        })

/*
var GoogleSpreadsheet = require("google-spreadsheet");
 
// spreadsheet key is the long id in the sheets URL 
var my_sheet = new GoogleSpreadsheet('<spreadsheet key>');
 
// Without auth -- read only 
// IMPORTANT: See note below on how to make a sheet public-readable! 
// # is worksheet id - IDs start at 1 
my_sheet.getRows( 1, function(err, row_data){
    console.log( 'pulled in '+row_data.length + ' rows');
});
 
// With auth -- read + write 
// see below for authentication instructions 
var creds = require('./google-generated-creds.json');
// OR, if you cannot save the file locally (like on heroku) 
var creds = {
  client_email: 'yourserviceaccountemailhere@google.com',
  private_key: 'your long private key stuff here'
}
 
my_sheet.useServiceAccountAuth(creds, function(err){
    // getInfo returns info about the sheet and an array or "worksheet" objects 
    my_sheet.getInfo( function( err, sheet_info ){
        console.log( sheet_info.title + ' is loaded' );
        // use worksheet object if you want to stop using the # in your calls 
 
        var sheet1 = sheet_info.worksheets[0];
        sheet1.getRows( function( err, rows ){
            rows[0].colname = 'new val';
            rows[0].save(); //async and takes a callback 
            rows[0].del();  //async and takes a callback 
        });
    });
 
    // column names are set by google and are based 
  // on the header row (first row) of your sheet 
    my_sheet.addRow( 2, { colname: 'col value'} );
 
    my_sheet.getRows( 2, {
        offset: 100,             // start index 
        limit: 100,            // number of rows to pull 
        orderby: 'name'  // column to order results by 
    }, function(err, row_data){
        // do something... 
    });
})
*/        
    }

    DeveloperStatsCommander.prototype.spit = function(table) {
        for (var i = 0; i < table.length; i++) {

            var message = '';

            for (var j = 0; j < table [i].length; j++) {
                message += ((typeof table [i][j] == 'undefined')? 0 : table [i][j]) + '\t';
            }

            console.log (message);
        }
    }


    DeveloperStatsCommander.prototype.convertTreeToTable = function(name, tree) {
        var table = [];
        var headers = [name];
        var body = [];
        var rows = [];

        for (var p in tree) {
            for (var q in tree [p]) {
                if (rows.indexOf (q) == -1) {
                    rows.push (q);
                }
            }
        }

        for (var i = 0; i < rows.length; i++) {
            var name = rows [i];
            var row = []; 
            row.push (name);

            console.log (name);

            for (var p in tree) {
                if (i == 0) {
                    headers.push (p);
                }
                row.push (tree [p][rows [i]]);
            }

            body.push (row);
        }

//        for (var p in tree) {
//
//            headers.push (p);
//            var row = []; 
//
//            for (var q in tree [p]) {
//                if (row.length == 0) {
//                    row.push (q);
//                }
//
//                row.push (tree [p][q]);
//            }
//
//            body.push (row);
//        }

        return [headers].concat (body);
    }


    DeveloperStatsCommander.prototype.convertTreeToObjectArray = function(name, tree) {
        var table = [];
        var body = [];
        var rows = [];

        for (var p in tree) {
            for (var q in tree [p]) {
                if (rows.indexOf (q) == -1) {
                    rows.push (q);
                }
            }
        }

        for (var i = 0; i < rows.length; i++) {
            var row = {}; 
            row [name] = rows [i];

            for (var p in tree) {
                row[p] = typeof tree [p][rows [i]] == 'undefined' ? 0 : tree [p][rows [i]];
            }

            body.push (row);
        }

//        for (var p in tree) {
//
//            headers.push (p);
//            var row = []; 
//
//            for (var q in tree [p]) {
//                if (row.length == 0) {
//                    row.push (q);
//                }
//
//                row.push (tree [p][q]);
//            }
//
//            body.push (row);
//        }

        return body;
    }


    DeveloperStatsCommander.prototype.convertDigestedToTree = function(digested, column, row, value) {

        var result = {};

        for (var i = 0; i < digested.length; i++) {
            var entry = digested [i];

            if (typeof result [entry [column]] == 'undefined') {
                result [entry [column]] = {};
            }

            if (typeof result [entry [column]][entry [row]] == 'undefined') {
                result [entry [column]][entry [row]] = 0;
            }

            result [entry [column]][entry [row]] += entry [value];
        }

        return result;
    }


    DeveloperStatsCommander.prototype.filterRepos = function(repos) {
        return repos.filter (function (repo) {

            if ((process.env.EXCLUDE_FORKS == 'true') && repo.fork) {
                console.log (repo.name + ' is a fork. excluding.');
                return false;
            }
    
            var regexp = process.env.TEST_REPOS_REGEXP;
    
            if ((typeof (regexp) != 'string') || regexp == '') {
                return true;
            }
    
            if (repo.name.match (new RegExp(regexp))) {
                console.log (repo.name + ' matches ' + regexp + '. excluding.');
                return false;
            }
    
            return true;
        });
    };

    DeveloperStatsCommander.prototype.digest = function (resolves) {

        var values = this.extractAndEnsureValues (resolves);
        var nonUsers = process.env.DEV_STATS_EXCLUDE_USERS.split(',');

        var digested = []; 

        for (var i = 0 ; i < values.length; i++) {

            var originalStatsPayload = values [i];
            var repo = originalStatsPayload.repo;

            for (var p in originalStatsPayload) {

                if (isNaN (p)) {
                    continue;
                }

                var weeklyStats = originalStatsPayload [p];

                for (var w = 0; w < weeklyStats.weeks.length; w++) {

                    if (nonUsers.indexOf (weeklyStats.author.login) != -1)
                        continue;

                    var timestamp = weeklyStats.weeks[w].w;

                    if (timestamp < moment().subtract ('25', 'week').format ('X'))
                        continue;

                    var date = moment.unix (timestamp);

                    var entry = {
                        week : date.isoWeekYear () + '-W' + ('0' + date.isoWeek ()).substr(-2),
                        timestamp : timestamp,
                        author: weeklyStats.author.login,
                        repo: repo,
                        commits: weeklyStats.weeks[w].c,
                        added : weeklyStats.weeks[w].a,
                        deleted : weeklyStats.weeks[w].d,
                        changed : weeklyStats.weeks[w].a + weeklyStats.weeks[w].d
                    };

                    digested.push(entry);
                }
            }
        }

        return digested;

    }

    DeveloperStatsCommander.prototype.slack = function (message) {

        var sh = 'curl -X POST --data-urlencode \'payload={"username": "' + process.env.SLACK_USERNAME + '", "text": "'+ message + '", "icon_emoji": "' + process.env.SLACK_EMOJI + '"}\' ' + process.env.SLACK_URL;

        exec(sh, function(error, stdout, stderr) {
            if (error) {
                throw error;
            }
        });
    }

    DeveloperStatsCommander.prototype.snitch = function (digested) {

        var result = '';
        var zeroes = [];

        for (var p in digested) {

            var totalCommits = 0;
            var totalChanges = 0;
            var line = '';
            var notes = '';


            for (var name in digested [p]) {

                totalCommits += digested[p][name].commits;
                totalChanges += digested[p][name].changed;

                if (notes != '') {
                    notes += ', ';
                }

                notes += name + ': ' + digested[p][name].commits;

            }

            if (totalCommits == 0) {
                zeroes.push (p);
                continue;
            }

            notes = '(' + notes + ')';

            line += '`' + ('   ' + totalCommits).substr(-3) + '` ';
            line += '`' + ('     ±' + totalChanges).substr(-6) + '` ';
            line += '`' + ('      ' + (totalChanges/totalCommits).toFixed (1)).substr(-6) + '` ';
            line += p;
            line += ' ' + notes;
            line += '\n';

            result += line;
        }


        result += 'No activity: ';

        for (var i = 0; i < zeroes.length; i++) {
            result += zeroes [i] + ((i == zeroes.length - 2) ? ' and ' : ((i == zeroes.length - 1) ? '.' : ', '));
        }

        result += '\n';

        return result;
    }

    DeveloperStatsCommander.prototype.extractAndEnsureValues = function (resolves) {

        var result = [];

        for (var i = 0; i < resolves.length; i++) {

            if (resolves [i].state != 'fulfilled') {
                console.log (resolves[i]);
                throw { message: 'found unfulfilled resolve', object: resolves[i] };
            }

            if (resolves [i].value.meta.status == '204 No Content') {
                continue;
            }

            if (resolves [i].value.meta.status != '200 OK') {
                throw { message: 'found non 200 response', object: resolves [i].value };
            }

            result.push (resolves [i].value);
        }

        return result;
    }

    return DeveloperStatsCommander;

}());
