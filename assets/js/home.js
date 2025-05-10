import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeOS8_0tDWKnfAwLf0GRKr6JaopYj1nnY",
  authDomain: "dormdash-40a10.firebaseapp.com",
  projectId: "dormdash-40a10",
  storageBucket: "dormdash-40a10.appspot.com",
  messagingSenderId: "219135353050",
  appId: "1:219135353050:web:49446a2e74414ebf8105e3"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("afterLogin").classList.remove("hidden");
  } else {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("afterLogin").classList.add("hidden");
  }
});

// ✅ Login Function
document.getElementById("loginButton").addEventListener("click", function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // 🚨 Prevent empty input
  if (email === "" || password === "") {
    alert("⚠️ Please enter both email and password.");
    return;
  }

  // 🚨 Restrict to NIT Warangal emails only
  if (!email.endsWith("@student.nitw.ac.in")) {
    alert("❌ Only NIT Warangal emails (@nitw.ac.in) are allowed.");
    return; // ❗ Stops execution here, preventing Firebase login
  }

  // ✅ Proceed with Firebase Authentication
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Hide login form and show after login content
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("afterLogin").classList.remove("hidden");
    })
    .catch((error) => {
      // ✅ User-friendly error messages
      let errorMessage = "❌ Login failed! ";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage += "Invalid email format.";
          break;
        case "auth/user-not-found":
          errorMessage += "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage += "Incorrect password.";
          break;
        case "auth/too-many-requests":
          errorMessage += "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage += error.message;
      }
      alert(errorMessage);
    });
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
  signOut(auth).then(() => {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("afterLogin").classList.add("hidden");
  }).catch((error) => {
    console.error("Logout Error:", error);
    alert("Failed to logout. Please try again.");
  });
});
