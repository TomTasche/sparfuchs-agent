var algoliasearch = require("algoliasearch");

var client = algoliasearch("BJ54LNRTHZ", "6d3f44bce42e186f9c3ad5ac9f76d9c3");
var index = client.initIndex("products");

function clearIndex() {
    var promise = index.deleteByQuery("");
    return promise;
}

function populateIndex(objects) {
    var promise = index.addObjects(objects);
    return promise;
}

function close() {
    var promise = client.destroy();
    return promise;
}

var bridge = {};
bridge.clearIndex = clearIndex;
bridge.populateIndex = populateIndex;
bridge.close = close;

module.exports = bridge;
