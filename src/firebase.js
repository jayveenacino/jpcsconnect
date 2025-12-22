import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAPuS1XvunigVVqkqIFihQq3B5ZxTkJv0c",
    authDomain: "jpcsconnect.firebaseapp.com",
    projectId: "jpcsconnect",
    storageBucket: "jpcsconnect.firebasestorage.app",
    messagingSenderId: "121889343186",
    appId: "1:121889343186:web:13a934494800c57c6c4f0b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);