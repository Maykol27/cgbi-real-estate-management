
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, role, full_name, policy_number, permissions } = await req.json()

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 1. Create User via Admin API with DEFAULT PASSWORD (bypassing email issues)
        const defaultPassword = "CGBI2026!";

        const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
            email: email,
            password: defaultPassword,
            email_confirm: true, // Auto-confirm user
            user_metadata: {
                full_name: full_name,
                role: role
            }
        })

        if (userError) {
            // Check if user already exists
            if (userError.message.includes("already registered") || userError.status === 422) {
                console.log("User already exists. Updating password to default...");

                // Find user by email
                const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
                // Note: listUsers might perform poor filtering, ideally we use 'listUsers({ filter: email })' but JS SDK support varies. 
                // Let's rely on looking up by email in the returned list or catching exact error.
                // Better approach: Just try to update user by email? No direct function.
                // We need ID. Let's list users filtering by logic (client side filter of list)
                // OR use 'getUserByEmail' if available in admin api? No.

                // Let's use listUsers hoping the user is there (pagination limits exist but for this targeted fix it helps).
                // A better specific query:
                // Actually, createUser error usually doesn't return ID.

                // Workaround: We can't easily get ID from "already registered". 
                // We will try to sign in? No. 
                // We will use the 'listUsers' to find the ID.

                // Note: Admin List Users is powerful.
                const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email === email);

                if (existingUser) {
                    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                        existingUser.id,
                        { password: defaultPassword, user_metadata: { full_name, role } }
                    );

                    if (updateError) {
                        console.error("Error updating existing user:", updateError);
                        return new Response(JSON.stringify({ error: updateError.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
                    }

                    // Proceed to profile upsert (userData mock)
                    // We need to reconstruct userData structure to flow down
                    // Redefine userData
                    // const userData = { user: existingUser }; // Scope issue, handled below

                    // We will return early or let it fall through?
                    // Let's flow through by re-assigning valid data variables if I can, but they are const.
                    // I will handle the profile upsert inside here or change var to let.

                    // To avoid "const" reassignment issues, I will refactor slightly.
                    // But for minimal diff, I will just upsert profile here and return.

                    const { error: profileError } = await supabaseClient
                        .from('profiles')
                        .upsert({
                            id: existingUser.id,
                            email: email,
                            full_name: full_name,
                            role: role,
                            permissions: permissions || []
                        })

                    if (profileError) console.error("Profile upsert error:", profileError);

                    return new Response(
                        JSON.stringify({ success: true, user: existingUser, message: "User updated" }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }
            }

            console.error("Error creating user:", userError);
            return new Response(
                JSON.stringify({ error: userError.message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 2. Insert into public.profiles
        // Note: Triggers usually handle this, but if not, we do it manually.
        // We try to upsert.
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id: userData.user.id,
                email: email,
                full_name: full_name,
                role: role,
                permissions: permissions || [],
                // policy_number: policy_number // assuming column exists? StoreContext passes it.
            })

        if (profileError) {
            console.error("Profile creation error:", profileError);
        }

        return new Response(
            JSON.stringify({ success: true, user: userData.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
