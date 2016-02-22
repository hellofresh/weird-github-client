module.exports = (function() {

    var GoogleSpreadsheet = require('google-spreadsheet');
    var Q = require('q');

    var GoogleSpreadsheetWrapper = function() {
        this.credentials = require ('../google-drive-credentials.json');
        this.sheet = new GoogleSpreadsheet (process.env.GOOGLE_DRIVE_SPREADSHEET_ID);
        this.sheetInfo = null;
    };



    GoogleSpreadsheetWrapper.prototype.authenticate = function () { 
        var deferred = Q.defer();

        this.sheet.useServiceAccountAuth (this.credentials, function (err) {
            if (err) {
                deferred.reject (err);
            }

            deferred.resolve();
        });

        return deferred.promise;
    }

    GoogleSpreadsheetWrapper.prototype.getInfo = function () {
        var deferred = Q.defer();
        var self = this;

        this.sheet.getInfo (function (err, info) {
            if (err) {
                deferred.reject (err);
            }

            self.sheetInfo = info;

            deferred.resolve(info);
        });

        return deferred.promise;
    }


    GoogleSpreadsheetWrapper.prototype.getRows = function (worksheetId) {
        var deferred = Q.defer();
        var worksheet = this.sheetInfo.worksheets[worksheetId];

        worksheet.getRows (function (err, rows) {
            if (err) {
                deferred.reject (err);
            }

            deferred.resolve(rows);
        });

        return deferred.promise;
    }


    GoogleSpreadsheetWrapper.prototype.saveRows = function (worksheetId, rows) {
        var deferred = Q.defer();
        var worksheet = this.sheetInfo.worksheets[worksheetId];
        var rowsToSave = rows;
        this.addRowsOneByOne (rowsToSave, worksheet, deferred);

/*        worksheet.addRow (saving, function (){



        row.del (function (err) {
            if (err) {
                deferred.reject (err);
            }

            deferred.resolve();
        });
*/
        return deferred.promise;
    }

    GoogleSpreadsheetWrapper.prototype.addRowsOneByOne = function (rows, worksheet, deferred) {

        var saving = rows.pop ();
        var self = this;

        console.log ("adding one row");

        worksheet.addRow (saving, function (err){
            if (err) {
                deferred.reject (err)
            }

            if (rows.length == 0) {
                deferred.resolve ();
                return;
            }

            self.addRowsOneByOne (rows, worksheet, deferred);

        });

        return;
    }



    GoogleSpreadsheetWrapper.prototype.deleteRow = function (row) {
        var deferred = Q.defer();

        row.del (function (err) {
            if (err) {
                deferred.reject (err);
            }

            deferred.resolve();
        });

        return deferred.promise;
    }

/*
    GoogleSpreadsheetWrapper.prototype.getRows = function (spreadsheetId, worksheetId) {

        console.log ('overriding all contents of ' + spreadsheetId + ' ' + worksheetId);

        var sheet = new GoogleSpreadsheet (spreadsheetId);
        sheet.useServiceAccountAuth (this.credentials, function (err) {

            if (err) {
                throw err;
            }

            sheet.getInfo (function (err, sheet_info) {
                if (err) {
                    throw err;
                }
                console.log (sheet_info.title + ' is loaded' );
                // use worksheet object if you want to stop using the # in your calls 
         
                console.log (sheet_info);

                var sheet1 = sheet_info.worksheets[worksheetId];

                for (var i = 0; i < content.length; i++) {
                    sheet1.addRow (content [i], function (err) {if (err) throw err;});
                }


//console.log (sheet1.addRow);return;

/*                sheet1.getRows(function (err, rows) {

                    console.log (rows);

                    if (rows.length == 0) {
                        console.log ('empty rows!');
                        return;
                    }


                    if (err) {
                        throw err;
                    }
                    rows[0].colname = 'new val';
                    rows[0].save(); //async and takes a callback 
//                    rows[0].del();  //async and takes a callback 
                });
            });
        });



    }
*/

    GoogleSpreadsheetWrapper.prototype.override = function (spreadsheetId, worksheetId, content) {

        console.log ('overriding all contents of ' + spreadsheetId + ' ' + worksheetId);

        var sheet = new GoogleSpreadsheet (spreadsheetId);
        sheet.useServiceAccountAuth (this.credentials, function (err) {

            if (err) {
                throw err;
            }

            sheet.getInfo (function (err, sheet_info) {
                if (err) {
                    throw err;
                }
                console.log (sheet_info.title + ' is loaded' );
                // use worksheet object if you want to stop using the # in your calls 
         
                console.log (sheet_info);

                var sheet1 = sheet_info.worksheets[worksheetId];

                for (var i = 0; i < content.length; i++) {
                    sheet1.addRow (content [i], function (err) {if (err) throw err;});
                }


//console.log (sheet1.addRow);return;

/*                sheet1.getRows(function (err, rows) {

                    console.log (rows);

                    if (rows.length == 0) {
                        console.log ('empty rows!');
                        return;
                    }


                    if (err) {
                        throw err;
                    }
                    rows[0].colname = 'new val';
                    rows[0].save(); //async and takes a callback 
//                    rows[0].del();  //async and takes a callback 
                });*/
            });
        });



    }

    GoogleSpreadsheetWrapper.prototype.reset = function (spreadsheetId, worksheetId) {



        console.log ('reseting all contents of ' + spreadsheetId + ' ' + worksheetId);

        var sheet = new GoogleSpreadsheet (spreadsheetId);
        sheet.useServiceAccountAuth (this.credentials, function (err) {

            if (err) {
                throw err;
            }

            sheet.getInfo (function (err, sheet_info) {
                if (err) {
                    throw err;
                }
                console.log (sheet_info.title + ' is loaded' );
                // use worksheet object if you want to stop using the # in your calls 
         
                console.log (sheet_info);

                var sheet1 = sheet_info.worksheets[worksheetId];


                sheet1.getRows(function (err, rows) {

                    console.log (rows);

                    if (rows.length == 0) {
                        console.log ('empty rows!');
                        return;
                    }


                    return Q.allSettled (rows.map (function (row) {
                            console.log ('Deleting row...')
                            return rows[0].del();
                    }));


//                    if (err) {
//                        throw err;
//                    }
//                    rows[0].colname = 'new val';
//                    rows[0].save(); //async and takes a callback 
////                    rows[0].del();  //async and takes a callback 
                });
            });
        });



    }


    return GoogleSpreadsheetWrapper;

}());





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







