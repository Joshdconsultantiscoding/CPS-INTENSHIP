
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log('NEXT_PUBLIC_SUPABASE_URL:', envConfig.NEXT_PUBLIC_SUPABASE_URL || 'MISSING');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY starts with:', envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) : 'MISSING');
} else {
    console.log('.env.local not found');
}
