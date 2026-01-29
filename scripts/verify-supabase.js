
const url = "https://aftvgbuamodqkxrwhuho.supabase.co/auth/v1/health";
console.log("Testing connection to:", url);

fetch(url)
    .then(res => {
        console.log("Status:", res.status);
        return res.json();
    })
    .then(data => {
        console.log("Response:", data);
    })
    .catch(err => {
        console.error("Fetch failed:", err.message);
    });
