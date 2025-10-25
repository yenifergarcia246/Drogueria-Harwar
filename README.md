# Droguería RG - Proyecto (Frontend + Backend)

**Descripción:**  
Proyecto de muestra que replica el diseño y funcionalidades básicas mostradas en las imágenes proporcionadas: página principal con hero, servicios, productos destacados, búsqueda, carrito, registro e inicio de sesión, creación de pedidos y un formulario de contacto. Incluye un backend simple en Node.js (Express) que actúa como API REST con almacenamiento en `db.json`.

---

## Estructura del proyecto

```
drogueria-rg/
  backend/
    package.json
    server.js
    db.json
  frontend/
    index.html
    login.html
    register.html
    orders.html
    contact.html
    scripts.js
    styles.css
  README.md
```

---

## Requisitos

- Node.js (v14+)
- npm (incluido con Node.js)
- Para servir el frontend puedes usar `npx http-server` o abrir con servidor estático:
  - `npm i -g http-server` y luego `http-server` desde la carpeta `frontend`
  - O usar Live Server de VSCode

---

## Instrucciones (paso a paso)

1. **Iniciar el backend (API)**
   - Abre una terminal.
   - `cd backend`
   - `npm install`
   - `npm start`
   - El servidor quedará en `http://localhost:5000`.

2. **Servir el frontend**
   - Abre otra terminal.
   - `cd frontend`
   - Puedes abrir `index.html` con un servidor estático (recomendado) para evitar problemas de CORS al hacer `fetch`:
     - Opción rápida con `http-server`:
       - `npx http-server -p 3000`
       - Abre `http://localhost:3000` en tu navegador.
     - O si prefieres, abre el HTML directamente (algunos navegadores bloquean `fetch` en `file://`).
   - El frontend hace peticiones a `http://localhost:5000/api/...`

3. **Usuarios de ejemplo**
   - Puedes registrarte desde la interfaz `Register`.
   - Luego iniciar sesión desde `Login`.

4. **Flujo principal**
   - Agrega productos al carrito (botón *Agregar*).
   - Ve a *Mis Pedidos* (Orders) y registra el pedido si estás autenticado.
   - En *Contactar* puedes enviar mensajes al backend.

---

## Notas importantes
- Este proyecto es de demostración y usa un archivo `db.json` simple como "base de datos". No es apto para producción.
- La clave JWT usada está en `backend/server.js` como `SECRET`. Cámbiala para proyectos reales.
- Para desplegar en GitHub, sube la carpeta completa al repositorio (no olvides agregar `.gitignore` si añades `node_modules`).

Versión 1.0 lista para producción.

