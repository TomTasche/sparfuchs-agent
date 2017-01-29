var FIREBASE_SERVER_KEY = "AAAAldscnKM:APA91bFoqbMAKZqqKzW_4B2aJT30PVPlUb231lgVxOt5NjJYn0v-1-nuqtTIgWRcSP1w_vLGvlP1wHkJNCxbPsnYeMrDlmr8991029jLOJ0EH0GSkdKzeLthQquxrkkg4oRNS7aEgcnu";

var Q = require("q");
var FCM = require("fcm-node");

var fcm = new FCM(FIREBASE_SERVER_KEY);

function send(message) {
    var future = Q.defer();

    fcm.send(message, function(error, response) {
        if (error) {
            future.reject(error);
        } else {
            future.resolve();
        }
    });

    return future.promise;
}

var bridge = {};
bridge.send = send;

module.exports = bridge;
