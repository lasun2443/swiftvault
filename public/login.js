import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// ✅ Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAdZwzf7oEGIP39jt7rELp8Q1Gu3vdy2AU",
    authDomain: "swiftvault-ea713.firebaseapp.com",
    databaseURL: "https://swiftvault-ea713-default-rtdb.firebaseio.com",
    projectId: "swiftvault-ea713",
    storageBucket: "swiftvault-ea713.firebasestorage.app",
    messagingSenderId: "951257861281",
    appId: "1:951257861281:web:9abbdbbbe19b0f2d2eb4e0",
    measurementId: "G-QK0VZZ79Q4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realDb = getDatabase(app);


document.getElementById("googleSignIn").addEventListener("click", (e) => {
  e.preventDefault();
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user;
      await createUserIfFirstLogin(user);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Error signing in with Google:", error);
      document.getElementById("errorMsg").innerText = "Google Sign-In Failed";
    });
});


document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;
  let errorMsg = document.getElementById("errorMsg");
  errorMsg.innerHTML = "";

  if (!email || !password) {
    errorMsg.innerHTML = "Please enter both email and password.";
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      await createUserIfFirstLogin(user);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMsg.innerHTML =
          "Invalid email or password. Please try again.";
      } else {
        errorMsg.innerHTML =
          "An error occurred. Please try again later.";
      }
    });
});


async function createUserIfFirstLogin(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || "User",
      balance: 0,
      accountNumber: generateAccountNumber(),
      transactions: [],
      createdAt: serverTimestamp(),
    });

    await writeUserData(user); // Write to Realtime Database

    console.log(" New user created in Firestore and Realtime Database");
  } else {
    console.log("User already exists in Firestore");
  }
}


function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}
window.deposit = async function () {
  const amount = parseFloat(document.getElementById("depositAmount").value);
  if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount");

  const user = auth.currentUser;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const newBalance = userData.balance + amount;

  await updateDoc(userRef, {
    balance: newBalance,
    transactions: arrayUnion({
      type: "deposit",
      amount: amount,
      date: serverTimestamp(),
    }),
  });

  document.getElementById("balance").textContent = newBalance.toFixed(2);
  document.getElementById("depositAmount").value = "";
  alert(`₦{amount} deposited successfully`);

  
  const updatedSnap = await getDoc(userRef);
  renderTransactions(updatedSnap.data().transactions);
};
