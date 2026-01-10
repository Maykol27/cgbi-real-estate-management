-- ⚠️ PRECAUCIÓN: SE BORRARÁN TODOS MENOS "maykol.sicard27@gmail.com" ⚠️
-- Instrucciones:
-- 1. Ve a tu Dashboard de Supabase (https://supabase.com/dashboard).
-- 2. Entra a la sección "SQL Editor".
-- 3. Pega y ejecuta el siguiente código.

DELETE FROM auth.users 
WHERE email NOT IN ('maykol.sicard27@gmail.com');

-- Confirmación visual (ver quién quedó vivo)
SELECT email, role, created_at FROM auth.users;
