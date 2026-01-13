
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

        // 1. Create User via Admin API (sends invite email by default if email_confirm is on)
        const { data: userData, error: userError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: full_name,
                role: role
            }
        })

        if (userError) {
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
