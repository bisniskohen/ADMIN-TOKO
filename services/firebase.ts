
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4N4hCKoFRcfts1AIFEaG9gQgtqgS0vfE",
  authDomain: "admin-toko-1b335.firebaseapp.com",
  projectId: "admin-toko-1b335",
  storageBucket: "admin-toko-1b335.firebasestorage.app",
  messagingSenderId: "16261251782",
  appId: "1:16261251782:web:cff03261146b8a4c3fcdc7",
  measurementId: "G-ZQY1GV6PYS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
