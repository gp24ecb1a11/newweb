import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
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

// Create bargain modal HTML
const modalHTML = `
    <div id="bargainModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Make an Offer</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Offer (₹)</label>
                <input type="number" id="bargainAmount" min="0" step="10"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700/50 dark:text-white">
            </div>
            <div class="flex justify-end space-x-3">
                <button onclick="closeBargainModal()"
                    class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300">
                    Cancel
                </button>
                <button onclick="submitBargain()"
                    class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-300">
                    Submit Offer
                </button>
            </div>
        </div>
    </div>
`;

// Add modal to the page
document.body.insertAdjacentHTML('beforeend', modalHTML);

let currentBargainOrderId = null;
let currentBargainAmount = 0;

// Function to open bargain modal
window.openBargainModal = function (orderId, currentAmount) {
    currentBargainOrderId = orderId;
    currentBargainAmount = currentAmount;
    document.getElementById('bargainAmount').value = currentAmount;
    document.getElementById('bargainModal').classList.remove('hidden');
    document.getElementById('bargainModal').classList.add('flex');
};

// Function to close bargain modal
window.closeBargainModal = function () {
    document.getElementById('bargainModal').classList.add('hidden');
    document.getElementById('bargainModal').classList.remove('flex');
    currentBargainOrderId = null;
};

// Function to submit bargain
window.submitBargain = async function () {
    const offerAmount = Number(document.getElementById('bargainAmount').value);
    if (!currentBargainOrderId || !offerAmount) return;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const orderRef = doc(db, 'requests', currentBargainOrderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) throw new Error('Order not found');

        const orderData = orderDoc.data();
        if (!orderData.negotiable) throw new Error('This order is not negotiable');

        // Create a bargain offer
        const bargainRef = collection(db, 'bargains');
        await addDoc(bargainRef, {
            orderId: currentBargainOrderId,
            offeredBy: user.email,
            offeredAmount: offerAmount,
            originalAmount: currentBargainAmount,
            status: 'pending',
            createdAt: new Date()
        });

        // Show success message
        alert('Your offer has been submitted successfully!');
        closeBargainModal();
    } catch (error) {
        console.error('Error submitting bargain:', error);
        alert('Failed to submit offer. Please try again.');
    }
};

// Function to load available requests
function loadRequests() {
    const requestsContainer = document.getElementById("requestsContainer");
    requestsContainer.innerHTML = "<p class='text-gray-600'>Loading available requests...</p>";

    const requestsQuery = query(collection(db, "requests"), where("taken", "==", false));

    onSnapshot(requestsQuery, (snapshot) => {
        requestsContainer.innerHTML = "";

        if (snapshot.empty) {
            requestsContainer.innerHTML = "<p class='text-gray-600'>No available requests found.</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const requestId = docSnap.id;

            const requestCard = document.createElement("div");
            requestCard.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 animate-scale-up";
            requestCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${data.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 mt-1">${data.description}</p>
                        <div class="mt-2 flex items-center space-x-2">
                            <span class="text-sm text-gray-500 dark:text-gray-400">Reward: ₹${data.reward}</span>
                            ${data.negotiable ? '<span class="text-sm text-green-500">(Negotiable)</span>' : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        ${data.negotiable ? `
                            <button onclick="openBargainModal('${requestId}', ${data.reward})" 
                                class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-300">
                                Bargain
                            </button>
                        ` : ''}
                        <button onclick="acceptRequest('${requestId}')" 
                            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300">
                            Accept
                        </button>
                    </div>
                </div>
            `;
            requestsContainer.appendChild(requestCard);
        });
    });
}

// Function to accept request
window.acceptRequest = function (requestId) {
    window.location.href = `accept_order.html?id=${requestId}`;
};

// Authenticate user and load requests
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("usernameDisplay").textContent = user.email;
        document.getElementById("usernameDisplay").classList.remove("hidden");
        loadRequests();
    } else {
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    }
});
