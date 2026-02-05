export const config = {
    adminEmail: (process.env.ADMIN_EMAIL || "agbojoshua2005@gmail.com").toLowerCase(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    isProduction: process.env.NODE_ENV === "production",
};

export function validateConfig() {
    const missing = [];
    if (!config.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!config.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
}
