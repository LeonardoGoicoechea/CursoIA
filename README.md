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
- `config.js`: URL publica de Google Apps Script y version de app.
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
  apiToken: "PEGAR_TOKEN_LARGO_AQUI",
  requestTimeoutMs: 12000,
  appVersion: "1.0.0",
  releaseDates: {}
};
```

- `googleAppsScriptUrl`: URL `/exec` del despliegue Web App.
- `apiToken`: obligatorio en produccion. Debe coincidir con la Script Property `CURSOIA_API_TOKEN`.
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

Pegar `scripts/google-apps-script.js` en Google Apps Script, configurar `CURSOIA_SPREADSHEET_ID` y `CURSOIA_API_TOKEN` como Script properties, desplegar como Web App y copiar la URL `/exec` en `config.js`.

## Privacidad

La app muestra un aviso minimo:

```text
No ingreses nombres reales de clientes, pacientes, empleados ni informacion confidencial. Usa ejemplos anonimizados.
```

No hay login ni cifrado local en esta version. No debe usarse para recolectar datos sensibles.

## Verificacion

1. Ejecutar localmente desde `127.0.0.1`.
2. Completar perfil online y confirmar fila en `Perfiles`.
3. Completar cada modulo y confirmar su pestana.
4. Cortar internet, completar un modulo y revisar que quede pendiente.
5. Reconectar y confirmar sincronizacion.
6. Recargar y confirmar que el progreso local persiste.
7. Abrir DevTools > Application y confirmar service worker activo.
8. Publicar en GitHub Pages y confirmar `index.html`, `sw.js`, `manifest.webmanifest` e iconos.

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
- Si cambia la URL de Apps Script, actualizar `config.js`.
- Si se cambia `sw.js`, subir version de `CACHE_NAME` para forzar cache nuevo.
## Configuracion segura de Apps Script

En el proyecto de Apps Script, abrir **Project Settings > Script properties** y crear:

```text
CURSOIA_SPREADSHEET_ID = ID_DE_LA_PLANILLA
CURSOIA_API_TOKEN = MISMO_TOKEN_DE_config.js
```

El backend lee esos valores con `PropertiesService`; no deben quedar hardcodeados en `scripts/google-apps-script.js`.

Para rotar el token:

1. Generar un token nuevo:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Reemplazar `apiToken` en `config.js`.
3. Reemplazar `CURSOIA_API_TOKEN` en Script properties.
4. Publicar una nueva version del Web App si corresponde.
5. Subir `appVersion` y `CACHE_NAME` para que la PWA tome la version nueva.

## QA manual minimo

1. Ejecutar la app local:

   ```powershell
   python -m http.server 8002 --bind 127.0.0.1
   ```

2. Abrir `http://127.0.0.1:8002/` en una ventana privada o despues de limpiar service workers.
3. Completar el perfil y al menos un modulo del recorrido.
4. Desconectar internet, completar otro modulo y confirmar que queda guardado localmente.
5. Reconectar internet, usar **Sincronizar** y confirmar que desaparece la cola pendiente.
6. Revisar en Google Sheets que se haya creado o actualizado la hoja correspondiente.
7. Confirmar que `appVersion`, `participantId`, `submissionId` y `payloadJson` quedaron registrados.

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

La prueba verifica que los formularios principales existan, que los campos esperados tengan `maxlength`, que la app conserve persistencia/sincronizacion y que `config.js` tenga endpoint y token configurados.

Para una comprobacion visual rapida con Playwright:

```powershell
powershell -ExecutionPolicy Bypass -File tools/playwright-check.ps1 -Url http://127.0.0.1:8002/
```

## Contrato de datos

La matriz completa de modulos, hojas, campos y limites esta en `docs/field-matrix.md`. Si se agrega o renombra un campo, actualizar `index.html`, `app.js`, `scripts/google-apps-script.js`, la matriz y luego ejecutar `node tools/smoke-test.js`.
