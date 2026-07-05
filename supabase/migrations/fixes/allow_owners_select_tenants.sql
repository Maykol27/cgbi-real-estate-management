-- Permitir a los propietarios ver los perfiles de los arrendatarios asignados a sus inmuebles
-- Esto soluciona el problema de que aparezca "Sin Asignar" en la tarjeta de propiedad del propietario.

DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "Owners can view their tenants profiles" ON "public"."profiles";

CREATE POLICY "profiles_select_policy"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  -- 1. Los usuarios pueden ver su propio perfil
  id = auth.uid()
  OR
  -- 2. Los propietarios pueden ver los perfiles de los arrendatarios de sus propiedades
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
  OR
  -- 3. Los administradores y colaboradores pueden ver todos los perfiles
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Administrador', 'Colaborador')
);
