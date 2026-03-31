// 1. Configuration
const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const sbClient = supabase.createClient(supabaseUrl, supabaseKey);

let myCurrentEmail = "";
let currentView = "private"; // Default view

// 2. Login & Notifications
function enableNotifications() {
    const emailInput = document.getElementById('myEmail').value;
    if (!emailInput) return alert("Please enter your email to log in!");
    
    myCurrentEmail = emailInput.toLowerCase().trim();
    
    Notification.requestPermission().then(permission => {
        document.getElementById('status').innerText = `Status: Online as ${myCurrentEmail}`;
        document.getElementById('status').style.color = "#42b72a";
        loadHistory(); 
        alert("Logged in successfully!");
    });
}

// 3. Switch between Private and Global
function setView(view) {
    currentView = view;
    
    // Update button UI
    document.getElementById('btnPriv').classList.toggle('active', view === 'private');
    document.getElementById('btnGlob').classList.toggle('active', view === 'global');
    
    loadHistory();
}

// 4. Load History from Database
async function loadHistory() {
    if (!myCurrentEmail) return;

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = "<p style='text-align:center; color:#666;'>Loading history...</p>";

    let query = sbClient.from('messages').select('*');
    
    if (currentView === "global") {
        query = query.eq('receiver_email', 'global');
    } else {
        query = query.or(`receiver_email.eq.${myCurrentEmail},sender_email.eq.${myCurrentEmail}`);
    }

    const { data, error } = await query.order('id', { ascending: true });

    chatBox.innerHTML = ""; // Clear loader
    if (data) {
        data.forEach(msg => {
            // In history, if I sent it, label it "Me"
            const senderLabel = (msg.sender_email === myCurrentEmail) ? "Me" : msg.sender_email;
            appendMessageToScreen(senderLabel, msg.content, msg.sender_email === myCurrentEmail);
        });
    }
}

// 5. Add Bubble to Screen
function appendMessageToScreen(sender, content, isMe) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    
    // Apply CSS classes for the bubble look
    msgDiv.className = isMe ? 'msg-item msg-me' : 'msg-item';
    
    msgDiv.innerHTML = `
        <span class="msg-sender">${isMe ? "Me" : sender}</span>
        <div class="msg-content">${content}</div>
    `;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 6. Send Message
async function send() {
    const toInput = document.getElementById('toEmail').value.toLowerCase().trim();
    const content = document.getElementById('msgInput').value;
    const destination = toInput || "global";

    if (!myCurrentEmail) return alert("Please login first!");
    if (!content) return;

    const { error } = await sbClient.from('messages').insert([{ 
        sender_email: myCurrentEmail, 
        receiver_email: destination, 
        content: content 
    }]);

    if (error) {
        console.error(error);
    } else {
        document.getElementById('msgInput').value = "";
    }
}

// 7. Realtime Listener
sbClient
    .channel('chat-updates')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;

        // Logic for Global Messages
        if (msg.receiver_email === "global") {
            if (currentView === "global") {
                appendMessageToScreen(msg.sender_email, msg.content, msg.sender_email === myCurrentEmail);
            }
            triggerNotification("Global Chat", msg);
        } 
        // Logic for Private Messages
        else if (msg.receiver_email === myCurrentEmail) {
            if (currentView === "private") {
                appendMessageToScreen(msg.sender_email, msg.content, false);
            }
            triggerNotification("Private Message", msg);
        }
        // Logic for My Sent Messages (to show them instantly)
        else if (msg.sender_email === myCurrentEmail && msg.receiver_email !== "global") {
            if (currentView === "private") {
                appendMessageToScreen("Me", msg.content, true);
            }
        }
    })
    .subscribe();

// 8. Notification Helper
function triggerNotification(type, msg) {
    // Only notify if we aren't looking at the tab and it's not from us
    if (msg.sender_email !== myCurrentEmail && Notification.permission === "granted" && document.visibilityState !== "visible") {
        new Notification(`${type} from ${msg.sender_email}`, {
            body: msg.content
        });
    }
}