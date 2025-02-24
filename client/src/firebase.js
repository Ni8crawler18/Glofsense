// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjFfKHonv8ThsrCfQr24YM1IMX760V3IM",
  authDomain: "glof-detection.firebaseapp.com",
  databaseURL: "https://glof-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "glof-detection",
  storageBucket: "glof-detection.firebasestorage.app",
  messagingSenderId: "149181276909",
  appId: "1:149181276909:web:40ddd6ff22db3e17d022e4",
  measurementId: "G-NSZQMS260S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

export { database, analytics };
