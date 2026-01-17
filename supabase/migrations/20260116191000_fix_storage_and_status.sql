-- 1. Fix Storage Objects Blocking Deletion
-- We cannot easily ALTER storage.objects FK directly usually, but we can try dropping/recreating it or creating a trigger.
-- However, standard practice is to delete objects BEFORE deleting the user. 
-- BUT, if we want to fix the "Edge Function returned non-2xx" fast, we should handle this in the Edge Function code to delete storage objects first.
-- OR we can try to ALTER the constraint if permissions allow.

-- Let's try to ALTER the constraint on storage.objects first as it's cleaner.
ALTER TABLE "storage"."objects"
DROP CONSTRAINT "objects_owner_fkey";

ALTER TABLE "storage"."objects"
ADD CONSTRAINT "objects_owner_fkey"
FOREIGN KEY ("owner")
REFERENCES "auth"."users" ("id")
ON DELETE CASCADE;

-- 2. Ensure Financial Status Update
-- Re-applying/Ensuring the policy exists and is correct.
DROP POLICY IF EXISTS "Admins/Collabs can update financial status" ON "public"."profiles";

CREATE POLICY "Admins/Collabs can update financial status"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles px
    WHERE px.id = auth.uid()
    AND px.role IN ('Admin', 'Administrador', 'Colaborador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles px
    WHERE px.id = auth.uid()
    AND px.role IN ('Admin', 'Administrador', 'Colaborador')
  )
);
