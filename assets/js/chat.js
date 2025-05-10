const db = firebase.database();
const auth = firebase.auth();

// Get Order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("orderId");

if (!orderId) {
    alert("Invalid chat session.");
}

// ✅ Authenticate user
auth.onAuthStateChanged((user) => {
    if (user) {
        const userEmail = user.email;
        const chatRef = db.ref("chats/" + orderId);

        // ✅ Check if the user is sender or acceptor
        chatRef.once("value", (snapshot) => {
            const chatData = snapshot.val();
            if (!chatData) {
                alert("Chat not found.");
                return;
            }

            const senderId = chatData.senderId;
            const acceptorId = chatData.acceptorId;

            if (userEmail !== senderId && userEmail !== acceptorId) {
                alert("You are not authorized to access this chat.");
                return;
            }

            // ✅ Listen for new messages
            chatRef.child("messages").on("child_added", (snapshot) => {
                const message = snapshot.val();
                const chatBox = document.getElementById("chatBox");

                const messageDiv = document.createElement("div");
                messageDiv.textContent = `${message.sender}: ${message.text}`;
                chatBox.appendChild(messageDiv);
            });
        });

        // ✅ Send message function
        window.sendMessage = function () {
            const messageInput = document.getElementById("messageInput").value;
            if (messageInput.trim() === "") return;

            chatRef.child("messages").push({
                sender: userEmail,
                text: messageInput,
                timestamp: Date.now()
            });

            document.getElementById("messageInput").value = "";
        };
    } else {
        alert("You must be logged in to chat.");
    }
});
