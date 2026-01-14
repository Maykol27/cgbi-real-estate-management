-- Migration: Fix Collaborator Permissions for Visits
-- Description: Allow users with role 'Colaborador' to update visits (feedback, status).

-- 1. Helper function to check role (if not already exists, strictly defined)
CREATE OR REPLACE FUNCTION public.is_collaborator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'Colaborador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies for Visits
-- Drop existing specific policy if it conflicts or just add the new one.
-- We'll add a specific policy for updates.

create policy "Enable update for collaborators"
on "public"."visits"
for update
to authenticated
using (
  (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE (profiles.role = 'Colaborador'::text) ))
)
with check (
  (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE (profiles.role = 'Colaborador'::text) ))
);
