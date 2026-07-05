-- ==============================================================================
-- Script de Limpieza de Datos (Conservando Usuarios)
-- ==============================================================================
-- Este script eliminará permanentemente todos los inmuebles, tickets, 
-- documentos, pagos, visitas y notificaciones para limpiar los datos de prueba,
-- conservando intactos todos los perfiles de usuario.

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
