var Q = require("q");
var request = require("request");

function fetch(url) {
    var future = Q.defer();

    request.get(url, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            future.reject(error);
        } else {
            var responseObject = JSON.parse(body);

            future.resolve(responseObject);
        }
    });

    return future.promise;
}

var bridge = {};
bridge.fetch = fetch;

module.exports = bridge;
