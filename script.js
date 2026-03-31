function message() {
  // Request permission
Notification.requestPermission().then(permission => {
  if (permission === "granted") {
    new Notification("Hello from the Website!", {
      body: "This is a desktop alert.",
      icon: "logo.png"
    });
  }
});
}
