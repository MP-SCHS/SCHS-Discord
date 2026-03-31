const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const sbClient = supabase.createClient(supabaseUrl, supabaseKey);

let myCurrentEmail = "";

// 1. "Login" and Enable Notifications
function enableNotifications() {
    const emailInput = document.getElementById('myEmail').value;
    if (!emailInput) return alert("Please enter your email first!");
    
    myCurrentEmail = emailInput.toLowerCase().trim();
    
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert(`Logged in as ${myCurrentEmail}. Notifications active!`);
            loadHistory(); // Load only messages for me
        }
    });
}

// 2. Load History (Only messages sent TO me or FROM me)
async function loadHistory() {
    if (!myCurrentEmail) return;

    const { data, error } = await sbClient
        .from('messages')
        .select('*')
        .or(`receiver_email.eq.${myCurrentEmail},sender_email.eq.${myCurrentEmail}`)
        .order('id', { ascending: true });

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = ""; // Clear "Loading..." text

    if (data) {
        data.forEach(msg => appendMessageToScreen(msg.sender_email, msg.content));
    }
}

function appendMessageToScreen(sender, content) {
    const chatBox = document.getElementById('chat-box');
    const msgElement = document.createElement('p');
    msgElement.innerHTML = `<strong>${sender}:</strong> ${content}`;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. Send Message
async function send() {
    const toEmail = document.getElementById('toEmail').value.toLowerCase().trim();
    const content = document.getElementById('msgInput').value;

    if (!myCurrentEmail) return alert("You must 'Login' at the top first!");
    if (!toEmail || !content) return alert("Fill in recipient and message!");

    const { error } = await sbClient
        .from('messages')
        .insert([{ 
            sender_email: myCurrentEmail, 
            receiver_email: toEmail, 
            content: content 
        }]);

    if (error) alert("Error: " + error.message);
    else document.getElementById('msgInput').value = "";
}

// 4. Realtime Listener (The Filter)
sbClient
    .channel('db-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new;

        // ONLY show notification if it was sent to ME
        if (newMessage.receiver_email === myCurrentEmail) {
            appendMessageToScreen(newMessage.sender_email, newMessage.content);
            
            if (Notification.permission === "granted" && document.visibilityState !== "visible") {
                new Notification(`Private Message from ${newMessage.sender_email}`, {
                    body: newMessage.content
                });
            }
        } 
        // Also show on screen if I was the sender (so I see my own sent messages)
        else if (newMessage.sender_email === myCurrentEmail) {
            appendMessageToScreen("Me", newMessage.content);
        }
    })
    .subscribe();