const url = "https://aftvgbuamodqkxrwhuho.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdHZnYnVhbW9kcWt4cndodWhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzOTAyNSwiZXhwIjoyMDg1MTE1MDI1fQ.H6Lr1DhY2hK5g3ljsuJEO2k-DITwsBQDUYXw-zzRpj4";

async function checkSchema() {
    console.log("Checking appeals table schema via REST API...");
    try {
        const response = await fetch(`${url}/rest/v1/appeals?select=*&limit=1`, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("REST API Error:", JSON.stringify(error, null, 2));
            return;
        }

        const data = await response.json();
        console.log("Successfully retrieved data.");
        if (data && data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("Table is empty. Attempting to check schema via OPTIONS...");
            const optionsResponse = await fetch(`${url}/rest/v1/appeals`, {
                method: "OPTIONS",
                headers: {
                    "apikey": key,
                    "Authorization": `Bearer ${key}`
                }
            });
            const optionsData = await optionsResponse.json();
            // The options response usually contains definitions
            console.log("Table structure (partial):", JSON.stringify(optionsData.definitions?.['appeals']?.properties || "Not found", null, 2));
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

checkSchema();
