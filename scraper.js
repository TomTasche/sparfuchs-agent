var moment = require("moment");

var HttpBridge = require("./http-bridge");
var AlgoliaBridge = require("./algolia-bridge");
var FirebaseBridge = require("./firebase-bridge");
var CloudMessagingBridge = require("./cloud-messaging-bridge");

function scrapeProducts() {
    var apiUrl = "https://shop.billa.at/api/search/full?category=B2&pageSize=9175&isFirstPage=true&isLastPage=true";

    var promise = HttpBridge.fetch(apiUrl);
    promise = promise.then(function(responseObject) {
        var products = [];
        var productDatas = responseObject.tiles;
        for (var i = 0; i < productDatas.length; i++) {
            var productData = productDatas[i].data;

            var productName = productData.name;
            var productId = productData.articleId;
            var productAmount = productData.grammage;
            var productPrice = productData.price.normal;

            var productSalePrice;
            if (productData.vtcPrice) {
                productSalePrice = productData.vtcPrice.sale;
            }

            var product = {};
            product.name = productName;
            product.id = productId;
            product.amount = productAmount;
            product.price = productPrice;
            product.salePrice = productSalePrice;

            products.push(product);
        }

        var promise = FirebaseBridge.deleteProducts();
        promise = promise.then(FirebaseBridge.saveProducts.bind(this, products));

        var nowMoment = moment.utc();
        // only 10k operations per month on algolia allowed
        if (nowMoment.date() === 1) {
            promise = promise.then(AlgoliaBridge.clearIndex);
            promise = promise.then(AlgoliaBridge.populateIndex.bind(this, products));
        }

        promise = promise.then(sendProducts);

        return promise;
    });

    promise.catch(console.error);
}

function sendProducts() {
    var promise = FirebaseBridge.fetchProducts();
    promise = promise.then(function(products) {
        for (var productId in products) {
            var product = products[productId];
            if (!product.salePrice || product.price === product.salePrice) {
                continue;
            }

            sendProduct(product);
        }
    });

    promise.catch(console.error);
}

function sendProduct(product) {
    var productId = product.id;

    var promise = FirebaseBridge.fetchProductUsers(productId);
    promise.then(function(listeners) {
        for (userKey in listeners) {
            sendProductToUser(product, userKey);
        }
    });

    promise.catch(console.error);
}

function sendProductToUser(product, userKey) {
    var promise = FirebaseBridge.fetchUser(userKey);
    promise.then(function(user) {
        var message = {
            to: user.deviceToken,
            notification: {
                title: "price changed for " + product.name,
                body: "new price is " + product.price + "€"
            }
        };

        var promise = CloudMessagingBridge.send(message);
        return promise;
    });

    promise.catch(console.error);
}

var nowMoment = moment.utc();
if (nowMoment.day() === 3) {
    scrapeProducts();
}
