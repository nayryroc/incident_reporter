import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyDhNd822mtwO6urn1xTRwSs2bU6XIBi9Ls",
    authDomain: "first-response-db.firebaseapp.com",
    projectId: "first-response-db",
    storageBucket: "first-response-db.appspot.com",
    messagingSenderId: "399840158780",
    appId: "1:399840158780:web:5ab2e800cf653fe743cf39",
    measurementId: "G-CM0L8ZS5Q7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export default db;