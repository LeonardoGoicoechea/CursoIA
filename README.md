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
  requestTimeoutMs: 12000,
  appVersion: "1.4.0",
  releaseDates: {}
};
```

- `googleAppsScriptUrl`: URL `/exec` del despliegue Web App.
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
  "appVersion": "1.4.0",
  "payload": {}
}
```

Si no hay conexion o falla el endpoint de forma temporal, el sobre queda en `localStorage` y se reintenta al volver online. Si el backend rechaza un payload por validacion permanente, la app lo marca como `error sync` y permite exportar pendientes como JSON desde el cierre.

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

Pegar `scripts/google-apps-script.js` en Google Apps Script, configurar `CURSOIA_SPREADSHEET_ID` como Script property, desplegar como Web App con acceso abierto y copiar la URL `/exec` en `config.js`.

## Privacidad

La app muestra un aviso minimo:

```text
No ingreses nombres reales de clientes, pacientes, empleados ni informacion confidencial. Usa ejemplos anonimizados.
```

La app no pide login ni clave y la sincronizacion queda abierta para cualquier persona que tenga la URL del Web App. Tampoco hay cifrado local. No debe usarse para recolectar datos sensibles. El backend valida campos, evita formulas ejecutables en Sheets y deduplica reintentos por `submissionId`, pero no reemplaza una capa de autenticacion o rate limiting.

## Verificacion

1. Ejecutar localmente desde `127.0.0.1`.
2. Confirmar que no haya login ni clave y que aparezca el aviso global de no cargar informacion sensible.
3. Completar perfil online y confirmar fila en `Perfiles`.
4. Completar cada modulo y confirmar su pestana.
5. Cortar internet, completar un modulo y revisar que quede pendiente.
6. Reconectar y confirmar sincronizacion.
7. Forzar un payload invalido en un entorno de prueba y confirmar estado `error sync` sin reintento infinito.
8. Usar **Exportar pendientes** y confirmar que descarga un JSON de respaldo.
9. Recargar y confirmar que el progreso local persiste.
10. Abrir DevTools > Application y confirmar service worker activo.
11. Publicar en GitHub Pages y confirmar `index.html`, `sw.js`, `manifest.webmanifest` e iconos.

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
- Si se cambia `sw.js`, subir version de `CACHE_NAME` y `appVersion` para forzar cache nuevo.

## Configuracion de Apps Script

En el proyecto de Apps Script, abrir **Project Settings > Script properties** y crear:

```text
CURSOIA_SPREADSHEET_ID = ID_DE_LA_PLANILLA
```

El backend lee esos valores con `PropertiesService`; no deben quedar hardcodeados en `scripts/google-apps-script.js`.

Al publicar el Web App con acceso abierto, cualquier persona con la URL del endpoint puede enviar datos. Si mas adelante hace falta restringirlo, hay que agregar una capa de autenticacion o mover la escritura a un backend propio.

Para actualizar el despliegue:

1. Confirmar o cambiar `CURSOIA_SPREADSHEET_ID` en Script properties.
2. Publicar una nueva version del Web App si corresponde.
3. Si cambia la URL `/exec`, actualizar `googleAppsScriptUrl` en `config.js`.
4. Subir `appVersion` y `CACHE_NAME` para que la PWA tome la version nueva.

## QA manual minimo

1. Ejecutar la app local:

   ```powershell
   python -m http.server 8002 --bind 127.0.0.1
   ```

2. Abrir `http://127.0.0.1:8002/` en una ventana privada o despues de limpiar service workers.
3. Confirmar que la app no pida login ni clave.
4. Completar el perfil y al menos un modulo del recorrido.
5. Desconectar internet, completar otro modulo y confirmar que queda guardado localmente.
6. Reconectar internet, usar **Sincronizar** y confirmar que desaparece la cola pendiente.
7. Revisar en Google Sheets que se haya creado o actualizado la hoja correspondiente.
8. Reenviar el mismo `submissionId` en un entorno de prueba y confirmar que no duplica fila.
9. Enviar un valor de prueba que empiece con `=` y confirmar que queda como texto, no como formula.
10. Confirmar que `appVersion`, `participantId`, `submissionId` y `payloadJson` quedaron registrados.

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

La prueba verifica que los formularios principales existan, que los campos esperados tengan `maxlength`, que la app conserve persistencia/sincronizacion y que `config.js` tenga el endpoint sin publicar credenciales.

Para una comprobacion visual rapida con Playwright:

```powershell
powershell -ExecutionPolicy Bypass -File tools/playwright-check.ps1 -Url http://127.0.0.1:8002/
```

## Contrato de datos

La matriz completa de modulos, hojas, campos y limites esta en `docs/field-matrix.md`. Si se agrega o renombra un campo, actualizar `index.html`, `app.js`, `scripts/google-apps-script.js`, la matriz y luego ejecutar `node tools/smoke-test.js`.
