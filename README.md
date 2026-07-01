# CursoIA - PWA del taller

CursoIA es una PWA estatica para acompanar el taller **Trabajar con IA sin perder lo humano**. No es solo un formulario de inscripcion: funciona como bitacora del alumno durante los 3 encuentros.

La app guarda avances en el dispositivo, funciona offline despues del primer acceso y sincroniza cada modulo con Google Sheets mediante Google Apps Script.

## Recorrido

1. **Bienvenida / captacion**: adapta el mensaje para lideres o profesionales.
2. **Registro y perfil**: datos base, rol, rubro, experiencia con IA y objetivo.
3. **Termometro 1**: auto-observacion de tareas repetitivas, energia, tiempo y criterio humano.
4. **Termometro 2**: FOMO/FOBO, sobrecarga, confianza y oportunidad concreta.
5. **Caso real**: problema laboral acotado para experimentar.
6. **Flujo IA + humano**: que delegar, que supervisar y que preservar.
7. **Experimento semanal**: evidencia de uso real entre encuentros.
8. **Manifiesto**: compromiso final de criterio humano.
9. **Cierre**: avance local y estado de sincronizacion.

## Archivos principales

- `index.html`: estructura de la PWA y formularios del recorrido.
- `styles.css`: interfaz responsive.
- `app.js`: navegacion, guardado local, cola offline y sincronizacion.
- `config.js`: URL publica de Google Apps Script, client ID de Google Sign-In y version de app.
- `sw.js`: service worker y cache offline.
- `manifest.webmanifest`: metadatos de instalacion.
- `scripts/google-apps-script.js`: backend para Google Sheets.
- `docs/google-sheets.md`: guia de integracion con Sheets.

## Ejecutar localmente

```powershell
cd "C:\Users\goico\OneDrive\Documentos\CursoIA"
python -m http.server 8000 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:8000/
```

No abrir `index.html` con doble clic. El modo offline/PWA requiere `localhost`, `127.0.0.1` o `https`.

## Configuracion

Editar `config.js`:

```js
window.COURSE_REGISTRATION_CONFIG = {
  googleAppsScriptUrl: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  googleClientId: "TU_CLIENT_ID.apps.googleusercontent.com",
  requestTimeoutMs: 12000,
  appVersion: "1.0.0",
  releaseDates: {}
};
```

- `googleAppsScriptUrl`: URL `/exec` del despliegue Web App.
- `googleClientId`: client ID OAuth web usado por Google Sign-In en la PWA.
- `requestTimeoutMs`: espera maxima de cada envio.
- `appVersion`: version enviada en cada payload.
- `releaseDates`: reservado para liberar modulos por fecha en una version futura.

## Datos enviados

Cada modulo envia un sobre comun:

```json
{
  "submissionId": "id unico",
  "module": "profile",
  "participantId": "id persistente del dispositivo",
  "timestamp": "fecha ISO",
  "appVersion": "1.0.0",
  "payload": {}
}
```

Si no hay conexion o falla el endpoint, el sobre queda en `localStorage` y se reintenta al volver online.

## Google Sheets

El Apps Script crea y usa estas pestanas:

- `Perfiles`
- `Termometro1`
- `Termometro2`
- `CasosReales`
- `Flujos`
- `Experimentos`
- `Manifiestos`
- `Eventos`

Pegar `scripts/google-apps-script.js` en Google Apps Script, configurar `CURSOIA_SPREADSHEET_ID`, `CURSOIA_GOOGLE_CLIENT_ID` y `CURSOIA_ALLOWED_EMAILS` como Script properties, desplegar como Web App, copiar la URL `/exec` en `config.js`, cargar el mismo `googleClientId` en la PWA e iniciar sesion con una cuenta autorizada para sincronizar.

## Privacidad

La app muestra un aviso minimo:

```text
No ingreses nombres reales de clientes, pacientes, empleados ni informacion confidencial. Usa ejemplos anonimizados.
```

La sincronizacion requiere inicio de sesion con Google, pero sigue sin haber cifrado local. No debe usarse para recolectar datos sensibles.

## Verificacion

1. Ejecutar localmente desde `127.0.0.1`.
2. Iniciar sesion con Google en el panel superior.
3. Completar perfil online y confirmar fila en `Perfiles`.
4. Completar cada modulo y confirmar su pestana.
5. Cortar internet, completar un modulo y revisar que quede pendiente.
6. Reconectar y confirmar sincronizacion.
7. Recargar y confirmar que el progreso local persiste.
8. Abrir DevTools > Application y confirmar service worker activo.
9. Publicar en GitHub Pages y confirmar `index.html`, `sw.js`, `manifest.webmanifest` e iconos.

