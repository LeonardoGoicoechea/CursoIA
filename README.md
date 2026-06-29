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
  apiToken: "",
  requestTimeoutMs: 12000,
  appVersion: "1.0.0",
  releaseDates: {}
};
```

- `googleAppsScriptUrl`: URL `/exec` del despliegue Web App.
- `apiToken`: token opcional. Si se usa, debe coincidir con `EXPECTED_TOKEN` en Apps Script.
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

Pegar `scripts/google-apps-script.js` en Google Apps Script, ajustar `SPREADSHEET_ID`, desplegar como Web App y copiar la URL `/exec` en `config.js`.

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
