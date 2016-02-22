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

        return deferred.promise;
    }

    GoogleSpreadsheetWrapper.prototype.addRowsOneByOne = function (rows, worksheet, deferred) {
        var saving = rows.pop ();
        var self = this;

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

    return GoogleSpreadsheetWrapper;

}());
