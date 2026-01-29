
fetch("https://www.google.com")
    .then(res => console.log("Google Status:", res.status))
    .catch(err => console.error("Google Fetch failed:", err.message));
