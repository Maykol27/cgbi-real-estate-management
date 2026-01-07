# Manual de Pruebas de Calidad (QA) - CGBI Real Estate

Este documento establece el protocolo exhaustivo de pruebas para validar la integridad, seguridad y funcionalidad de la aplicación CGBI.

**Versión del Documento:** 2.0
**Alcance:** Módulos de Administrador, Propietario, Inquilino, Colaborador y Base de Datos.

---

## 1. Protocolo de Acceso y Seguridad (Login)

### Caso 1.1: Inicio de Sesión de Administrador
- **Pasos**:
  1. Navegar a la página de inicio.
  2. Ingresar un email con rol de administrador (ej: admin@cgbi.com).
  3. Ingresar contraseña válida.
  4. Clic en "Ingresar".
- **Resultado Esperado**:
  - Redirección automática a `/admin`.
  - El menú lateral muestra opciones de "Usuarios", "Propiedades", "Finanzas".
  - Mensaje Toast: "Bienvenido, [Nombre Admin]".

### Caso 1.2: Inicio de Sesión de Inquilino
- **Pasos**:
  1. Ingresar email registrado como inquilino.
  2. Clic en "Ingresar".
- **Resultado Esperado**:
  - Redirección automática a `/tenant`.
  - NO debe ver opciones de configuración o gestión de usuarios.
  - El dashboard muestra "Próximo Pago".

### Caso 1.3: Manejo de Errores de Credenciales
- **Pasos**:
  1. Ingresar un email no registrado o contraseña incorrecta.
- **Resultado Esperado**:
  - El sistema NO redirige.
  - Aparece notificación roja: "Credenciales inválidas" o "Usuario no encontrado".
  - El formulario no se limpia automáticamente (para permitir corrección rápida).

### Caso 1.4: Persistencia de Sesión
- **Pasos**:
  1. Iniciar sesión.
  2. Recargar la página (F5) o cerrar y abrir el navegador.
- **Resultado Esperado**:
  - El usuario permanece logueado en la pantalla correcta sin necesidad de reingresar datos.

---

## 2. Módulo de Administración

### Caso 2.1: Gestión de Propiedades (CRUD)
- **Crear**:
  - Llenar nombre, dirección, canon, habitaciones.
  - Guardar.
  - **Validación**: La propiedad aparece al final de la lista "Propiedades".
- **Editar**:
  - Cambiar el estado de "Disponible" a "Arrendado".
  - **Validación**: El cambio se refleja inmediatamente en el Dashboard (contador de ocupación).

### Caso 2.2: Calendario y Visitas
- **Agendar Cita**:
  - Seleccionar fecha en el calendario.
  - Elegir propiedad y cliente del dropdown.
  - Guardar.
  - **Validación**: Aparece un punto/evento en el calendario. Si se da clic, muestra los detalles.
- **Validación de Datos**:
  - Intentar guardar sin elegir propiedad.
  - **Resultado**: El sistema impide guardar y muestra "Seleccione una propiedad".

### Caso 2.3: Gestión de Tickets (Mesa de Ayuda)
- **Responder**:
  - Abrir un ticket "Pendiente".
  - Escribir un mensaje de respuesta.
  - Cambiar estado a "En Progreso".
  - **Validación**: El historial de chat se actualiza con el mensaje del admin (color diferente).

---

## 3. Módulo de Inquilino

### Caso 3.1: Pagos en Línea
- **Visualización**:
  - Entrar a sección "Pagos".
  - Verificar que carguen los meses adeudados desde la base de datos.
- **Simulación de Pago**:
  - Si la lista está vacía, clic en "[Simular Pago]".
  - **Validación**:
    1. Aparece un nuevo renglón en la tabla.
    2. Estado: "Pagado" (Verde).
    3. Botón "Recibo" disponible.

### Caso 3.2: Reporte de Daños
- **Crear**:
  - Clic en "Nuevo Ticket".
  - Asunto: "Fuga de agua".
  - Prioridad: "Alta".
  - Enviar.
- **Validación**: Aparece en la lista de tickets con estado "Pendiente".

---

## 4. Módulo de Propietario

### Caso 4.1: Solicitudes de Aprobación
- **Flujo**:
  - El sistema muestra una solicitud de presupuesto enviada por Admin.
  - Clic en "Rechazar".
  - Ingresar motivo: "Muy costoso".
  - Confirmar.
- **Resultado**:
  - La solicitud desaparece de pendientes.
  - Se notifica al administrador del rechazo.
- **Validación de Error**: (Check de corrección reciente)
  - Intentar crear una solicitud nueva.
  - Verificar que la ventana modal se cierre correctamente tras el éxito.

---

## 5. Módulo de Colaborador

### Caso 5.1: Vista Restringida
- **Pasos**:
  - Ingresar como colaborador.
  - Intentar acceder manualmente a la URL `/admin`.
- **Resultado Esperado**:
  - El sistema bloquea el acceso o redirige a su panel asignado.

### Caso 5.2: Tareas Asignadas
- **Pasos**:
  - Verificar que solo ve los tickets asignados a su ID.
  - Actualizar el estado de una tarea.

---

## 6. Pruebas de Estrés y Base de Datos

### Caso 6.1: Integridad de Datos (Supabase)
- **Pasos**:
  - Crear un usuario, una propiedad, una visita y un pago.
  - Ir al panel de Supabase (o usar una herramienta externa) y verificar las tablas.
- **Resultado**:
  - Los registros existen y los IDs (UUIDs) coinciden.
  - No hay registros duplicados.

### Caso 6.2: Manejo de Desconexión
- **Pasos**:
  - Desconectar internet.
  - Intentar guardar un cambio.
- **Resultado**:
  - Mensaje Toast: "Error de conexión" o "Fallo al guardar".
  - La aplicación NO se rompe ni se pone blanca.
