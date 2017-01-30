var serviceAccount = require("./service-account-key.json");

var admin = require("firebase-admin");
var firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sparfuchs-agent.firebaseio.com"
});
var database = firebase.database();

function fetchProducts() {
    var promise = fetch("products");
    return promise;
}

function fetchProductUsers(productId) {
    var promise = fetch("productUsers/" + productId);
    return promise;
}

function fetchUser(userKey) {
    var promise = fetch("users/" + userKey);
    return promise;
}

function fetchUserProducts(userKey) {
    var promise = fetch("userProducts/" + userKey);
    return promise;
}

function fetch(key) {
    var promise = database.ref(key).once("value");
    promise = promise.then(function(snapshot) {
        var value = snapshot.val();

        return value;
    });

    return promise;
}

function deleteProducts() {
    var promise = database.ref("products").remove();
    return promise;
}

function saveProducts(productsArray) {
    var products = {};
    for (var i = 0; i < productsArray.length; i++) {
        var product = productsArray[i];

        products[product.id] = product;
    }

    var promise = save("products", products);
    return promise;
}

function saveUser(user) {
    var promise = save("users/" + user.key, user);
    return promise;
}

function saveProductUser(productId, userKey) {
    var productUserData = {};
    productUserData[userKey] = true;

    var promise = save("productUsers/" + productId, productUserData);
    return promise;
}

function saveUserProduct(userKey, productId) {
    var userProductsData = {};
    userProductsData[productId] = true;

    var promise = save("userProducts/" + userKey, userProductsData);
    return promise;
}

function save(key, data) {
    var promise = database.ref(key).update(data);
    return promise;
}

var bridge = {};
bridge.fetchProducts = fetchProducts;
bridge.fetchProductUsers = fetchProductUsers;
bridge.fetchUser = fetchUser;
bridge.fetchUserProducts = fetchUserProducts;
bridge.deleteProducts = deleteProducts;
bridge.saveProducts = saveProducts;
bridge.saveUser = saveUser;
bridge.saveProductUser = saveProductUser;
bridge.saveUserProduct = saveUserProduct;

module.exports = bridge;
