# CursoIA - Registro al curso

Aplicacion web estatica para registrar personas interesadas en el curso y enviar los datos a Google Sheets mediante Google Apps Script.

La app funciona como PWA: puede instalarse en el dispositivo y guarda registros localmente si no hay conexion o si el envio falla. Cuando vuelve la conexion, intenta sincronizar los registros pendientes.

## Archivos principales

- `index.html`: estructura visual y formulario.
- `styles.css`: estilos de la interfaz.
- `app.js`: validacion, envio, cola local, instalacion PWA y sincronizacion.
- `config.js`: configuracion del endpoint de Google Apps Script.
- `sw.js`: service worker para cache offline.
- `manifest.webmanifest`: datos de instalacion de la PWA.
- `icons/`: iconos usados por la app instalable.
- `scripts/google-apps-script.js`: backend para pegar en Google Apps Script.
- `docs/google-sheets.md`: guia especifica de integracion con Google Sheets.
- `docs/operating.md`: notas operativas internas del flujo de trabajo.

## Requisitos

- Python 3 instalado, solo para servir la app localmente.
- Navegador moderno: Chrome, Edge, Firefox o Safari.
- Una hoja de Google Sheets.
- Un despliegue de Google Apps Script publicado como Web App.

No requiere instalar dependencias de Node ni compilar.

## Ejecutar localmente

Desde PowerShell:

```powershell
cd "C:\Users\goico\OneDrive\Documentos\CursoIA"
python -m http.server 8000 --bind 127.0.0.1
```

Luego abrir:

```text
http://127.0.0.1:8000/
```

No conviene abrir `index.html` con doble clic. Para que el service worker y el modo offline funcionen, la app debe servirse desde `localhost`, `127.0.0.1` o `https`.

## Configuracion

La configuracion esta en `config.js`:

```js
window.COURSE_REGISTRATION_CONFIG = {
  googleAppsScriptUrl: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  apiToken: "",
  requestTimeoutMs: 12000
};
```

Campos:

- `googleAppsScriptUrl`: URL del despliegue Web App de Google Apps Script.
- `apiToken`: token opcional. Si se usa, debe coincidir con el valor esperado por el Apps Script.
- `requestTimeoutMs`: tiempo maximo de espera antes de considerar fallido el envio.

Si `googleAppsScriptUrl` esta vacio o mal escrito, la app seguira funcionando, pero los registros quedaran guardados localmente y no llegaran a Google Sheets.

## Configurar Google Sheets

1. Crear o abrir una hoja de Google Sheets.
2. Copiar el ID de la hoja desde la URL.
3. Abrir Google Apps Script desde la hoja.
4. Pegar el contenido de `scripts/google-apps-script.js`.
5. Ajustar `SPREADSHEET_ID` y, si corresponde, `SHEET_NAME`.
6. Guardar el proyecto.
7. Desplegar como Web App.
8. Copiar la URL `/exec`.
9. Pegar esa URL en `config.js`, en `googleAppsScriptUrl`.

Configuracion recomendada del despliegue:

- Ejecutar como: propietario del script.
- Acceso: cualquier usuario con el enlace, salvo que se requiera otro esquema de seguridad.

Despues de cambiar el Apps Script, crear un nuevo despliegue o actualizar el despliegue existente. Si se usa una URL vieja, la app puede seguir apuntando a una version anterior del backend.

## Flujo de registro

1. El usuario completa el formulario.
2. `app.js` valida los campos.
3. La app crea un registro con identificador unico.
4. Intenta enviar el registro al endpoint de Google Apps Script.
5. Si el envio funciona, muestra confirmacion.
6. Si el envio falla o no hay internet, guarda el registro en `localStorage`.
7. Cuando vuelve la conexion, intenta sincronizar la cola pendiente.

La cola local usa `localStorage`, por lo que queda guardada en el navegador de ese dispositivo. Si se borra el almacenamiento del navegador, se pierden los registros pendientes no sincronizados.

## Modo offline

El modo offline depende de `sw.js`, que registra un service worker y cachea los archivos basicos de la app:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- iconos

Si aparece el mensaje:

```text
La app funciona, pero no se pudo activar el modo offline.
```

significa que la interfaz puede usarse, pero el navegador no pudo registrar el service worker. Causas comunes:

- La app fue abierta con doble clic como archivo local.
- La app no esta en `localhost`, `127.0.0.1` o `https`.
- El navegador bloqueo el service worker.
- `sw.js` tiene error o no puede cargarse.
- Alguno de los archivos listados en cache no existe o devuelve error.

