import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyAdZwzf7oEGIP39jt7rELp8Q1Gu3vdy2AU",
  authDomain: "swiftvault-ea713.firebaseapp.com",
  databaseURL: "https://swiftvault-ea713-default-rtdb.firebaseio.com",
  projectId: "swiftvault-ea713",
  storageBucket: "swiftvault-ea713.appspot.com",
  messagingSenderId: "951257861281",
  appId: "1:951257861281:web:9abbdbbbe19b0f2d2eb4e0",
  measurementId: "G-QK0VZZ79Q4"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();


function generateAccountNumber() {
  return "2" + Math.floor(100000000 + Math.random() * 900000000);
}


export async function writeUserData(user) {
  const userRef = ref(db, "users/" + user.uid);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    await set(userRef, {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email,
      accountNumber: generateAccountNumber(),
      balance: 0,
      transactions: {}
    });
  }
}


document.getElementById("googleSignIn").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log(result);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error(error);
    });
});

document.getElementById("emailAndPasswordSignup").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const fullname = document.getElementById("fullname").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return updateProfile(user, { displayName: fullname }).then(() => {
        writeUserData({ ...user, displayName: fullname });
        window.location.href = "dashboard.html";
      });
    })
    .catch((error) => {
      console.error("Email sign-up failed", error);
      if (error.code === "auth/email-already-in-use") {
        errorMsg.textContent = "Email already in use. Please log in.";
      } else if (error.code.includes("weak-password")) {
        errorMsg.textContent = "Password too weak. Must be at least 6 characters.";
      } else {
        errorMsg.textContent = error.message;
      }
    });
});


const actionCodeSettings = {
  url: "https://swiftvault-ea713.firebaseapp.com/dashboard.html",
  handleCodeInApp: true
};

 