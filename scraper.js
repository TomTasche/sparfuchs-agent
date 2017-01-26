var algoliasearch = require("algoliasearch");

var client = algoliasearch("BJ54LNRTHZ", "6d3f44bce42e186f9c3ad5ac9f76d9c3");
var index = client.initIndex("products");

var request = require("request");

var serviceAccount = require("./serviceAccountKey.json");

var admin = require("firebase-admin");
var firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sparfuchs-agent.firebaseio.com"
});
var database = firebase.database();

var apiUrl = "https://shop.billa.at/api/search/full?category=B2&pageSize=9175&isFirstPage=true&isLastPage=true";
request.get(apiUrl, function(error, response, body) {
    if (error || response.statusCode !== 200) {
        console.error(error);
        return;
    }

    var products = [];
    var productDatas = JSON.parse(body).tiles;
    for (var i = 0; i < productDatas.length; i++) {
        var productData = productDatas[i].data;

        var productName = productData.name;
        var productId = productData.articleId;
        var productAmount = productData.grammage;
        var productPrice = productData.price.normal;

        var product = {};
        product.name = productName;
        product.id = productId;
        product.amount = productAmount;
        product.price = productPrice;

        products.push(product);
    }

    var promise = index.deleteByQuery("");
    promise = promise.then(index.addObjects.bind(index, products));

    promise.then(process.exit.bind(this, 0));
    promise.catch(process.exit.bind(this, 1));
});
