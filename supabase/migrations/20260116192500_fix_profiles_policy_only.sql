-- Re-applying logic for Financial Status Update Policy only (without storage alter)
-- This ensures Admins/Collaborators can update status.

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
