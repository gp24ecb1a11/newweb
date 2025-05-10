import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase Config
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

// Function to delete order
async function deleteOrder(orderId) {
    try {
        const orderRef = doc(db, "requests", orderId);
        await deleteDoc(orderRef);
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
}

// Function to load user orders
const loadUserOrders = async (userEmail) => {
    const ordersContainer = document.getElementById("ordersContainer");
    ordersContainer.innerHTML = "<p class='text-gray-600'>Loading your orders...</p>";

    try {
        const ordersQuery = query(collection(db, "requests"), where("createdBy", "==", userEmail));

        onSnapshot(ordersQuery, (snapshot) => {
            displayOrders(snapshot.docs, ordersContainer, userEmail);
        });
    } catch (error) {
        console.error("Error loading user orders:", error);
        ordersContainer.innerHTML = "<p class='text-red-600'>Failed to load your orders.</p>";
    }
};

// Function to display orders
const displayOrders = (docs, container, userEmail) => {
    if (docs.length === 0) {
        container.innerHTML = "<p class='text-gray-600'>No orders found.</p>";
        return;
    }

    container.innerHTML = ""; // Clear the container before adding new orders

    docs.forEach((docSnap) => {
        const data = docSnap.data();
        const orderId = docSnap.id;

        // Create order card
        const orderCard = document.createElement("div");
        orderCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4";
        orderCard.innerHTML = `
            <div class="mb-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">${data.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mt-2">${data.description}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Reward</p>
                    <p class="font-semibold text-gray-900 dark:text-white">₹${data.reward}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p class="font-semibold text-blue-500">${data.status || 'Pending'}</p>
                </div>
            </div>

            <div class="space-y-2 mb-4">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    <a href="${data.acceptedLocation}" target="_blank" class="text-blue-500 hover:text-blue-600">
                        View Location
                    </a>
                </div>
                ${data.deadline ? `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">
                            Deadline: ${new Date(data.deadline.toDate()).toLocaleString()}
                        </span>
                    </div>
                ` : ''}
                ${data.acceptedPhoto ? `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <button class="view-photo text-blue-500 hover:text-blue-600" data-photo="${data.acceptedPhoto}">
                            View Accepted Photo
                        </button>
                    </div>
                ` : ''}
                ${data.paymentQR ? `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                        </svg>
                        <button class="view-qr text-blue-500 hover:text-blue-600" data-qr="${data.paymentQR}">
                            View Payment QR
                        </button>
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
                        <span class="text-gray-600 dark:text-gray-300">Accepted by: ${data.acceptedEmail|| data.takenBy || 'Not accepted yet'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Phone: ${data.acceptedByPhone || 'Not provided'}</span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(orderCard);

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

// Function to show photo in modal
function showPhotoModal(photoUrl) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('photoModal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'photoModal';
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50';
        modalContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg max-w-2xl w-full mx-4 relative">
                <button class="close-modal absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <img src="${photoUrl}" alt="Order Photo" class="w-full h-auto rounded-lg">
            </div>
        `;
        document.body.appendChild(modalContainer);

        // Add event listener for close button
        const closeBtn = modalContainer.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modalContainer.classList.add('hidden');
        });

        // Add event listener for clicking outside the modal
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.classList.add('hidden');
            }
        });
    }

    // Update photo URL and show modal
    const modalImg = modalContainer.querySelector('img');
    modalImg.src = photoUrl;
    modalContainer.classList.remove('hidden');
}

// Function to show QR code in modal
function showQRModal(qrUrl) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('qrModal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'qrModal';
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50';
        modalContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg max-w-md w-full mx-4 relative">
                <button class="close-modal absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <h3 class="text-lg font-semibold mb-4">Payment QR Code</h3>
                <img src="${qrUrl}" alt="Payment QR Code" class="w-full h-auto rounded-lg">
                <p class="text-sm text-gray-600 mt-4">Scan this QR code to make the payment</p>
            </div>
        `;
        document.body.appendChild(modalContainer);

        // Add event listener for close button
        const closeBtn = modalContainer.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modalContainer.classList.add('hidden');
        });

        // Add event listener for clicking outside the modal
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.classList.add('hidden');
            }
        });
    }

    // Update QR URL and show modal
    const modalImg = modalContainer.querySelector('img');
    modalImg.src = qrUrl;
    modalContainer.classList.remove('hidden');
}

// Function to load bargain offers
const loadBargainOffers = async (userEmail) => {
    const bargainOffersContainer = document.getElementById("bargainOffersContainer");
    bargainOffersContainer.innerHTML = "<p class='text-gray-600'>Loading bargain offers...</p>";

    try {
        // First get all orders created by the user
        const ordersQuery = query(collection(db, "requests"), where("createdBy", "==", userEmail));
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

// Authenticate user and load their orders
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("usernameDisplay").textContent = user.email;
        document.getElementById("usernameDisplay").classList.remove("hidden");
        loadUserOrders(user.email);
        loadBargainOffers(user.email);
    } else {
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    }
});
