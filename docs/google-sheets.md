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
5. Reemplazar `SPREADSHEET_ID`.
6. Si se quiere token simple, definir `EXPECTED_TOKEN` y repetir el mismo valor en `config.js`.
7. Guardar.
8. Desplegar > Nueva implementacion > Aplicacion web.
9. Ejecutar como: propietario del script.
10. Acceso: cualquier usuario con el enlace.
11. Copiar la URL que termina en `/exec`.
12. Pegarla en `config.js` como `googleAppsScriptUrl`.

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
- Confirmar que `SPREADSHEET_ID` sea correcto.

### La app guarda localmente pero no sincroniza

- Verificar conexion.
- Revisar consola del navegador.
- Confirmar que Apps Script responda JSON.
- Revisar si `EXPECTED_TOKEN` y `apiToken` coinciden.

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
