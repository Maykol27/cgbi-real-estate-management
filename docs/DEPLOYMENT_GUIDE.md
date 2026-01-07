# Guía de Despliegue Automático (CI/CD)
**GitHub + Firebase Hosting**

Esta guía detalla cómo conectar tu código local a GitHub y configurar Firebase para que se actualice automáticamente cada vez que guardes cambios.

---

## Prerrequisitos
1. **Cuenta en GitHub**.
2. **Proyecto en Firebase Console** creado.
3. **Git** instalado en tu computador.
4. **Node.js** instalado.

---

## Paso 1: Preparar el Repositorio Local (Git)

Si aún no has iniciado git, abre la terminal y ejecuta:

```bash
git init
git add .
git commit -m "Versión 1.0 lista para producción"
```

## Paso 2: Crear Repositorio en GitHub

1. Ve a [GitHub.com](https://github.com) y crea un **Nuevo Repositorio**.
2. Ponle un nombre (ej: `cgbi-real-estate-app`).
3. **NO** marques "Initialize with README".
4. Copia el comando que dice: `git remote add origin https://github.com/TU_USUARIO/cgbi-real-estate-app.git`

## Paso 3: Conectar Local con GitHub

En tu terminal (VS Code), pega el comando que copiaste:

```bash
git remote add origin <URL_DE_TU_REPO>
git branch -M main
git push -u origin main
```

## Paso 4: Configurar Firebase Hosting y GitHub Actions

Este paso conecta las dos plataformas. Ejecuta en la terminal:

```bash
npx firebase login
npx firebase init hosting
```

El asistente te hará las siguientes preguntas:
1. **Project Setup**: Selecciona "Use an existing project" y elige tu proyecto `cgbi-real-estate`.
2. **Public directory**: Escribe `dist` (Esto es muy importante, es donde Vite crea la app).
3. **Configure as a single-page app?**: Escribe `Yes` (o `y`).
4. **Set up automatic builds and deploys with GitHub?**: Escribe `Yes` (o `y`).
5. **File to overwrite? (index.html)**: Escribe `No` (o `n`).

Luego te pedirá iniciar sesión en GitHub desde la terminal para autorizar a Firebase.
- **For which GitHub repository would you like to set up a GitHub workflow?**: Escribe `TU_USUARIO/NOMBRE_REPO`.

Firebase creará automáticamente un archivo en `.github/workflows` y guardará los secretos necesarios en GitHub.

---

## 🛠️ Cómo Funciona el Flujo de Trabajo

A partir de ahora, tu flujo de trabajo será:

1. **Haces cambios** en el código en tu computador.
2. **Guardas** los cambios en Git:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
3. **Automáticamente**: GitHub detecta el "push", construye la aplicación (`npm run build`) y la sube a Firebase.
4. **Listo**: En unos minutos, tu cliente verá la nueva versión en vivo.
