function message() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications");
  } else if (Notification.permission === "granted") {
    // If permission is already granted, just show it
    new Notification("Hello!");
  } else if (Notification.permission !== "denied") {
    // Otherwise, ask for permission then show it
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("Hello!");
      }
    });
  }
}