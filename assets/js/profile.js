import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAeOS8_0tDWKnfAwLf0GRKr6JaopYj1nnY",
    authDomain: "dormdash-40a10.firebaseapp.com",
    projectId: "dormdash-40a10",
    storageBucket: "dormdash-40a10.appspot.com",
    messagingSenderId: "219135353050",
    appId: "1:219135353050:web:49446a2e74414ebf8105e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to convert image to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
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

// Function to format currency
function formatCurrency(amount) {
    return `₹${amount}`;
}

// Function to format date
function formatDate(date) {
    return new Date(date).toLocaleString();
}

// Function to load user profile data
async function loadUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById("userName").textContent = data.fullName || "User";
            document.getElementById("userEmail").textContent = data.email || "No email";
            document.getElementById("displayName").value = data.fullName || "";
            document.getElementById("phoneNumber").value = data.mobileNumber || "";

            // Update ID card image if it exists
            if (data.idCardUrl) {
                const idCardImage = document.getElementById("profilePhoto");
                idCardImage.src = data.idCardUrl;
            }
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

// Function to load user stats
async function loadUserStats(userEmail) {
    try {
        // Get orders placed by user
        const placedOrdersQuery = query(collection(db, "requests"), where("createdBy", "==", userEmail));
        const placedOrdersSnapshot = await getDocs(placedOrdersQuery);
        const ordersPlaced = placedOrdersSnapshot.size;

        // Get orders accepted by user
        const acceptedOrdersQuery = query(collection(db, "requests"), where("acceptedEmail", "==", userEmail));
        const acceptedOrdersSnapshot = await getDocs(acceptedOrdersQuery);
        const ordersAccepted = acceptedOrdersSnapshot.size;

        // Calculate total earnings
        let totalEarnings = 0;
        acceptedOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "Delivered" && data.reward) {
                totalEarnings += Number(data.reward);
            }
        });

        // Update stats in UI
        document.getElementById("ordersPlaced").textContent = ordersPlaced;
        document.getElementById("ordersAccepted").textContent = ordersAccepted;
        document.getElementById("totalEarnings").textContent = formatCurrency(totalEarnings);
    } catch (error) {
        console.error("Error loading user stats:", error);
    }
}

// Handle ID card upload
document.getElementById("profilePhotoInput").addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Validate file
        validateFileSize(file);
        validateFileType(file);

        // Show loading state
        const idCardImage = document.getElementById("profilePhoto");
        idCardImage.src = "assets/images/loading.gif"; // Add a loading gif to your assets

        // Convert to base64
        const base64Image = await convertToBase64(file);

        // Update UI
        idCardImage.src = base64Image;
    } catch (error) {
        console.error("Error processing image:", error);
        alert(error.message || "Failed to process image. Please try again.");
    }
});

// Handle settings form submission
document.getElementById("settingsForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("Please log in to update your profile.");
        return;
    }

    const fullName = document.getElementById("displayName").value.trim();
    const mobileNumber = document.getElementById("phoneNumber").value.trim();
    const idCardUrl = document.getElementById("profilePhoto").src; // This will be the base64 string

    try {
        const userRef = doc(db, "users", user.uid);
        const updateData = {
            fullName,
            mobileNumber,
            idCardUrl, // Using the correct field name 'idCardUrl'
            lastUpdated: new Date()
        };

        await updateDoc(userRef, updateData);
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
    }
});

// Initialize profile when user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserProfile(user.uid);
        loadUserStats(user.email);
    } else {
        window.location.href = "index.html";
    }
}); 