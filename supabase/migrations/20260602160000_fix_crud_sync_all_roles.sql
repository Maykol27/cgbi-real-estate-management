-- ============================================================
-- Migration: Fix CRUD Sync Issues (2026-06-02)
-- Fixes: Ticket RLS for Collaborators, Visit advisor column,
--        Finance requests attachment_url, Documents target_user_id
--        Notifications for assigned tickets and visits
-- ============================================================

-- ============================================================
-- 1. TICKETS: Add missing columns and fix RLS
-- ============================================================

-- Ensure assigned_to column exists with proper FK
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Drop old Colaborador ticket policies if they exist
DROP POLICY IF EXISTS "Colaboradores ven sus tickets asignados" ON tickets;
DROP POLICY IF EXISTS "collaborators_assigned_tickets" ON tickets;

-- ✅ FIX: Policy para que Colaborador vea tickets donde assigned_to = su UUID
CREATE POLICY "collaborators_see_assigned_tickets"
  ON tickets FOR SELECT
  USING (
    -- Admins ven todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador'))
    OR
    -- Colaboradores ven los asignados a ellos
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Colaborador')
      AND assigned_to = auth.uid()
    )
    OR
    -- Propietarios/Inquilinos ven los que crearon
    requester_id = auth.uid()
  );

-- ✅ Colaboradores pueden actualizar el estado de sus tickets asignados
DROP POLICY IF EXISTS "Colaboradores actualizan tickets asignados" ON tickets;
CREATE POLICY "collaborators_update_assigned_tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador'))
    OR assigned_to = auth.uid()
  );

-- ✅ INSERT: Admins, Colaboradores y clientes pueden crear tickets
DROP POLICY IF EXISTS "authenticated_create_ticket" ON tickets;
CREATE POLICY "authenticated_create_ticket"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. VISITS: Ensure advisor column exists, add RLS
-- ============================================================

-- Ensure advisor column exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS advisor TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Drop old policies
DROP POLICY IF EXISTS "Admin sees all visits" ON visits;
DROP POLICY IF EXISTS "Collaborators see all visits" ON visits;
DROP POLICY IF EXISTS "visits_select_policy" ON visits;

-- ✅ FIX: Colaboradores ven SOLO sus visitas (donde son asignados como advisor)
CREATE POLICY "visits_select_policy"
  ON visits FOR SELECT
  USING (
    -- Admins ven todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador'))
    OR
    -- Colaboradores ven donde su nombre es el advisor
    (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'Colaborador')
      AND advisor = (SELECT full_name FROM profiles WHERE id = auth.uid())
    )
    OR
    -- Propietarios ven visitas de sus propiedades
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
  );

-- ✅ INSERT de visitas
DROP POLICY IF EXISTS "authenticated_insert_visits" ON visits;
CREATE POLICY "authenticated_insert_visits"
  ON visits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ✅ UPDATE de visitas
DROP POLICY IF EXISTS "admin_update_visits" ON visits;
CREATE POLICY "admin_update_visits"
  ON visits FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador', 'Colaborador'))
  );

-- ============================================================
-- 3. FINANCE_REQUESTS: Add attachment_url column
-- ============================================================

ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Drop old policies
DROP POLICY IF EXISTS "finance_requests_select" ON finance_requests;

-- ✅ FIX: Propietarios ven solicitudes de SUS propiedades, Admins ven todo
CREATE POLICY "finance_requests_select"
  ON finance_requests FOR SELECT
  USING (
    -- Admins/Colaboradores ven todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador', 'Colaborador'))
    OR
    -- Propietarios ven solicitudes de sus propiedades
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR
    -- Quienes crearon la solicitud
    requester_id = auth.uid()
  );

-- ============================================================
-- 4. DOCUMENTS: Fix target_user_id column and RLS
-- ============================================================

-- Ensure target_user_id column exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Copy url to file_url for backward compatibility
UPDATE documents SET file_url = url WHERE file_url IS NULL AND url IS NOT NULL;

-- Drop old policies
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "Propietario ve sus documentos" ON documents;

-- ✅ FIX: Propietarios ven documentos generales + los específicamente asignados a ellos
CREATE POLICY "documents_select"
  ON documents FOR SELECT
  USING (
    -- Admins/Colaboradores ven todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Administrador', 'Colaborador'))
    OR
    -- Documentos generales (target = 'Todos', 'Propietarios', etc.)
    target IN ('Todos', 'Propietarios', 'All', 'General (Todos)', 'Inquilinos')
    OR
    -- Documentos dirigidos específicamente a este usuario
    target_user_id = auth.uid()
    OR
    -- Quien subió el documento
    created_by = auth.uid()
  );

-- ============================================================
-- 5. NOTIFICATIONS: Fix RLS for targeted notifications
-- ============================================================

DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users mark own notifications read" ON notifications;
CREATE POLICY "Users mark own notifications read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 6. TRIGGER: Notify specifically assigned collaborator on ticket creation
-- ============================================================

CREATE OR REPLACE FUNCTION handle_ticket_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the specifically assigned collaborator
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
    VALUES (
      NEW.assigned_to,
      '🎫 Ticket Asignado',
      'Se te ha asignado un nuevo ticket: ' || NEW.title,
      'info',
      false,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Notify admins when a non-admin creates a ticket
  IF NEW.requester_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
    SELECT
      p.id,
      '🎫 Nuevo Ticket Recibido',
      'Se ha creado un nuevo ticket: ' || NEW.title,
      'info',
      false,
      NOW()
    FROM profiles p
    WHERE p.role IN ('Admin', 'Administrador')
      AND p.id != NEW.requester_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and recreate
DROP TRIGGER IF EXISTS on_ticket_created ON tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION handle_ticket_assignment_notification();

-- ============================================================
-- Done!
-- ============================================================
