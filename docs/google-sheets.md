# Google Sheets para CursoIA

Esta guia describe como conectar la PWA CursoIA con Google Sheets usando `scripts/google-apps-script.js`.

## Objetivo

Cada modulo del recorrido se guarda en una pestana distinta para que el facilitador pueda analizar el avance sin construir un dashboard privado.

## Pestanas esperadas

El script crea las pestanas automaticamente si no existen:

- `Perfiles`
- `Termometro1`
- `Termometro2`
- `CasosReales`
- `Flujos`
- `Experimentos`
- `Manifiestos`
- `Eventos`

Cada pestana empieza con columnas base:

- `savedAt`
- `timestamp`
- `submissionId`
- `participantId`
- `module`
- `appVersion`

Luego agrega columnas especificas de cada modulo y una columna `payloadJson` con el objeto completo.

## Campos por modulo

### Perfiles

- `fullName`
- `email`
- `phone`
- `age`
- `role`
- `industry`
- `aiExperience`
- `participantType`
- `personalGoal`
- `consent`

### Termometro1

- `repetitiveTasks`
- `frequency`
- `weeklyTime`
- `energyDrain`
- `delegationRisk`
- `humanCriteria`

### Termometro2

- `fearLagging`
- `fearBadDelegation`
- `overload`
- `experimentConfidence`
- `opportunity`

### CasosReales

- `realProblem`
- `context`
- `currentInput`
- `expectedOutput`
- `aiAssistance`
- `humanDecision`
- `aiBoundary`
- `risks`

### Flujos

- `currentFlow`
- `newFlow`
- `delegatedStep`
- `supervisedStep`
- `preservedStep`
- `improvementMetric`

### Experimentos

- `testedAction`
- `toolUsed`
- `timeBefore`
- `timeAfter`
- `result`
- `humanCorrections`
- `learning`
- `nextAdjustment`

### Manifiestos

- `willDelegate`
- `willPreserve`
- `ethicalLimit`
- `verificationPractice`
- `thirtyDayCommitment`
- `signature`

## Instalacion del Apps Script

1. Crear o abrir la hoja de Google Sheets.
2. Copiar el ID desde la URL.
3. Abrir Extensiones > Apps Script.
4. Pegar el contenido de `scripts/google-apps-script.js`.
5. Abrir **Project Settings > Script properties** y crear:

   ```text
   CURSOIA_SPREADSHEET_ID = ID_DE_LA_PLANILLA
   CURSOIA_GOOGLE_CLIENT_ID = TU_CLIENT_ID.apps.googleusercontent.com
   CURSOIA_ALLOWED_EMAILS = facilitador@empresa.com,@empresa.com
   ```

   `CURSOIA_ALLOWED_EMAILS` acepta emails exactos y entradas por dominio que empiezan con `@`.

   No guardar estos valores hardcodeados dentro de `scripts/google-apps-script.js`.
6. Guardar.
7. Crear un cliente OAuth web en Google Cloud para Google Sign-In.
8. En **Authorized JavaScript origins** incluir los dominios desde donde corre la PWA, por ejemplo:

   ```text
   http://127.0.0.1:8000
   http://127.0.0.1:8002
   https://leonardogoicoechea.github.io
   ```

9. Copiar el client ID generado por Google Cloud.
10. Desplegar > Nueva implementacion > Aplicacion web.
11. Ejecutar como: propietario del script.
12. Acceso: cualquier usuario con el enlace.
13. Copiar la URL que termina en `/exec`.
14. Pegar la URL en `config.js` como `googleAppsScriptUrl`.
15. Pegar el mismo client ID en `config.js` como `googleClientId`.
16. Abrir la app e iniciar sesion con una cuenta autorizada para sincronizar.

## Payload esperado

```json
{
  "idToken": "JWT_DE_GOOGLE",
  "submissionId": "uuid",
  "module": "profile",
  "participantId": "uuid",
  "timestamp": "2026-06-28T00:00:00.000Z",
  "appVersion": "1.0.0",
  "payload": {
    "fullName": "Nombre",
    "consent": "true"
  }
}
```

Respuesta correcta:

