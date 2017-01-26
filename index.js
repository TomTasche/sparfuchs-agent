var FIREBASE_SERVER_KEY = "AAAAldscnKM:APA91bFoqbMAKZqqKzW_4B2aJT30PVPlUb231lgVxOt5NjJYn0v-1-nuqtTIgWRcSP1w_vLGvlP1wHkJNCxbPsnYeMrDlmr8991029jLOJ0EH0GSkdKzeLthQquxrkkg4oRNS7aEgcnu";

var serviceAccount = require("./serviceAccountKey.json");

var admin = require("firebase-admin");
var firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sparfuchs-agent.firebaseio.com"
});
var database = firebase.database();

var FCM = require("fcm-node");
var fcm = new FCM(FIREBASE_SERVER_KEY);

var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");
var url = require("url");

var serve;

var request = require("request");

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
    if ("/product" === requestUrl.pathname) {
        var productId = requestUrl.query.productId;
        var userKey = requestUrl.query.userKey;

        var product = {};
        product.id = productId;
        saveProduct(product);

        var data = {};
        data[userKey] = true;
        database.ref("productListeners/" + productId).update(data);

        response.end();
    } else if ("/user/device" === requestUrl.pathname) {
        var userKey = requestUrl.query.userKey;
        var deviceToken = requestUrl.query.deviceToken;

        var data = {};
        data.key = userKey;
        data.deviceToken = deviceToken;
        database.ref("users/" + userKey).update(data);

        response.end();
    } else {
        // DEPRECATED: use "firebase serve" instead
        serve(request, response, finalhandler);
    }
}

function saveProduct(product) {
    database.ref("products/" + product.id).update(product);
}

function scrapeProducts() {
    var promise = database.ref("products").once("value");
    promise.then(function(snapshot) {
        var products = snapshot.val();
        for (var productId in products) {
            var product = products[productId];

            scrapeProduct(product);
        }
    });
}

function scrapeProduct(product) {
    var productId = product.id;

    var apiUrl = "https://shop.billa.at/api/articles/" + productId;
    request.get(apiUrl, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            console.error(error);
            return;
        }

        var productData = JSON.parse(body);
        var productName = productData.name;
        var productPriceData = productData.vtcPrice || productData.price;
        var productPrice = productPriceData.final;

        var oldPrice = product.price;

        product.price = productPrice;
        product.name = productName;
        saveProduct(product);

        if (oldPrice && oldPrice !== productPrice) {
            sendProduct(product);
        }
    });
}

function sendProduct(product) {
    var productId = product.id;

    var promise = database.ref("productListeners/" + productId).once("value");
    promise.then(function(snapshot) {
        var listeners = snapshot.val();

        for (userKey in listeners) {
            sendProductToUser(product, userKey);
        }
    });
}

function sendProductToUser(product, userKey) {
    var promise = database.ref("users/" + userKey).once("value");
    promise.then(function(snapshot) {
        var user = snapshot.val();

        var message = {
            to: user.deviceToken,
            notification: {
                title: "price changed for " + product.name,
                body: "new price is " + product.price + "€"
            }
        };

        fcm.send(message, function(error, response) {
            if (error) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
    });
}

initializeServer();

setInterval(scrapeProducts, 1000 * 60 * 60 * 12);
