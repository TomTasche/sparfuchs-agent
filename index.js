var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");
var url = require("url");

var FirebaseBridge = require("./firebase-bridge");

var serve;

function initializeServer() {
    var http = require("http");

    serve = serveStatic("public/", {
        index: ["index.html"]
    });

    var server = http.createServer(onRequest);

    var port = process.env.PORT || 5000;
    server.listen(port);
}

function onRequest(request, response) {
    response.setHeader("Access-Control-Allow-Origin", "*");

    var requestUrl = url.parse(request.url, true);
    if ("/products" === requestUrl.pathname) {
        var userKey = requestUrl.query.userKey;
        if ("POST" === request.method) {
            var productId = requestUrl.query.productId;

            var promise = FirebaseBridge.saveProductUser(productId, userKey);
            promise.then(FirebaseBridge.saveUserProduct.bind(this, userKey, productId));
            promise.then(response.end.bind(response));
        } else {
            var promise = FirebaseBridge.fetchUserProducts(userKey);
            promise.then(function(userProducts) {
                var productIds = Object.keys(userProducts);

                var promise = FirebaseBridge.fetchProducts();
                promise.then(function(products) {
                    var result = [];
                    for (var i = 0; i < productIds.length; i++) {
                        var productId = productIds[i];

                        var product = products[productId];
                        result.push(product);
                    }

                    response.write(JSON.stringify(result));
                    response.end();
                });
            });
        }
    } else if ("/user/device" === requestUrl.pathname) {
        var userKey = requestUrl.query.userKey;
        var deviceToken = requestUrl.query.deviceToken;

        var data = {};
        data.key = userKey;
        data.deviceToken = deviceToken;

        FirebaseBridge.saveUser(data);

        response.end();
    } else {
        // DEPRECATED: use "firebase serve" instead
        serve(request, response, finalhandler);
    }
}

initializeServer();
