const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const sbClient = supabase.createClient(supabaseUrl, supabaseKey);

let myCurrentEmail = "";
let currentView = "private"; // Tracks if we are looking at 'private' or 'global'

function setView(view) {
    currentView = view;
    document.getElementById('btnPriv').style.background = (view === 'private') ? '#2196F3' : '#eee';
    document.getElementById('btnGlob').style.background = (view === 'global') ? '#2196F3' : '#eee';
    loadHistory();
}

// 1. Login
function enableNotifications() {
    const emailInput = document.getElementById('myEmail').value;
    if (!emailInput) return alert("Please enter your email!");
    myCurrentEmail = emailInput.toLowerCase().trim();
    Notification.requestPermission().then(() => {
        alert("Logged in!");
        loadHistory();
    });
}

// 2. Load History with Filter
async function loadHistory() {
    if (!myCurrentEmail) return;
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = "Loading...";

    let query = sbClient.from('messages').select('*');
    
    if (currentView === "global") {
        query = query.eq('receiver_email', 'global');
    } else {
        query = query.or(`receiver_email.eq.${myCurrentEmail},sender_email.eq.${myCurrentEmail}`);
    }

    const { data } = await query.order('id', { ascending: true });
    chatBox.innerHTML = "";
    if (data) data.forEach(msg => appendMessageToScreen(msg.sender_email, msg.content));
}

function appendMessageToScreen(sender, content) {
    const chatBox = document.getElementById('chat-box');
    const msgElement = document.createElement('p');
    msgElement.innerHTML = `<strong>${sender}:</strong> ${content}`;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. Send Message (Logic for Private vs Global)
async function send() {
    const toInput = document.getElementById('toEmail').value.toLowerCase().trim();
    const content = document.getElementById('msgInput').value;
    
    // If toInput is empty, it becomes a "global" message
    const destination = toInput || "global";

    if (!myCurrentEmail) return alert("Login first!");
    
    await sbClient.from('messages').insert([{ 
        sender_email: myCurrentEmail, 
        receiver_email: destination, 
        content: content 
    }]);

    document.getElementById('msgInput').value = "";
}

// 4. Realtime Listener
sbClient
    .channel('db-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;

        // Condition A: It's a Global Message
        if (msg.receiver_email === "global") {
            if (currentView === "global") appendMessageToScreen(msg.sender_email, msg.content);
            showNotification("Global Chat", msg.sender_email, msg.content);
        } 
        // Condition B: It's a Private Message for ME
        else if (msg.receiver_email === myCurrentEmail) {
            if (currentView === "private") appendMessageToScreen(msg.sender_email, msg.content);
            showNotification("Private Message", msg.sender_email, msg.content);
        }
        // Condition C: I sent it
        else if (msg.sender_email === myCurrentEmail && currentView === "private") {
            appendMessageToScreen("Me", msg.content);
        }
    })
    .subscribe();

function showNotification(type, sender, content) {
    if (Notification.permission === "granted" && document.visibilityState !== "visible") {
        new Notification(`${type} from ${sender}`, { body: content });
    }
}