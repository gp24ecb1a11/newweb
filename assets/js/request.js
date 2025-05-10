import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyAeOS8_0tDWKnfAwLf0GRKr6JaopYj1nnY",
    authDomain: "dormdash-40a10.firebaseapp.com",
    projectId: "dormdash-40a10",
    storageBucket: "dormdash-40a10.appspot.com",
    messagingSenderId: "219135353050",
    appId: "1:219135353050:web:49446a2e74414ebf8105e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to generate a unique order number
function generateOrderNumber() {
    return `DD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// Function to format currency
function formatCurrency(amount) {
    return `₹${amount}`;
}

// Function to update reward amount
async function updateRewardAmount(orderId, newAmount) {
    try {
        const orderRef = doc(db, "requests", orderId);
        await updateDoc(orderRef, {
            reward: newAmount,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error("Error updating reward:", error);
        throw error;
    }
}

// Function to get user's phone number from Firestore
async function getUserPhoneNumber(userEmail) {
    const userRef = doc(db, "users", userEmail);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data().phone || "Not available";
    }
    return "Not available";
}

document.addEventListener("DOMContentLoaded", () => {
    const orderForm = document.getElementById("orderForm");
    const companySelect = document.getElementById("company");
    const otherCompanyInput = document.getElementById("otherCompany");
    const rewardSlider = document.getElementById("rewardSlider");
    const rewardInput = document.getElementById("reward");
    const rewardValue = document.getElementById("rewardValue");

    if (!orderForm) {
        console.error("Error: orderForm not found.");
        return;
    }

    // Show/hide the other company input field
    companySelect.addEventListener("change", () => {
        otherCompanyInput.classList.toggle("hidden", companySelect.value !== "Other");
    });

    // Handle reward slider changes
    if (rewardSlider && rewardInput && rewardValue) {
        rewardSlider.addEventListener("input", (e) => {
            const value = e.target.value;
            rewardInput.value = value;
            rewardValue.textContent = formatCurrency(value);
        });

        rewardInput.addEventListener("input", (e) => {
            let value = parseInt(e.target.value);
            if (value < 10) value = 10;
            if (value > 1000) value = 1000;
            rewardSlider.value = value;
            rewardValue.textContent = formatCurrency(value);
        });
    }

    orderForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to place an order.");
            return;
        }

        const title = document.getElementById("title").value;
        const phone = document.getElementById("phone").value;
        const description = document.getElementById("description").value;
        const reward = document.getElementById("reward").value;
        const requestloc = document.getElementById("location").value;
        const orderNumber = generateOrderNumber();

        let company = companySelect.value;
        if (company === "Other") {
            company = otherCompanyInput.value.trim();
        }

        if (!company) {
            alert("Please enter a company name.");
            return;
        }

        try {
            // Get user data
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            // Create request object
            const requestData = {
                title,
                description,
                reward: parseInt(reward),
                company,
                createdBy: user.email,
                createdAt: new Date(),
                status: "Pending",
                taken: false,
                requesterPhoto: userData.profilePhotoUrl || null,
                requesterName: userData.fullName || user.email,
                createdloc: requestloc
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, "requests"), requestData);

            // Set up real-time listener for reward updates
            onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    if (!data.taken) {
                        // Update UI if the order is not taken
                        rewardSlider.value = data.reward;
                        rewardInput.value = data.reward;
                        rewardValue.textContent = formatCurrency(data.reward);
                    }
                }
            });

            alert(`Order placed successfully! Order Number: ${orderNumber}`);
            window.location.href = "available_requests.html";
        } catch (error) {
            console.error("Error adding order:", error);
            alert("Error creating order. Please try again.");
        }
    });
});
