import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// ✅ Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAeOS8_0tDWKnfAwLf0GRKr6JaopYj1nnY",
    authDomain: "dormdash-40a10.firebaseapp.com",
    projectId: "dormdash-40a10",
    storageBucket: "dormdash-40a10.appspot.com",
    messagingSenderId: "219135353050",
    appId: "1:219135353050:web:49446a2e74414ebf8105e3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to upload image and get URL
async function uploadImage(file, path) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

// Function to validate file size (max 5MB)
function validateFileSize(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
    }
}

// Function to validate file type
function validateFileType(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG, PNG, or JPG)');
    }
}

// ✅ Signup Function
document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const mobileNumber = document.getElementById("mobile-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const idCardFile = document.getElementById("id-card").files[0];
    const aadharFile = document.getElementById("aadhar").files[0];
    const profilePhotoFile = document.getElementById("profile-photo").files[0];

    // 🚨 Prevent empty input
    if (!fullName || !mobileNumber || !email || !username || !password) {
        alert("⚠️ Please fill in all the fields.");
        return;
    }

    // 🚨 Restrict to NIT Warangal emails only
    if (!email.endsWith("@student.nitw.ac.in")) {
        alert("❌ Only NIT Warangal emails (@nitw.ac.in) are allowed.");
        return; // ❗ Stops execution here, preventing Firebase login
    }

    try {
        // Validate files
        if (idCardFile) {
            validateFileSize(idCardFile);
            validateFileType(idCardFile);
        }
        if (aadharFile) {
            validateFileSize(aadharFile);
            validateFileType(aadharFile);
        }
        if (profilePhotoFile) {
            validateFileSize(profilePhotoFile);
            validateFileType(profilePhotoFile);
        }

        // ✅ Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Upload images and get URLs
        let idCardUrl = null;
        let aadharUrl = null;
        let profilePhotoUrl = null;
        if (idCardFile) {
            idCardUrl = await uploadImage(idCardFile, `id-cards/${user.uid}/${idCardFile.name}`);
        }
        if (aadharFile) {
            aadharUrl = await uploadImage(aadharFile, `aadhar-cards/${user.uid}/${aadharFile.name}`);
        }
        if (profilePhotoFile) {
            profilePhotoUrl = await uploadImage(profilePhotoFile, `profile-photos/${user.uid}/${profilePhotoFile.name}`);
        }

        // ✅ Store user info in Firestore
        await setDoc(doc(db, "users", user.uid), {
            fullName,
            mobileNumber,
            email,
            username,
            idCardUrl,
            aadharUrl,
            profilePhotoUrl,
            createdAt: new Date(),
            role: "user"
        });

        alert("✅ Sign-up successful! Redirecting to login...");
        window.location.href = "index.html"; // Redirect to login page

    } catch (error) {
        console.error("Error during signup:", error);
        alert(error.message || "An error occurred during signup. Please try again.");
    }
});
