const db = firebase.database();
const auth = firebase.auth();

function acceptOrder(orderId) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const acceptorEmail = user.email;
            const orderRef = db.ref("orders/" + orderId);

            orderRef.once("value", (snapshot) => {
                const orderData = snapshot.val();
                if (!orderData) {
                    alert("Order not found.");
                    return;
                }

                const senderEmail = orderData.senderId; // Order creator

                // ✅ Update order with acceptor's email
                orderRef.update({ acceptorId: acceptorEmail });

                // ✅ Create a chat entry for this order in Firebase
                const chatRef = db.ref("chats/" + orderId);
                chatRef.set({
                    senderId: senderEmail,
                    acceptorId: acceptorEmail,
                    messages: {} // Empty messages initially
                });

                alert("Order accepted! Chat is now available.");
                window.location.href = `chat.html?orderId=${orderId}`; // Redirect to chat
            });
        } else {
            alert("You must be logged in to accept orders.");
        }
    });
}
