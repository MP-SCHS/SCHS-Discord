// Use a unique name to avoid the "already declared" error
const supabaseUrl = 'https://tzdmppqaeusuvygnnctw.supabase.co';
const supabaseKey = 'sb_publishable_tvNY-Y2BTv2kMkr96dDe7g_HWr_g9Af';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase loaded and script running!");

// 1. Request Notification Permission
function enableNotifications() {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("Notifications enabled!");
        } else {
            alert("Notification permission: " + permission);
        }
    });
}

// 2. Send Message to Database
async function send() {
    const email = document.getElementById('emailInput').value;
    const content = document.getElementById('msgInput').value;

    console.log("Trying to send...", { email, content });

    const { error } = await supabaseClient
        .from('messages')
        .insert([{ sender_email: email, content: content }]);

    if (error) {
        console.error("Insert Error:", error.message);
        alert("Error: " + error.message);
    } else {
        console.log("Sent successfully!");
        document.getElementById('msgInput').value = ""; 
    }
}

// 3. LISTEN for new messages
supabaseClient
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        console.log("New message received!", payload.new);
        if (Notification.permission === "granted") {
            new Notification(`From: ${payload.new.sender_email}`, {
                body: payload.new.content
            });
        }
    })
    .subscribe();