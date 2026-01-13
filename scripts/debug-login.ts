
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqfsekdvzdklhhcqifuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZnNla2R2emRrbGhoY3FpZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1ODIsImV4cCI6MjA4MzIxNTU4Mn0.QWoxJOtjhJcKC7QBkjAof0D7kXFmiGlMjoHD-ZQD0PI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = "maykol.sicard@sikaiconsulting.com";
    const password = "CGBI2026!";

    console.log(`Attempting login for: ${email}`);
    console.log(`Password: ${password}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("LOGIN FAILED:");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        console.error("Name:", error.name);
    } else {
        console.log("LOGIN SUCCESSFUL!");
        console.log("User ID:", data.user.id);
        console.log("Email:", data.user.email);
    }
}

testLogin();
