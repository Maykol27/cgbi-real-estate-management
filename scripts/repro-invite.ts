
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqfsekdvzdklhhcqifuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZnNla2R2emRrbGhoY3FpZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1ODIsImV4cCI6MjA4MzIxNTU4Mn0.QWoxJOtjhJcKC7QBkjAof0D7kXFmiGlMjoHD-ZQD0PI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const email = 'maykol.test.repro@sikaiconsulting.com'; // Use a TEST email to avoid conflict if possible, or use the problematic one?
    // User said "maykol.sicard@sikaiconsulting.com". Let's use that one but carefully. 
    // Wait, if I use the real email, I might mess up his manual setup. 
    // But verify functionality first with a UNIQUE email.
    const uniqueEmail = `test.existing.user@sikaiconsulting.com`;
    const password = 'CGBI2026!';

    console.log(`------ TEST: Creating user ${uniqueEmail} ------`);

    try {
        // 1. Invoke invite-user
        console.log("Invoking invite-user...");
        const { data, error } = await supabase.functions.invoke('invite-user', {
            body: {
                email: uniqueEmail,
                role: 'owner',
                full_name: 'Test Repro User',
                permissions: []
            }
        });

        if (error) {
            console.error("Invite-user invocation failed:", error);
            // If it fails, we try to create it anyway?
        } else {
            console.log("Invite-user response:", data);
        }

        // 2. Try Login
        console.log("Attempting Login...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: uniqueEmail,
            password: password
        });

        if (loginError) {
            console.error("LOGIN FAILED:", loginError.message);
            // Check if "Email not confirmed"
            if (loginError.message.includes("Email not confirmed")) {
                console.error("!!! CRITICAL: Email was NOT confirmed automatically !!!");
            }
        } else {
            console.log("LOGIN SUCCESS! User ID:", loginData.user.id);
            console.log("Email Confirmed At:", loginData.user.email_confirmed_at);
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

main();
