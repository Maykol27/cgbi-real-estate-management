
import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eqfsekdvzdklhhcqifuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZnNla2R2emRrbGhoY3FpZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1ODIsImV4cCI6MjA4MzIxNTU4Mn0.QWoxJOtjhJcKC7QBkjAof0D7kXFmiGlMjoHD-ZQD0PI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const email = 'comercial@cgbi.com.co';
    const password = 'CGBI2026!';

    console.log(`------ TEST: Logging in as ${email} ------`);

    try {
        // 1. Login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            console.error("LOGIN FAILED:", loginError.message);
            return;
        }

        console.log("LOGIN SUCCESS! Token:", loginData.session.access_token.substring(0, 20) + "...");

        // 2. Invoke manage-users (Try a dummy action to test auth)
        // We won't delete, just pass a dummy action to see if it passes auth check
        console.log("Invoking manage-users...");
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'check_auth', // Invalid action but should pass auth check first
                userId: 'dummy'
            },
            headers: {
                Authorization: `Bearer ${loginData.session.access_token}`
            }
        });

        if (error) {
            console.error("Manage-users invocation failed:", error);
            if (error instanceof FunctionsHttpError) {
                console.log("Error details:", await error.context.json());
            }
        } else {
            console.log("Manage-users response:", data);
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

main();
