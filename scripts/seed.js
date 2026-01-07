
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqfsekdvzdklhhcqifuk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZnNla2R2emRrbGhoY3FpZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1ODIsImV4cCI6MjA4MzIxNTU4Mn0.QWoxJOtjhJcKC7QBkjAof0D7kXFmiGlMjoHD-ZQD0PI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
  { email: 'maykol.sicard27@gmail.com', password: 'pruebas2026cgbi', role: 'Admin', name: 'Maykol Sicard', permissions: ['all'] },
  { email: 'carlos.ruiz@cgbi.com', password: 'password123', role: 'Propietario', name: 'Carlos Ruiz' },
  { email: 'juan.perez@cgbi.com', password: 'password123', role: 'Inquilino', name: 'Juan Pérez' },
  { email: 'pedro.colab@cgbi.com', password: 'password123', role: 'Colaborador', name: 'Pedro Colaborador', permissions: ['tickets', 'calendar', 'documentos', 'propiedades'] }
];

const properties = [
  { name: "Residencial Las Palmas #402", address: "Av. Principal 123", type: "Apartamento", status: "Ocupado", listing_type: 'Arriendo', rent: "5000000", sq_meters: 85, rooms: 2, bathrooms: 2, parking: 1, description: "Apartamento moderno con vista al parque." },
  { name: "Torre Empresarial B #505", address: "Centro Financiero", type: "Oficina", status: "Disponible", listing_type: 'Arriendo', rent: "8500000", sq_meters: 120, rooms: 4, bathrooms: 1, parking: 2, description: "Oficina corporativa lista para ocupar." },
  { name: "Casa de Campo Los Pinos", address: "Km 40 Vía al Mar", type: "Casa", status: "Mantenimiento", listing_type: 'Venta', rent: "12500000", sq_meters: 350, rooms: 5, bathrooms: 4, parking: 3, description: "Casa vacacional con piscina y jardines." }
];

async function seed() {
  console.log("🌱 Starting seed...");

  let adminId = null;
  let ownerId = null;
  let tenantId = null;

  // 1. Create Users
  for (const u of users) {
    console.log(`Creating user: ${u.email}...`);
    
    // Sign Up (creates Auth User)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });

    if (authError) {
      console.log(`⚠️ Auth error for ${u.email}: ${authError.message} (User might already exist)`);
      // If user exists, we try to sign in to get the ID
      if (authError.message.includes("already registered")) {
         const { data: loginData } = await supabase.auth.signInWithPassword({ email: u.email, password: u.password });
         if (loginData.session) {
            authData.user = loginData.session.user;
            authData.session = loginData.session;
         }
      }
    }

    if (authData?.user) {
      console.log(`✅ Auth created for ${u.email}: ${authData.user.id}`);
      
      if (u.role === 'Admin') adminId = authData.user.id;
      if (u.role === 'Propietario') ownerId = authData.user.id;
      if (u.role === 'Inquilino') tenantId = authData.user.id;

      // Insert Profile (Matches Schema)
      // Note: RLS allows "Users can insert their own profile"
      // We are essentially logged in as this user due to signUp/signIn returning a session in the client usually?
      // Actually, createClient without options persists session? 
      // Let's explicitly use the session to ensure RLS passes if needed, or just relying on the fact that signUp *usually* signs you in.
      
      // Checking if profile exists first
      const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      
      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: u.email,
          full_name: u.name,
          role: u.role,
          permissions: u.permissions || []
        });
        
        if (profileError) console.error(`❌ Profile error for ${u.name}:`, profileError);
        else console.log(`   Profile created.`);
      } else {
        console.log(`   Profile already exists.`);
      }
    }
    
    // Sign out to switch users
    await supabase.auth.signOut();
  }

  // 2. Insert Properties (Need Admin Access)
  // Re-login as Admin
  if (adminId) {
      console.log("🔑 Logging in as Admin to insert data...");
      const { error: loginError } = await supabase.auth.signInWithPassword({
          email: 'maykol.sicard27@gmail.com',
          password: 'pruebas2026cgbi'
      });

      if (!loginError && ownerId) {
          // Insert properties linked to owner
          console.log("🏠 Inserting properties...");
          for (const p of properties) {
              const { error: propError } = await supabase.from('properties').insert({
                  ...p,
                  owner_id: ownerId
              });
              if(propError) console.error("Error inserting property:", propError);
          }
          console.log("✅ Properties inserted.");

          // 3. Create a Ticket
          // Let's create a ticket from the Tenant
          await supabase.auth.signOut();
          
          console.log("🎫 Creating mock ticket as Tenant...");
          await supabase.auth.signInWithPassword({ email: 'juan.perez@cgbi.com', password: 'password123' });
          
          // Get a property ID first (any)
          const { data: props } = await supabase.from('properties').select('id').limit(1);
          if (props && props.length > 0) {
              const { error: ticketError } = await supabase.from('tickets').insert({
                  title: "Fuga en el baño",
                  description: "Goteo constante en el lavabo principal.",
                  status: "Pendiente",
                  priority: "Alta",
                  requester_id: tenantId,
                  property_id: props[0].id
              });
              if(ticketError) console.error("Ticket error:", ticketError);
              else console.log("✅ Ticket created.");
          }

      }
  }

  console.log("✨ Seed complete.");
}

seed();
