import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";


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


const tableBody = document.getElementById("transactionTableBody");


onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const txRef = ref(db, `users/${user.uid}/transactions`);

  onValue(txRef, (snapshot) => {
    const data = snapshot.val();
    tableBody.innerHTML = "";

    if (!data) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">No transactions found.</td></tr>';
      return;
    }

    
    const txArray = Object.values(data).reverse();

    txArray.forEach((tx) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.type}</td>
        <td>₦${parseFloat(tx.amount).toLocaleString()}</td>
      `;

      tableBody.appendChild(row);
    });
  });
});