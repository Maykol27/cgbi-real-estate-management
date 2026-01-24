-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view documents that are public ('Todos'), targeted to their role ('Inquilinos', 'Propietarios'), 
-- or specifically targeted to them (target = user_id)
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (
  target = 'Todos'
  OR 
  (target = 'Inquilinos' AND (select role from profiles where id = auth.uid()) = 'Inquilino')
  OR 
  (target = 'Propietarios' AND (select role from profiles where id = auth.uid()) IN ('Propietario', 'Owner'))
  OR
  target = auth.uid()::text
);

-- Policy: Allow admins/colaboradores to insert/update/delete documents
CREATE POLICY "Admins can manage documents"
ON documents
FOR ALL
USING (
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role IN ('Administrador', 'Admin', 'Colaborador')
  )
);
