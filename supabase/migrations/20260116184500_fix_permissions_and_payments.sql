-- Ensure Admins and Collaborators can key specific updates to profiles
-- Drop existing restrictive policies if necessary or add new permissive one with unique name

-- Policy to allow Admins/Collaborators to UPDATE financial_status on any profile
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

-- Ensure Admins/Collaborators can SELECT all payments
DROP POLICY IF EXISTS "Admins/Collabs full access" ON "public"."payments"; -- Drop if exists to replace/refine

CREATE POLICY "Enable select all payments for management"
ON "public"."payments"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles px
    WHERE px.id = auth.uid()
    AND px.role IN ('Admin', 'Administrador', 'Colaborador')
  )
);
