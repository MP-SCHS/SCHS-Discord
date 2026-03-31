// Initialization
const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 1. Request Notification Permission
function enableNotifications() {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("Notifications enabled!");
            document.getElementById('status').innerText = "Ready to receive messages.";
        }
    });
}

// 2. Send Message to Database
async function send() {
    const email = document.getElementById('emailInput').value;
    const content = document.getElementById('msgInput').value;

    if (!email || !content) return alert("Fill in both boxes!");

    const { error } = await supabase
        .from('messages')
        .insert([{ sender_email: email, content: content }]);

    if (error) {
        console.error(error);
        alert("Error: Make sure your table 'messages' exists!");
    } else {
        document.getElementById('msgInput').value = ""; // Clear input
    }
}

// 3. LISTEN for new messages (Realtime)
supabase
    .channel('any') // Name the channel anything
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const data = payload.new;
        
        // Only show notification if permission is granted
        if (Notification.permission === "granted") {
            new Notification(`New message from ${data.sender_email}`, {
                body: data.content
            });
        }
    })
    .subscribe();