Para probar offline:

1. Abrir la app desde `http://127.0.0.1:8000/`.
2. Recargar una vez la pagina.
3. Abrir DevTools del navegador.
4. Revisar Application > Service Workers.
5. Activar modo offline o cortar internet.
6. Recargar la app.

El primer uso requiere conexion para que el navegador descargue y guarde los archivos. Offline no significa que el primer acceso funcione sin internet.

## Instalacion como app

En navegadores compatibles, la app puede instalarse desde el boton visible o desde el menu del navegador.

Condiciones habituales:

- Debe servirse desde `localhost` o `https`.
- Debe existir `manifest.webmanifest`.
- Deben existir los iconos declarados.
- El service worker debe registrarse correctamente.

En iPhone/iPad, la instalacion suele hacerse desde Safari con "Agregar a pantalla de inicio".

## Publicacion

La app puede publicarse en cualquier hosting estatico:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- servidor propio con HTTPS

Archivos a publicar:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- `sw.js`
- `icons/`

No publicar archivos internos si no son necesarios para el usuario final:

- `.agents/`
- `.codex/`
- `.serena/`
- `.git/`

Antes de publicar, confirmar que `config.js` apunte al Apps Script correcto.

## Seguridad

Esta app es estatica: cualquier dato dentro de `config.js` puede ser visto por quien abra la pagina.

No colocar secretos privados reales en `config.js`. Si se usa `apiToken`, debe tratarse como una barrera simple, no como seguridad fuerte.

Para mayor seguridad:

- Validar datos tambien en Google Apps Script.
- Limitar permisos de la hoja.
- Registrar timestamp e identificador de envio.
- Evitar guardar datos sensibles innecesarios.
- Revisar periodicamente los despliegues activos de Apps Script.

## Diagnostico rapido

### La app no abre

- Confirmar que el servidor local este activo.
- Abrir `http://127.0.0.1:8000/`.
- Verificar que `index.html` exista.

### El formulario no envia

- Revisar `config.js`.
- Confirmar que `googleAppsScriptUrl` termine en `/exec`.
- Probar que el despliegue de Apps Script este activo.
- Revisar permisos del Web App.
- Abrir la consola del navegador para ver errores.

### No llegan datos a Google Sheets

- Confirmar `SPREADSHEET_ID` en `scripts/google-apps-script.js`.
- Confirmar nombre de hoja si el script usa `SHEET_NAME`.
- Revisar ejecuciones en Google Apps Script.
- Confirmar que el despliegue actualizado sea el que esta en `config.js`.

### Quedan registros pendientes

- Puede ser normal si no hay internet o si Apps Script falla.
- La app intentara sincronizar al volver la conexion.
- No borrar datos del navegador hasta confirmar que la cola se sincronizo.

### No se activa el modo offline

- Ejecutar desde `http://127.0.0.1:8000/`, no desde archivo local.
- Confirmar que `sw.js` exista.
- Confirmar que todos los archivos de `sw.js` existan.
- Recargar la pagina despues del primer acceso.
- Revisar Application > Service Workers en DevTools.

## Verificacion antes de usar en produccion

1. Abrir la app desde servidor local o HTTPS.
2. Enviar un registro de prueba con conexion.
3. Confirmar que aparece en Google Sheets.
4. Desconectar internet.
5. Enviar otro registro.
6. Confirmar que queda guardado localmente.
7. Reconectar internet.
8. Confirmar que se sincroniza.
9. Instalar la app como PWA.
10. Abrir la app instalada y repetir una prueba simple.

## Comandos utiles

Ejecutar app local:

```powershell
cd "C:\Users\goico\OneDrive\Documentos\CursoIA"
python -m http.server 8000 --bind 127.0.0.1
```

Abrir en navegador:

```text
http://127.0.0.1:8000/
```

Detener el servidor:

```text
Ctrl + C
```

## Notas de mantenimiento

- Si se agregan archivos criticos, revisar `sw.js` para incluirlos en cache.
- Si se cambia el nombre de iconos, actualizar `manifest.webmanifest` y `sw.js`.
- Si cambia el backend, actualizar `config.js`.
- Si se cambia el esquema de datos, actualizar tambien Google Apps Script y la hoja.
- Probar siempre online y offline despues de cambios en `app.js`, `config.js` o `sw.js`.
