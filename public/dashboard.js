import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
  push
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


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
const db = getDatabase(app);
const firestore = getFirestore(app);


let currentUser = null;
let userId = null;
let userRef = null;
let txRef = null;


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  userId = user.uid;
  userRef = ref(db, `users/${userId}`);
  txRef = ref(db, `users/${userId}/transactions`);

  document.getElementById("myScreen").innerText = ` ${user.displayName || user.email}`;

  await ensureUserData(user);
  await initializeAccountNumber(user);
  await initializeUserData();


  setupBalanceListener();
});


async function initializeAccountNumber(user) {
  const userDocRef = doc(firestore, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  let accountNumber;
  if (userSnap.exists() && userSnap.data().accountNumber) {
    accountNumber = userSnap.data().accountNumber;
  } else {
    accountNumber = generateAccountNumber();
    await setDoc(userDocRef, {
      accountNumber,
      email: user.email,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }

  document.getElementById("actNumber").innerText = accountNumber;
}


async function initializeUserData() {
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {

    await set(userRef, {
      balance: 0,
      transactions: {},
      lastUpdated: new Date().toISOString()
    });
  } else if (snapshot.val().balance === undefined) {

    await update(userRef, {
      balance: 0,
      lastUpdated: new Date().toISOString()
    });
  }
}


function setupBalanceListener() {
  onValue(userRef, (snapshot) => {
    const userData = snapshot.val();
    const balance = userData?.balance || 0;
    document.getElementById("accountBalance").innerText = balance.toLocaleString();
  });
}


window.deposit = async function () {
  await processTransaction('deposit');
};

window.withdraw = async function () {
  await processTransaction('withdraw');
};


async function processTransaction(type) {
  const amountInput = document.getElementById("amountInput");
  const amount = parseFloat(amountInput.value);


  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive amount");
    return;
  }

  try {
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error("User account not found");
    }

    const userData = snapshot.val();
    let newBalance = userData.balance || 0;


    if (type === 'deposit') {
      newBalance += amount;
    } else if (type === 'withdraw') {
      if (newBalance < amount) {
        alert("Insufficient funds for withdrawal");
        return;
      }
      newBalance -= amount;
    }


    const updates = {};
    updates['balance'] = newBalance;
    updates['lastUpdated'] = new Date().toISOString();


    const newTxRef = push(txRef);
    updates[`transactions/${newTxRef.key}`] = {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      amount,
      date: new Date().toISOString(),
      balanceAfter: newBalance
    };


    await update(userRef, updates);


    amountInput.value = "";
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} successful! New balance: ${newBalance.toLocaleString()}`);
  } catch (error) {
    console.error(`${type} error:`, error);
    alert(`Transaction failed: ${error.message}`);
  }
}


function generateAccountNumber() {
  return "2" + Math.floor(100000000 + Math.random() * 900000000);
}


document.getElementById("logOut").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
async function ensureUserData(user) {
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    await set(userRef, {
      uid: user.uid,
      name: user.displayName || user.email,
      email: user.email,
      accountNumber: generateAccountNumber(),
      balance: 0,
      transactions: {},
      lastUpdated: new Date().toISOString()
    });
  }
}
