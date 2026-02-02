
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        // Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Verify Caller Identity & Role
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error("Missing Authorization header")
        }
        const token = authHeader.replace('Bearer ', '')

        // Decoding JWT manually to avoid getUser errors
        const [_header, payload, _signature] = token.split('.');
        if (!payload) throw new Error("Invalid Token format");

        // Decode payload
        // Polyfill for atob if not available (Deno has atob)
        const decodeBase64 = (str: string) => {
            // Handle URL safe base64
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            while (str.length % 4) str += '=';
            return atob(str);
        };

        const decodedPayload = JSON.parse(decodeBase64(payload));
        const callerId = decodedPayload.sub;

        if (!callerId) {
            console.error("No 'sub' in token payload");
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid Token Claims" }), { status: 401, headers: corsHeaders })
        }

        console.log("Caller ID from JWT:", callerId);

        // Check role in profiles table for reliability
        const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', callerId).single();

        if (profileError || !profile) {
            console.error("Profile fetch error:", profileError);
            return new Response(JSON.stringify({ error: "Profile not found or error", details: profileError }), { status: 403, headers: corsHeaders })
        }

        const callerRole = profile.role || ''; // decodedPayload.role is often 'authenticated', we need app role

        console.log("Caller Role Resolved:", callerRole);

        // Allow 'Admin', 'Administrador', 'Administrator' (case insensitive)
        const normalizedRole = String(callerRole).toLowerCase().trim();
        const isAdmin = ['admin', 'administrador', 'administrator'].includes(normalizedRole);

        if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403, headers: corsHeaders })
        }

        // 2. Process Action
        const { action, userId } = await req.json()


        if (!action) {
            throw new Error("Action is required (delete | reset_password)")
        }

        // --- DELETE USER ---
        if (action === 'delete') {
            if (!userId) throw new Error("userId is required for delete");

            // 0. Pre-delete: Attempt to remove Storage Objects
            try {
                // Remove avatar if exists (standard path pattern)
                const avatarPath = `${userId}`;
                await supabaseAdmin.storage.from('avatars').remove([avatarPath]);

                // Schema check reveals 'documents' has no owner column. Skipping document deletion.

            } catch (err) {
                console.warn("Storage cleanup warning (non-fatal):", err);
            }

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

            if (deleteError) {
                console.error("Delete User Error:", deleteError);
                throw new Error(`Failed to delete user: ${deleteError.message}`);
            }

            // 1. Delete Profile (Handled automatically via CASCADE constraint now)
            // const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);

            // 2. Return Success
            return new Response(
                JSON.stringify({ success: true, message: "User deleted successfully" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // ... rest of code ...
        if (action === 'reset_password') {
            if (!userId) throw new Error("userId is required for reset");
            const defaultPassword = "CGBI2026!";

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: defaultPassword }
            );

            if (updateError) throw updateError;

            return new Response(
                JSON.stringify({ success: true, message: `Password reset to ${defaultPassword}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
