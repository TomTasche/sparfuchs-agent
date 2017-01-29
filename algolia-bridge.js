var algoliasearch = require("algoliasearch");

var client = algoliasearch("BJ54LNRTHZ", "6d3f44bce42e186f9c3ad5ac9f76d9c3");
var index = client.initIndex("products");

function clearIndex() {
    var promise = index.deleteByQuery("");
    return promise;
}

function populateIndex(objects) {
    var promise = index.addObjects(products);
    return promise;
}

var bridge = {};
bridge.clearIndex = clearIndex;
bridge.populateIndex = populateIndex;

module.exports = bridge;
