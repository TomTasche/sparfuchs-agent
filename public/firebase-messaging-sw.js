importScripts("https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js");

firebase.initializeApp({
    "messagingSenderId": "643626212515"
});

var messaging = firebase.messaging();
