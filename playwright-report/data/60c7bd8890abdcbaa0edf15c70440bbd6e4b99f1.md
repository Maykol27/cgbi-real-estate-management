# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - img "CGBI Logo" [ref=e8]
      - heading "Iniciar Sesión" [level=1] [ref=e9]
      - paragraph [ref=e10]: Ingrese sus credenciales para acceder a la plataforma.
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: error_outline
        - text: No se pudo iniciar sesión. Verifique sus credenciales.
      - generic [ref=e14]:
        - generic [ref=e15]: Correo Electrónico
        - generic [ref=e16]:
          - generic [ref=e17]: email
          - textbox "usuario@cgbi.com" [ref=e18]: carlos.ruiz@cgbi.com
      - generic [ref=e19]:
        - generic [ref=e20]: Contraseña
        - generic [ref=e21]:
          - generic [ref=e22]: lock
          - textbox "••••••••" [ref=e23]: pruebas2026cgbi
        - link "¿Olvidó su contraseña? Recuperar acceso" [ref=e25] [cursor=pointer]:
          - /url: "#"
      - button "Ingresar login" [ref=e26]:
        - generic [ref=e27]: Ingresar
        - generic [ref=e28]: login
    - generic [ref=e29]:
      - paragraph [ref=e30]: © 2026 Tú CGBI
      - link "Desarrollado por SIKAI SIKAI" [ref=e31] [cursor=pointer]:
        - /url: https://sikaiconsulting.com
        - generic [ref=e32]: Desarrollado por SIKAI
        - img "SIKAI" [ref=e33]
  - button "Alternar Tema" [ref=e35] [cursor=pointer]:
    - generic [ref=e36]: dark_mode
    - generic [ref=e37]: light_mode
```