```json
{
  "ok": true,
  "module": "profile",
  "savedAt": "2026-06-28T00:00:00.000Z"
}
```

Respuesta con error:

```json
{
  "ok": false,
  "module": "",
  "savedAt": "2026-06-28T00:00:00.000Z",
  "error": "Modulo desconocido."
}
```

## Diagnostico

### No llegan datos

- Confirmar que `googleAppsScriptUrl` termine en `/exec`.
- Confirmar que el despliegue activo sea el ultimo.
- Revisar ejecuciones en Apps Script.
- Confirmar permisos del Web App.
- Confirmar que `CURSOIA_SPREADSHEET_ID` sea correcto.

### La app guarda localmente pero no sincroniza

- Verificar conexion.
- Revisar consola del navegador.
- Confirmar que Apps Script responda JSON.
- Confirmar que la persona haya iniciado sesion con Google en la app.
- Revisar si la cuenta usada esta incluida en `CURSOIA_ALLOWED_EMAILS`.
- Confirmar que `googleClientId` en `config.js` coincida con `CURSOIA_GOOGLE_CLIENT_ID`.
- Revisar que el dominio actual de la app este cargado en **Authorized JavaScript origins** del cliente OAuth.

### Se crea una pestana pero faltan columnas

- Revisar que los nombres de campos en `index.html`, `app.js` y `scripts/google-apps-script.js` coincidan.
- Borrar o corregir encabezados si se cambio el esquema manualmente.

### Error por modulo desconocido

- El valor `module` enviado por la PWA no coincide con las claves definidas en `MODULES` dentro del Apps Script.

## Robustez

- `LockService` evita escrituras simultaneas conflictivas.
- Las pestanas se crean si no existen.
- Los encabezados se escriben si la pestana esta vacia.
- El payload completo se guarda en `payloadJson` para auditoria y cambios futuros.

## Validacion y seguridad

- El backend rechaza modulos desconocidos, campos no permitidos, tipos no textuales, campos obligatorios vacios y textos que superen los limites definidos.
- El backend exige un `idToken` de Google valido, con `aud` igual a `CURSOIA_GOOGLE_CLIENT_ID`, email verificado y cuenta permitida por `CURSOIA_ALLOWED_EMAILS`.
- `CURSOIA_SPREADSHEET_ID`, `CURSOIA_GOOGLE_CLIENT_ID` y `CURSOIA_ALLOWED_EMAILS` se leen desde `PropertiesService`, no desde constantes hardcodeadas.
- La matriz completa de campos, hojas y limites esta en `docs/field-matrix.md`.

## Gestion de accesos

1. Actualizar `CURSOIA_ALLOWED_EMAILS` en Script properties para agregar o quitar cuentas.
2. Si cambia el cliente OAuth, actualizar `CURSOIA_GOOGLE_CLIENT_ID` en Apps Script y `googleClientId` en `config.js`.
3. Subir `appVersion` para invalidar el cache general; `config.js` usa `network-first`, asi que online deberia captar el cambio aun antes del recache completo.
4. Probar un envio real y verificar la hoja correspondiente.

## Checklist QA de sincronizacion

1. Iniciar sesion con Google en la app.
2. Completar `profile` con conexion activa y verificar la hoja `Perfiles`.
3. Cortar conexion, completar otro modulo y confirmar que la app informa guardado local.
4. Restaurar conexion y presionar **Sincronizar**.
5. Confirmar que la cola pendiente queda vacia.
6. Revisar en Sheets `savedAt`, `timestamp`, `submissionId`, `participantId`, `module`, `appVersion` y `payloadJson`.
7. Enviar un payload con `idToken` invalido o con una cuenta no autorizada y confirmar que responde `ok: false`.

## Recuperacion operativa

- Para cache o UI vieja: desregistrar el service worker y limpiar storage del sitio desde DevTools.
- Para reenviar cola pendiente: abrir la app online y presionar **Sincronizar** antes de limpiar datos.
- Para reinicio total: usar **Reiniciar** en la app o borrar `localStorage` del sitio.
- Para auditoria: revisar `payloadJson` en Sheets; contiene el objeto validado que recibio el backend.
