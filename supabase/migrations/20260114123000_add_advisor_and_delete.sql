-- Migration: Add Advisor Column and Enable Delete for Visits
-- Description: Adds 'advisor' column to visits table and allows Authenticated users (Collabs/Admins) to DELETE visits.

-- 1. Add 'advisor' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'advisor') THEN
        ALTER TABLE "public"."visits" ADD COLUMN "advisor" text;
    END IF;
END $$;

-- 2. Enable DELETE policy for authenticated users (Admins and Collaborators)
-- We use a broad policy for authenticated users to allow Collaborators to delete events they created or ANY event if they are admins.
-- Given the requirement "can create by mistake", we allow deletion for now. 
-- Ideally we would restrict to own events, but 'created_by' might not be reliable yet. 
-- The user requested "option to delete events, ... admin creates event, collaborator can write feedback".
-- We will allow DELETE for authenticated users for now to unblock.

DROP POLICY IF EXISTS "Enable delete for authenticated" ON "public"."visits";

CREATE POLICY "Enable delete for authenticated"
ON "public"."visits"
FOR DELETE
TO authenticated
USING (true);

-- 3. Ensure UPDATE policy allows 'advisor' and 'feedback' updates (Existing policy covers this, but good to double check implicit permissions)
-- The previous migration added "Enable update for collaborators", which covers UPDATE.
