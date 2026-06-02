# CGBI Landing Page & Propuesta Comercial - SIKAI CX

Este directorio contiene los entregables premium diseñados por **SIKAI CX** para **CGBI (Camila Gutiérrez Brokers Inmobiliarios)** para el proceso de captación y perfilamiento de leads.

Ambos entregables son **100% independientes y autocontenidos**, listos para alojarse en producción y presentarse directamente a los fundadores.

## Estructura de Entregables

### 1. Landing Page Premium de Captación (`index.html`)
* **Estética de Lujo (Glassmorphism)**: Inspirada en www.sikaiconsulting.com, combinando fondos oscuros, gradientes fluidos y bordes de fucsia/azul traslúcido.
* **Cajas de Texto Glass**: Todos los campos de entrada de texto y selectores tienen el efecto de cristal desenfocado con sombreado de profundidad y brillos en foco.
* **Hero Interactivo (Premium App Mockup)**: El Hero integra una maqueta interactiva 3D de un smartphone que demuestra las características exclusivas de la **App Premium CGBI** (control de contratos, estados de pago al día y reportes de reparaciones). Esto incentiva fuertemente la captación.
* **Líneas de Servicio**: Claridad comercial entre Arriendos (Delegador al 10.57% con póliza de El Libertador vs Gestor a 1 canon + IVA) y Ventas (Exclusivo vs Abierto a 3% comisión).
* **Lead Profiler Dinámico**: Asistente inteligente por pasos (*Wizard*) que califica al lead y genera un mensaje estructurado con emojis listo para enviarse directo al WhatsApp del asesor, reduciendo el ruido en un 65%.

### 2. Propuesta Comercial Interactiva (`propuesta.html`)
* **Pitch Corporativo**: Diseñado específicamente para ser mostrado a los fundadores de CGBI.
* **Diagnóstico de Saturación**: Expone el problema actual de WhatsApp y cómo el Lead Profiler lo soluciona de inmediato.
* **Tabla de Diferenciadores en Bogotá**: Contrasta el modelo ágil y digital de CGBI frente a competidores tradicionales.
* **Inversión Preferencial de Alianza**:
  * Valor comercial regular: `$ 5,000,000 COP`
  * Descuento por Alianza Estratégica (60%): `- $ 3,000,000 COP`
  * **Inversión Preferencial CGBI: $ 2,000,000 COP**
* **Botón de Aprobación Directa**: Un llamado a la acción con glow que envía un mensaje estructurado de aprobación directamente al WhatsApp para formalizar e iniciar el proyecto.

---

## Instrucciones de Despliegue (Hosting Independiente)

Dado que cada entregable es un archivo `.html` autocontenido que consume librerías optimizadas en CDN, puedes subirlos a internet en **menos de 1 minuto** de forma gratuita:

### Opción 1: Despliegue Inmediato con Netlify (Recomendado)
1. Entra a [Netlify Drop](https://app.netlify.com/drop).
2. Arrastra y suelta la carpeta entera `landing-prototype` dentro del recuadro.
3. ¡Listo! Netlify te generará un enlace público instantáneo conteniendo tanto `index.html` como `propuesta.html`.
4. En la configuración de Netlify, vincula tu dominio (ej. `captacion.cgbi.com.co` y `propuesta.cgbi.com.co`).

### Opción 2: Despliegue con Vercel CLI
1. Abre tu terminal e ingresa a la carpeta:
   ```bash
   cd landing-prototype
   ```
2. Ejecuta el comando de despliegue rápido:
   ```bash
   npx vercel --prod
   ```
3. Sigue las breves instrucciones en consola y tu sitio estará activo.

---
**Desarrollado con pasión y precisión técnica por el equipo de SIKAI CX.**
