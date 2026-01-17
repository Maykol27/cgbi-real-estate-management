
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
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !caller) {
            console.error("Manage-Users Auth Error:", authError);
            return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), { status: 401, headers: corsHeaders })
        }

        // Check role in profiles table for reliability
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single();
        const callerRole = profile?.role || caller.user_metadata?.role || '';

        console.log("Caller Role Resolved:", callerRole); // Debug log

        // Allow 'Admin', 'Administrador', 'Administrator' (case insensitive check done below)
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

                // Remove ANY other known file references if we can query them from 'documents' table before deleting
                // Query documents table for file_url or similar
                const { data: userDocs } = await supabaseAdmin.from('documents').select('file_url').eq('uploaded_by', userId);
                if (userDocs && userDocs.length > 0) {
                    // Parse paths from URLs and delete
                    // This depends on URL format. Implementation skipped to avoid breakage if format varies.
                    // But we should clean up if possible.
                }

            } catch (err) {
                console.warn("Storage cleanup warning (non-fatal):", err);
            }

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

            if (deleteError) {
                console.error("Delete User Error:", deleteError);
                throw new Error(`Failed to delete user: ${deleteError.message}`);
            }

            // 1. Delete Profile (if cascade didn't catch it)
            const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);

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