## Publicacion

Repositorio:

```text
https://github.com/LeonardoGoicoechea/CursoIA
```

GitHub Pages:

```text
https://leonardogoicoechea.github.io/CursoIA/
```

Publicar desde rama `main`, carpeta raiz.

## Mantenimiento

- Si cambia un campo de formulario, actualizar tambien `scripts/google-apps-script.js` y `docs/google-sheets.md`.
- Si se agregan assets, actualizar `sw.js`.
- Si cambia la URL de Apps Script o el client ID de Google, actualizar `config.js`.
- Si cambia el dominio/origen desde donde se publica la PWA, actualizar tambien el cliente OAuth en Google Cloud.
- Si se cambia `sw.js`, subir version de `CACHE_NAME` para forzar cache nuevo.

## Configuracion segura de Apps Script y Google Sign-In

En el proyecto de Apps Script, abrir **Project Settings > Script properties** y crear:

```text
CURSOIA_SPREADSHEET_ID = ID_DE_LA_PLANILLA
CURSOIA_GOOGLE_CLIENT_ID = TU_CLIENT_ID.apps.googleusercontent.com
CURSOIA_ALLOWED_EMAILS = facilitador@empresa.com,@empresa.com
```

`CURSOIA_ALLOWED_EMAILS` acepta emails exactos y entradas por dominio que empiezan con `@`.

El backend lee esos valores con `PropertiesService`; no deben quedar hardcodeados en `scripts/google-apps-script.js`.

Tambien hace falta crear un cliente OAuth web en Google Cloud y copiar su client ID en `config.js`. En **Authorized JavaScript origins** incluir al menos:

```text
http://127.0.0.1:8000
http://127.0.0.1:8002
https://leonardogoicoechea.github.io
```

Para actualizar quienes pueden sincronizar:

1. Editar `CURSOIA_ALLOWED_EMAILS` en Script properties.
2. Publicar una nueva version del Web App si corresponde.
3. Si cambia el OAuth client, actualizar tambien `CURSOIA_GOOGLE_CLIENT_ID` en Apps Script y `googleClientId` en `config.js`.
4. Subir `appVersion` y `CACHE_NAME` para que la PWA tome la version nueva.

## QA manual minimo

1. Ejecutar la app local:

   ```powershell
   python -m http.server 8002 --bind 127.0.0.1
   ```

2. Abrir `http://127.0.0.1:8002/` en una ventana privada o despues de limpiar service workers.
3. Iniciar sesion con una cuenta Google autorizada en el panel superior.
4. Completar el perfil y al menos un modulo del recorrido.
5. Desconectar internet, completar otro modulo y confirmar que queda guardado localmente.
6. Reconectar internet, usar **Sincronizar** y confirmar que desaparece la cola pendiente.
7. Revisar en Google Sheets que se haya creado o actualizado la hoja correspondiente.
8. Confirmar que `appVersion`, `participantId`, `submissionId` y `payloadJson` quedaron registrados.

## Recuperacion

1. En Chrome DevTools, abrir **Application > Service Workers** y usar **Unregister** para el dominio publicado.
2. En **Application > Storage**, usar **Clear site data**.
3. Recargar con hard refresh.
4. Si solo se necesita reenviar datos pendientes, abrir la app online y usar **Sincronizar** antes de borrar datos locales.
5. Si la cola quedo inconsistente, exportar o capturar los datos visibles del resumen antes de usar **Reiniciar**.

## Prueba minima

Ejecutar:

```powershell
node tools/smoke-test.js
```

La prueba verifica que los formularios principales existan, que los campos esperados tengan `maxlength`, que la app conserve persistencia/sincronizacion y que `config.js` tenga endpoint y `googleClientId` sin publicar una clave compartida.

Para una comprobacion visual rapida con Playwright:

```powershell
powershell -ExecutionPolicy Bypass -File tools/playwright-check.ps1 -Url http://127.0.0.1:8002/
```

## Contrato de datos

La matriz completa de modulos, hojas, campos y limites esta en `docs/field-matrix.md`. Si se agrega o renombra un campo, actualizar `index.html`, `app.js`, `scripts/google-apps-script.js`, la matriz y luego ejecutar `node tools/smoke-test.js`.
