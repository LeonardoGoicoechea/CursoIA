const SHEET_NAME = "Inscripciones";
const SPREADSHEET_ID = "1k39LOb5AsCdHGCTDG6ho4KC_zyuMRtr43gAup2GCRpw";
const HEADERS = [
  "submissionId",
  "createdAt",
  "fullName",
  "email",
  "phone",
  "age",
  "level",
  "mode",
  "goal",
  "consent",
  "source",
  "receivedAt"
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "course-registration",
    timestamp: new Date().toISOString()
  });
}

function doPost(event) {
  try {
    const body = parseBody(event);
    verifyToken(body.token);

    const payload = body.payload || {};
    validatePayload(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getSheet();
      ensureHeaders(sheet);

      if (alreadySaved(sheet, payload.submissionId)) {
        return jsonResponse({ ok: true, duplicate: true, submissionId: payload.submissionId });
      }

      const nextRow = nextWritableRow(sheet);
      sheet.getRange(nextRow, 1, 1, HEADERS.length).setValues([toRow(payload)]);
      return jsonResponse({ ok: true, duplicate: false, submissionId: payload.submissionId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function parseBody(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error("Request vacio.");
  }
  return JSON.parse(event.postData.contents);
}

function verifyToken(token) {
  const expected = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
  if (expected && token !== expected) {
    throw new Error("Token invalido.");
  }
}

function validatePayload(payload) {
  if (!payload.submissionId) throw new Error("Falta submissionId.");
  if (!payload.fullName || String(payload.fullName).trim().length < 3) throw new Error("Nombre invalido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email || ""))) throw new Error("Email invalido.");
  if (!payload.phone) throw new Error("Telefono requerido.");
  const age = Number(payload.age);
  if (!Number.isInteger(age) || age < 13 || age > 99) throw new Error("Edad invalida.");
  if (!payload.level || !payload.mode) throw new Error("Nivel y modalidad requeridos.");
  if (!payload.goal || String(payload.goal).trim().length < 8) throw new Error("Objetivo requerido.");
  if (payload.consent !== true) throw new Error("Consentimiento requerido.");
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => current[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function alreadySaved(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.includes(submissionId);
}

function nextWritableRow(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const firstBlankIndex = ids.findIndex((value) => !value);
  return firstBlankIndex === -1 ? lastRow + 1 : firstBlankIndex + 2;
}

function toRow(payload) {
  return [
    payload.submissionId,
    payload.createdAt,
    payload.fullName,
    payload.email,
    textValue(payload.phone),
    Number(payload.age),
    payload.level,
    payload.mode,
    payload.goal,
    payload.consent === true,
    payload.source || "pwa",
    new Date().toISOString()
  ];
}

function textValue(value) {
  return "'" + String(value || "");
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
