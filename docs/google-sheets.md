# Google Sheets backend

## Hoja creada

La hoja ya fue creada y preparada:

https://docs.google.com/spreadsheets/d/1k39LOb5AsCdHGCTDG6ho4KC_zyuMRtr43gAup2GCRpw/edit

## 1. Crear el Apps Script

1. Abre https://script.google.com/home/projects/create
2. Pega el contenido de `scripts/google-apps-script.js`.
3. Guarda el proyecto.

## 2. Publicar endpoint

1. En Apps Script, abre `Implementar > Nueva implementacion`.
2. Tipo: `Aplicacion web`.
3. Ejecutar como: `Yo`.
4. Acceso: `Cualquier usuario`.
5. Copia la URL de la aplicacion web.

## 3. Conectar la PWA

Edita `config.js`:

```js
window.COURSE_REGISTRATION_CONFIG = {
  googleAppsScriptUrl: "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec",
  apiToken: "",
  requestTimeoutMs: 12000
};
```

## Seguridad opcional

En Apps Script puedes definir una propiedad `API_TOKEN`.
Si la defines, pon el mismo valor en `config.js`.

Esto filtra envios accidentales, pero no es un secreto fuerte porque vive en el navegador.
Para seguridad fuerte, usa un backend propio entre la PWA y Google Sheets.

## Robustez incluida

- Validacion en navegador y Apps Script.
- `submissionId` unico para evitar duplicados.
- Bloqueo con `LockService` al guardar.
- Cola local si no hay conexion o si el endpoint no esta configurado.
- Reintento automatico cuando vuelve la conexion.
