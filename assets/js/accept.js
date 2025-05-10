import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Function to convert image to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Firebase configuration
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

document.addEventListener("DOMContentLoaded", async function () {
    // Get order ID from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('id');
    
    // If no order ID in URL, check sessionStorage
    if (!orderId) {
        orderId = sessionStorage.getItem('pendingOrderId');
    }

    if (!orderId) {
        alert("No order ID found. Please go back to the orders page and try again.");
        window.location.href = "your_orders.html";
        throw new Error("No order ID found");
    }

    // Clear the order ID from sessionStorage after retrieving it
    sessionStorage.removeItem('pendingOrderId');

    // Get references to DOM elements
    const orderDetails = document.getElementById("orderDetails");
    const acceptForm = document.getElementById("acceptForm");
    const acceptPhotoInput = document.getElementById("acceptPhoto");
    const paymentQRInput = document.getElementById("paymentQR");
    const acceptLocationInput = document.getElementById("acceptLocation");
    const acceptButton = document.getElementById("acceptButton");
    const loadingSpinner = document.getElementById("loadingSpinner");

    const orderTitle = document.getElementById("orderTitle");
    const orderDescription = document.getElementById("orderDescription");
    const orderReward = document.getElementById("orderReward");
    const orderDeadline = document.getElementById("orderDeadline");
    const confirmBtn = document.getElementById("confirmOrder");

    if (!orderId) {
        console.error("No order ID found in URL.");
        return;
    }

    // Fetch order details from Firestore
    const orderRef = doc(db, "requests", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        console.error("Order not found in Firestore.");
        return;
    }

    const orderData = orderSnap.data();
    orderTitle.textContent = orderData.title;
    orderDescription.textContent = orderData.description;
    orderReward.textContent = `Reward: ₹${orderData.reward}`;

    // Format and display deadline
    if (orderData.deadline) {
        const deadlineDate = orderData.deadline.toDate();
        const formattedDeadline = deadlineDate.toLocaleString();
        orderDeadline.textContent = `Deadline: ${formattedDeadline}`;

        // Check if deadline has passed
        if (deadlineDate < new Date()) {
            orderDeadline.classList.add('text-red-500');
            orderDeadline.textContent += ' (Deadline passed)';
            confirmBtn.disabled = true;
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } else {
        orderDeadline.textContent = 'No deadline specified';
    }

    // Authenticate user before allowing order acceptance
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "index.html"; // Redirect if not signed in
            return;
        }

        confirmBtn.addEventListener("click", async function () {
            const userName = document.getElementById("userName").value.trim();
            const userPhone = document.getElementById("userPhone").value.trim();
            const userLocation = document.getElementById("userLocation").value.trim();
            const userPhotoInput = document.getElementById("userPhoto");
            const paymentQRInput = document.getElementById("paymentQR");

            if (!userName || !userPhone || !userLocation) {
                alert("Please enter your name, phone number, and Google Maps link.");
                return;
            }

            try {
                let photoUrl = null;
                let paymentQRUrl = null;

                // Handle photo upload if a file is selected
                if (userPhotoInput.files.length > 0) {
                    const file = userPhotoInput.files[0];
                    photoUrl = await convertToBase64(file);
                }

                // Handle QR code upload if a file is selected
                if (paymentQRInput.files.length > 0) {
                    const file = paymentQRInput.files[0];
                    paymentQRUrl = await convertToBase64(file);
                }

                // Function to handle order acceptance
                const handleOrderAcceptance = async (orderId, userEmail, userPhone, photoUrl, qrUrl) => {
                    try {
                        // Check if this is a pending order confirmation
                        const orderDoc = await getDoc(doc(db, "requests", orderId));
                        const orderData = orderDoc.data();

                        if (orderData.status === "Pending Confirmation") {
                            // Update the order status to Accepted
                            await updateDoc(doc(db, "requests", orderId), {
                                status: "Accepted",
                                taken: true,
                                takenBy: userEmail,
                                acceptedByPhone: userPhone,
                                acceptedPhoto: photoUrl,
                                paymentQR: qrUrl,
                                acceptedLocation: userLocation,
                                lastUpdated: new Date()
                            });

                            alert('Order confirmed successfully!');
                            window.location.href = 'accepted_orders.html';
                        } else {
                            // Regular order acceptance
                            await updateDoc(doc(db, "requests", orderId), {
                                status: "Accepted",
                                taken: true,
                                takenBy: userEmail,
                                acceptedByPhone: userPhone,
                                acceptedPhoto: photoUrl,
                                paymentQR: qrUrl,
                                acceptedLocation: userLocation,
                                lastUpdated: new Date()
                            });

                            alert('Order accepted successfully!');
                            window.location.href = 'accepted_orders.html';
                        }
                    } catch (error) {
                        console.error("Error accepting/confirming order:", error);
                        alert('Failed to accept/confirm order. Please try again.');
                    }
                };

                await handleOrderAcceptance(orderId, user.email, userPhone, photoUrl, paymentQRUrl);
            } catch (error) {
                console.error("Error accepting order:", error);
                alert("Failed to accept order.");
            }
        });
    });
});
