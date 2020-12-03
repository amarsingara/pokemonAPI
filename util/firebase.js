var admin = require('firebase-admin');
// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

var serviceAccount = require("path/to/serviceAccountKey.json");

// TODO: Replace the following with your app's Firebase project configuration
// For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
var firebaseConfig = {
    apiKey: "AIzaSyBFjtMdhBjPYCD0Rw2byESG_pmzowlNot4",
    authDomain: "pokemonapi-5ae54.firebaseapp.com",
    databaseURL: "https://pokemonapi-5ae54.firebaseio.com",
    projectId: "pokemonapi-5ae54",
    storageBucket: "pokemonapi-5ae54.appspot.com",
    messagingSenderId: "593763653181",
    appId: "1:593763653181:web:2896a799e1599b8bc03c54",
    measurementId: "G-QPTLJ2BQ9P"
  };
  
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pokemonapi-5ae54.firebaseio.com"
  });

var app = admin.initializeApp();

module.exports = app;