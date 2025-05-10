import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
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

const ordersContainer = document.getElementById("acceptedOrdersContainer");
const noOrdersMessage = document.getElementById("noOrdersMessage");

// Ensure user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadAcceptedOrders();
    } else {
        window.location.href = "index.html"; // Redirect if not logged in
    }
});

// Function to load accepted orders
const loadAcceptedOrders = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const ordersContainer = document.getElementById("acceptedOrdersContainer");
        const bargainOffersContainer = document.getElementById("bargainOffersContainer");

        if (!ordersContainer || !bargainOffersContainer) {
            console.error("Containers not found");
            return;
        }

        ordersContainer.innerHTML = "<p class='text-gray-600'>Loading orders...</p>";
        bargainOffersContainer.innerHTML = "<p class='text-gray-600'>Loading bargain offers...</p>";

        // Query orders where either takenBy or acceptedEmail matches the current user's email
        const ordersQuery = query(
            collection(db, "requests"),
            where("takenBy", "==", user.email)
        );

        const querySnapshot = await getDocs(ordersQuery);
        const orders = [];

        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        // Sort orders by createdAt in memory
        orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA; // Sort in descending order (newest first)
        });

        displayOrders(orders, ordersContainer);

        // Load bargain offers
        await loadBargainOffers(user.email);
    } catch (error) {
        console.error("Error loading accepted orders:", error);
        const ordersContainer = document.getElementById("acceptedOrdersContainer");
        const bargainOffersContainer = document.getElementById("bargainOffersContainer");
        if (ordersContainer) {
            ordersContainer.innerHTML = "<p class='text-red-500'>Error loading orders. Please try again.</p>";
        }
        if (bargainOffersContainer) {
            bargainOffersContainer.innerHTML = "<p class='text-red-500'>Error loading bargain offers. Please try again.</p>";
        }
    }
};

// Function to display orders
const displayOrders = (orders, container) => {
    container.innerHTML = ""; // Clear the container before adding new orders

    if (orders.length === 0) {
        container.innerHTML = "<p class='text-gray-600'>No orders found.</p>";
        return;
    }

    orders.forEach((order) => {
        const orderCard = document.createElement("div");
        orderCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4";
        orderCard.innerHTML = `
            <div class="mb-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">${order.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mt-2">${order.description}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Reward</p>
                    <p class="font-semibold text-gray-900 dark:text-white">₹${order.reward}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p class="font-semibold ${getStatusColor(order.status)}">${order.status || 'Pending'}</p>
                </div>
            </div>

            <div class="space-y-2 mb-4">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    <a href="${order.location}" target="_blank" class="text-blue-500 hover:text-blue-600">
                        View Pickup Location
                    </a>
                </div>
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <a href="${order.deliveryLocation}" target="_blank" class="text-blue-500 hover:text-blue-600">
                        View Delivery Location
                    </a>
                </div>
                ${order.deadline ? `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">
                            Deadline: ${new Date(order.deadline.toDate()).toLocaleString()}
                        </span>
                    </div>
                ` : ''}
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Order Details</h4>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Created by: ${order.createdBy}</span>
                    </div>
                </div>
            </div>

            ${order.status === "Pending Confirmation" ? `
                <div class="flex justify-end space-x-2 mt-4">
                    <button class="confirm-order bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300" data-id="${order.id}">
                        Confirm Order
                    </button>
                </div>
            ` : ''}

            ${order.status === "Accepted" ? `
                <div class="flex justify-end space-x-2 mt-4">
                    <button class="update-status bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300" data-id="${order.id}" data-status="Out for Delivery">
                        Mark as Out for Delivery
                    </button>
                </div>
            ` : ''}

            ${order.status === "Out for Delivery" ? `
                <div class="flex justify-end space-x-2 mt-4">
                    <button class="update-status bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300" data-id="${order.id}" data-status="Delivered">
                        Mark as Delivered
                    </button>
                </div>
            ` : ''}
        `;

        container.appendChild(orderCard);

        // Add confirm order button functionality
        const confirmBtn = orderCard.querySelector('.confirm-order');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    // Store the order ID in sessionStorage for the accept order page
                    sessionStorage.setItem('pendingOrderId', order.id);
                    // Redirect to the accept order page
                    window.location.href = 'accept_order.html';
                } catch (error) {
                    console.error("Error confirming order:", error);
                    alert("Failed to confirm order");
                }
            });
        }

        // Add update status button functionality
        const updateStatusBtn = orderCard.querySelector('.update-status');
        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', async () => {
                const newStatus = updateStatusBtn.getAttribute('data-status');
                try {
                    await updateDoc(doc(db, "requests", order.id), {
                        status: newStatus,
                        lastUpdated: new Date()
                    });
                    alert(`Order status updated to ${newStatus}`);
                    window.location.reload();
                } catch (error) {
                    console.error("Error updating order status:", error);
                    alert("Failed to update order status");
                }
            });
        }

        // Add photo view button functionality
        const viewPhotoBtn = orderCard.querySelector('.view-photo');
        if (viewPhotoBtn) {
            viewPhotoBtn.addEventListener('click', () => {
                const photoUrl = viewPhotoBtn.getAttribute('data-photo');
                showPhotoModal(photoUrl);
            });
        }

        // Add QR view button functionality
        const viewQRBtn = orderCard.querySelector('.view-qr');
        if (viewQRBtn) {
            viewQRBtn.addEventListener('click', () => {
                const qrUrl = viewQRBtn.getAttribute('data-qr');
                showQRModal(qrUrl);
            });
        }
    });
};

