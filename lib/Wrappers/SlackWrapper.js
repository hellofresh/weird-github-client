 module.exports = (function() {

    var Q = require('q');
    var exec = require('child_process').exec;

    var SlackWrapper = function(config) {
        this.username = config.username;
        this.emoji = config.emoji;
        this.url = config.url;
    };

    SlackWrapper.prototype.post = function (message) { 
        var deferred = Q.defer();

        var sh = 'curl -X POST --data-urlencode \'payload={"username": "' + this.username + '", "text": "'+ message + '", "icon_emoji": "' + this.emoji + '"}\' ' + this.url;

        exec(sh, function(err, stdout, stderr) {
            if (err) {
                deferred.reject (err);
            }

            deferred.resolve();
        });

        return deferred.promise;
    }

    return SlackWrapper;

}());
