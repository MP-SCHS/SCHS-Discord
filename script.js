// 1. Configuration - Using a unique name 'sbClient' to avoid declaration errors
const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const sbClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase system initialized.");

// 2. Request Notification Permission
function enableNotifications() {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("Notifications enabled! You will now receive alerts.");
        } else {
            alert("Notifications are currently: " + permission);
        }
    });
}

// 3. Helper function to add messages to the HTML screen
function appendMessageToScreen(email, content) {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        const msgElement = document.createElement('p');
        msgElement.style.borderBottom = "1px solid #eee";
        msgElement.style.padding = "5px";
        msgElement.innerHTML = `<strong>${email}:</strong> ${content}`;
        chatBox.appendChild(msgElement);
        
        // Auto-scroll to the bottom of the chat
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// 4. Load Existing Message History on Page Load
async function loadHistory() {
    const { data, error } = await sbClient
        .from('messages')
        .select('*')
        .order('id', { ascending: true })
        .limit(50); // Gets the last 50 messages

    if (data) {
        data.forEach(msg => {
            appendMessageToScreen(msg.sender_email, msg.content);
        });
    }
}

// 5. Send Message to Supabase
async function send() {
    const email = document.getElementById('emailInput').value;
    const content = document.getElementById('msgInput').value;

    if (!email || !content) {
        alert("Please enter both an email and a message.");
        return;
    }

    const { error } = await sbClient
        .from('messages')
        .insert([{ sender_email: email, content: content }]);

    if (error) {
        console.error("Insert Error:", error.message);
        alert("Database Error: " + error.message);
    } else {
        document.getElementById('msgInput').value = ""; // Clear message box
    }
}

// 6. Realtime Listener: Triggered when ANYONE sends a message
sbClient
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new;
        
        // Update the screen instantly
        appendMessageToScreen(newMessage.sender_email, newMessage.content);
        
        // Send Desktop Notification if tab is hidden
        if (Notification.permission === "granted" && document.visibilityState !== "visible") {
            new Notification(`New Message from ${newMessage.sender_email}`, {
                body: newMessage.content
            });
        }
    })
    .subscribe();

// Run history load on startup
loadHistory();