// Helper function to get status color
function getStatusColor(status) {
    switch (status) {
        case "Accepted":
            return "text-blue-500";
        case "Out for Delivery":
            return "text-yellow-500";
        case "Delivered":
            return "text-green-500";
        default:
            return "text-gray-500";
    }
}

// Function to load bargain offers
const loadBargainOffers = async (userEmail) => {
    const bargainOffersContainer = document.getElementById("bargainOffersContainer");
    if (!bargainOffersContainer) return;

    try {
        // First get all orders where the user is either takenBy or createdBy
        const ordersQuery = query(
            collection(db, "requests"),
            where("takenBy", "==", userEmail)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const orderIds = ordersSnapshot.docs.map(doc => doc.id);

        if (orderIds.length === 0) {
            bargainOffersContainer.innerHTML = "<p class='text-gray-600'>No bargain offers found.</p>";
            return;
        }

        // Process orderIds in batches of 10
        const batchSize = 10;
        const allBargainOffers = [];

        for (let i = 0; i < orderIds.length; i += batchSize) {
            const batch = orderIds.slice(i, i + batchSize);
            const bargainOffersQuery = query(
                collection(db, "bargains"),
                where("orderId", "in", batch),
                where("status", "==", "pending")
            );

            const batchSnapshot = await getDocs(bargainOffersQuery);
            batchSnapshot.forEach(doc => {
                allBargainOffers.push({ id: doc.id, ...doc.data() });
            });
        }

        // Display all bargain offers
        if (allBargainOffers.length === 0) {
            bargainOffersContainer.innerHTML = "<p class='text-gray-600'>No bargain offers found.</p>";
            return;
        }

        bargainOffersContainer.innerHTML = "";
        allBargainOffers.forEach(data => {
            const bargainId = data.id;

            // Create bargain offer card
            const bargainCard = document.createElement("div");
            bargainCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4";
            bargainCard.innerHTML = `
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Bargain Offer</h3>
                    <p class="text-gray-600 dark:text-gray-300 mt-2">From: ${data.offeredBy}</p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Original Amount</p>
                        <p class="font-semibold text-gray-900 dark:text-white">₹${data.originalAmount}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Offered Amount</p>
                        <p class="font-semibold text-yellow-500">₹${data.offeredAmount}</p>
                    </div>
                </div>

                <div class="flex justify-end space-x-2">
                    <button class="reject-bargain bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300" data-id="${bargainId}">
                        Reject
                    </button>
                    <button class="accept-bargain bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300" data-id="${bargainId}">
                        Accept
                    </button>
                </div>
            `;

            bargainOffersContainer.appendChild(bargainCard);

            // Add accept button functionality
            const acceptBtn = bargainCard.querySelector('.accept-bargain');
            acceptBtn.addEventListener('click', async () => {
                try {
                    // Update the bargain status
                    await updateDoc(doc(db, "bargains", bargainId), {
                        status: "accepted",
                        acceptedAt: new Date()
                    });

                    // Update the order's reward amount and status
                    await updateDoc(doc(db, "requests", data.orderId), {
                        reward: data.offeredAmount,
                        status: "Pending Confirmation",
                        taken: true,
                        takenBy: data.offeredBy,
                        lastUpdated: new Date()
                    });

                    alert('Bargain offer accepted successfully!');
                    window.location.reload();
                } catch (error) {
                    console.error("Error accepting bargain:", error);
                    alert('Failed to accept bargain offer. Please try again.');
                }
            });

            // Add reject button functionality
            const rejectBtn = bargainCard.querySelector('.reject-bargain');
            rejectBtn.addEventListener('click', async () => {
                try {
                    await updateDoc(doc(db, "bargains", bargainId), {
                        status: "rejected",
                        rejectedAt: new Date()
                    });
                    alert('Bargain offer rejected.');
                    window.location.reload();
                } catch (error) {
                    console.error("Error rejecting bargain:", error);
                    alert('Failed to reject bargain offer. Please try again.');
                }
            });
        });
    } catch (error) {
        console.error("Error loading bargain offers:", error);
        bargainOffersContainer.innerHTML = "<p class='text-red-600'>Failed to load bargain offers.</p>";
    }
};
