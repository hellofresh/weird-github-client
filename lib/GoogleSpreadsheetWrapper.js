module.exports = (function() {

    var GoogleSpreadsheet = require('google-spreadsheet');
    var Q = require('q');

    var GoogleSpreadsheetWrapper = function() {
        this.credentials = require ('../google-drive-credentials.json');
    };

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







