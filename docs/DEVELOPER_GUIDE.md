# Guía de Arquitectura y Desarrollo - CGBI Real Estate

**Versión:** 2.0
**Autor:** Equipo de Desarrollo (Antigravity)
**Tecnología**: React, TypeScript, Supabase, Tailwind.

Este documento técnico explica la estructura interna, decisiones de diseño y procedimientos de mantenimiento para desarrolladores.

---

## 1. Arquitectura del Sistema

La aplicación sigue una arquitectura **Cliente-Servidor (Serverless)**.

- **Frontend**: Single Page Application (SPA) construida con Vite y React 18.
- **Estado**: Gestión centralizada mediante React Context (`StoreContext`). No se utiliza Redux para mantener la simplicidad y reducir el "boilerplate".
- **Backend**: Supabase (Backend-as-a-Service). Provee Base de Datos PostgreSQL, Autenticación y Almacenamiento.
- **Estilos**: Tailwind CSS para diseño atómico y rápido.

### Diagrama de Flujo de Datos
`Componente UI` -> `useStore()` -> `StoreContext` -> `supabaseClient` -> `PostgreSQL (Nube)`

---

## 2. Estructura de Carpetas

```
/root
├── /assets          # Imágenes estáticas y recursos públicos
├── /components      # Componentes de presentación (UI pura)
│   ├── Calendar.tsx # Componente complejo de calendario
│   ├── Layout.tsx   # Sidebar, Header y estructura base
│   └── Modal.tsx    # Ventanas emergentes reutilizables
├── /context         # Lógica de Negocio (Core)
│   ├── StoreContext.tsx # ESTADO GLOBAL: Aquí vive toda la lógica de datos
│   └── ToastContext.tsx # Sistema de notificaciones emergentes
├── /docs            # Documentación del proyecto
├── /lib             # Configuración de servicios externos
│   └── supabaseClient.ts # Inicialización del cliente Supabase
├── /pages           # Vistas (Screens) agrupadas por Rol
│   ├── /admin       # Dashboard, Gestión Usuarios, Calendario Admin
│   ├── /owner       # Vista restringida para Propietarios
│   └── /tenant      # Vista restringida para Inquilinos
├── /utils           # Helpers (Fechas, Moneda, Validaciones)
├── App.tsx          # Router principal (Manejo de rutas y protección)
└── types.ts         # Definiciones de Interfaces TypeScript (legacy)
```

---

## 3. Modelo de Datos (Schema)

La aplicación interactúa con las siguientes tablas en Supabase.
*Nota: Los IDs son UUIDs generados automáticamente por la base de datos.*

### `profiles` (Usuarios)
- `id` (uuid, PK): Vinculado a `auth.users`.
- `full_name` (text): Nombre completo.
- `role` (text): 'Admin', 'Propietario', 'Inquilino', 'Colaborador'.
- `email` (text): Correo electrónico.
- `permissions` (jsonb): Lista de permisos especiales.

### `properties` (Inmuebles)
- `id` (uuid, PK)
- `name` (text): Nombre comercial (ej: "Apto 402").
- `address` (text): Dirección física.
- `status` (text): 'Disponible', 'Ocupado', 'Mantenimiento'.
- `owner_id` (uuid, FK): Referencia a `profiles.id`.

### `tickets` (Mesa de Ayuda)
- `id` (uuid, PK)
- `title` (text): Asunto.
- `description` (text).
- `priority` (text): 'Alta', 'Media', 'Baja'.
- `status` (text): 'Pendiente', 'En Progreso', 'Cerrado'.
- `requester_id` (uuid, FK): Quien creó el ticket.
- `property_id` (uuid, FK): Inmueble relacionado.
- `messages` (jsonb): Array de objetos chat `{sender, text, time}`.

### `visits` (Calendario)
- `id` (uuid, PK)
- `date` (timestamp): Fecha y hora de la visita.
- `property_id` (uuid, FK).
- `visitor_name` (text): Nombre del cliente potencial.
- `status` (text).

### `finance_requests` (Solicitudes de Propietario)
- `id` (uuid, PK).
- `amount` (numeric): Costo estimado.
- `status`: 'Pendiente', 'Aprobado', 'Rechazado'.

### `payments` (Pagos de Inquilinos)
- `id` (uuid, PK).
- `amount` (numeric).
- `period` (text): Ej "Enero 2026".
- `status`: 'Pagado', 'Pendiente'.
- `tenant_id` (uuid, FK).

---

## 4. Lógica Clave explicada

### Autenticación y RLS (Row Level Security)
El sistema utiliza **Supabase Auth**. Sin embargo, para desarrollo local y pruebas rápidas, existe una función `login` híbrida en `StoreContext`:
1. Intenta `signInWithPassword` real contra Supabase (Producción).
2. Si falla o se usa la clave maestra de pruebas (`pruebas2026cgbi`), realiza una consulta directa a `profiles` (Modo Dev).
   - *Advertencia*: El modo Dev puede fallar al insertar datos si las políticas RLS de la base de datos son estrictas ("Authenticated only"). Se recomienda usar siempre usuarios reales creados en Auth.

### Manejo de Errores (Semáforo)
Todas las funciones asíncronas (`addTicket`, `addVisit`) retornan un objeto estándar:
```typescript
Promise<{ success: boolean; message: string }>
```
Esto permite a la UI decidir si cierra el modal (success) o muestra el error exacto (failure) sin romper el flujo.

---

## 5. Guía de Despliegue (Deployment)

Para poner en producción:

1. **Variables de Entorno**: Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel del proveedor (Vercel/Netlify).
2. **Build Command**: `npm run build`.
3. **Output Directory**: `dist`.

El enrutamiento es manejado por el cliente, por lo que se debe configurar el servidor para redirigir todas las rutas (`/*`) a `index.html` (SPA Fallback).

---

## 6. Solución de Problemas Comunes

- **Pantalla Blanca**: Generalmente causada por errores de sintaxis en `StoreContext` que rompen el Provider. Revisar consola (F12).
- **Error "RLS Policy Violation"**: El usuario no está logueado correctamente en Supabase. Cerrar sesión y volver a entrar con credenciales reales.
- **Tipos TypeScript**: Si ves errores de tipos, revisa `StoreContext.tsx` sección "Interfaces". `types.ts` es un archivo heredado que se está deprecando gradualmente.
