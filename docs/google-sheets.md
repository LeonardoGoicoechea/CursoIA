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
   CURSOIA_API_TOKEN = TOKEN_LARGO_COMPARTIDO_CON_config.js
   ```

   No guardar estos valores hardcodeados dentro de `scripts/google-apps-script.js`.
6. Definir `CURSOIA_API_TOKEN` como Script Property y repetir el mismo valor en `config.js`.
7. Guardar.
8. Desplegar > Nueva implementacion > Aplicacion web.
9. Ejecutar como: propietario del script.
10. Acceso: cualquier usuario con el enlace.
11. Copiar la URL que termina en `/exec`.
12. Pegar la URL en `config.js` como `googleAppsScriptUrl`.
13. Pegar el mismo token de `CURSOIA_API_TOKEN` en `config.js` como `apiToken`.

## Payload esperado

```json
{
  "token": "",
  "submissionId": "uuid",
  "module": "profile",
  "participantId": "uuid",
  "timestamp": "2026-06-28T00:00:00.000Z",
  "appVersion": "1.0.0",
  "payload": {
    "fullName": "Nombre"
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
- Revisar si `CURSOIA_API_TOKEN` y `apiToken` coinciden.

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
- El backend exige `CURSOIA_API_TOKEN`; si falta la Script Property, no acepta envios.
- `CURSOIA_SPREADSHEET_ID` y `CURSOIA_API_TOKEN` se leen desde `PropertiesService`, no desde constantes hardcodeadas.
- La matriz completa de campos, hojas y limites esta en `docs/field-matrix.md`.

## Rotacion del token

1. Generar un token nuevo:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Actualizar `CURSOIA_API_TOKEN` en Script properties.
3. Actualizar `apiToken` en `config.js`.
4. Subir `appVersion` y `CACHE_NAME` para evitar que clientes con service worker viejo sigan usando el token anterior.
5. Probar un envio real y verificar la hoja correspondiente.

## Checklist QA de sincronizacion

1. Completar `profile` con conexion activa y verificar la hoja `Perfiles`.
2. Cortar conexion, completar otro modulo y confirmar que la app informa guardado local.
3. Restaurar conexion y presionar **Sincronizar**.
4. Confirmar que la cola pendiente queda vacia.
5. Revisar en Sheets `savedAt`, `timestamp`, `submissionId`, `participantId`, `module`, `appVersion` y `payloadJson`.
6. Enviar un payload con token invalido desde una herramienta de prueba y confirmar que responde `ok: false`.

## Recuperacion operativa

- Para cache o UI vieja: desregistrar el service worker y limpiar storage del sitio desde DevTools.
- Para reenviar cola pendiente: abrir la app online y presionar **Sincronizar** antes de limpiar datos.
- Para reinicio total: usar **Reiniciar** en la app o borrar `localStorage` del sitio.
- Para auditoria: revisar `payloadJson` en Sheets; contiene el objeto validado que recibio el backend.
