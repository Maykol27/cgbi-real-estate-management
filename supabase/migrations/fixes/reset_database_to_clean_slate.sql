-- ==============================================================================
-- Script de Limpieza Completa (Base de Datos CGBI desde Cero)
-- ==============================================================================
-- ADVERTENCIA: Este script eliminará permanentemente todos los datos de pruebas.
-- Solo se conservarán las cuentas de los usuarios Administradores.

-- 1. Limpiar notificaciones, mensajes y tickets
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.ticket_messages CASCADE;
TRUNCATE TABLE public.tickets CASCADE;

-- 2. Limpiar documentos, pagos y visitas de asesoría
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.visits CASCADE;

-- 3. Limpiar solicitudes de aprobación financiera
TRUNCATE TABLE public.finance_requests CASCADE;

-- 4. Limpiar propiedades (inmuebles)
TRUNCATE TABLE public.properties CASCADE;

-- 5. Eliminar todos los archivos subidos al almacenamiento (Storage)
DELETE FROM storage.objects WHERE bucket_id = 'project_files';

-- 6. Eliminar usuarios de autenticación (excepto administradores)
-- Nota: Al eliminar el usuario de auth.users, se eliminará en cascada su perfil en public.profiles
DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT id FROM public.profiles 
  WHERE role IN ('Admin', 'Administrador')
);
