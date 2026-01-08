INSERT INTO public.properties (name, address, type, status, rent, rooms, area, owner_id)
VALUES 
('Edificio Central', 'Av. Principal 123', 'Comercial', 'Disponible', 5000000, 5, 120, (SELECT id FROM profiles WHERE role = 'Propietario' LIMIT 1));

INSERT INTO public.visits (property_id, visitor_name, date, status, feedback)
VALUES 
((SELECT id FROM properties LIMIT 1), 'Juan Perez Visitor', NOW() + INTERVAL '1 day', 'Programada', null);
