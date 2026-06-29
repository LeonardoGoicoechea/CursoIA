const SPREADSHEET_ID = "1k39LOb5AsCdHGCTDG6ho4KC_zyuMRtr43gAup2GCRpw";
const EXPECTED_TOKEN = "";

const MODULES = {
  profile: {
    sheet: "Perfiles",
    fields: [
      "fullName",
      "email",
      "phone",
      "age",
      "role",
      "industry",
      "aiExperience",
      "participantType",
      "personalGoal"
    ]
  },
  thermometer1: {
    sheet: "Termometro1",
    fields: ["repetitiveTasks", "frequency", "weeklyTime", "energyDrain", "delegationRisk", "humanCriteria"]
  },
  thermometer2: {
    sheet: "Termometro2",
    fields: ["fearLagging", "fearBadDelegation", "overload", "experimentConfidence", "opportunity"]
  },
  case: {
    sheet: "CasosReales",
    fields: ["realProblem", "context", "currentInput", "expectedOutput", "aiAssistance", "humanDecision", "aiBoundary", "risks"]
  },
  flow: {
    sheet: "Flujos",
    fields: ["currentFlow", "newFlow", "delegatedStep", "supervisedStep", "preservedStep", "improvementMetric"]
  },
  experiment: {
    sheet: "Experimentos",
    fields: ["testedAction", "toolUsed", "timeBefore", "timeAfter", "result", "humanCorrections", "learning", "nextAdjustment"]
  },
  manifesto: {
    sheet: "Manifiestos",
    fields: ["willDelegate", "willPreserve", "ethicalLimit", "verificationPractice", "thirtyDayCommitment", "signature"]
  },
  event: {
    sheet: "Eventos",
    fields: ["type", "message", "details"]
  }
};

const BASE_HEADERS = ["savedAt", "timestamp", "submissionId", "participantId", "module", "appVersion"];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "CursoIA",
    modules: Object.keys(MODULES)
  });
}

function doPost(event) {
  const savedAt = new Date().toISOString();
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const data = parseRequest(event);
    validateToken(data);
    const moduleConfig = validateModule(data);
    const sheet = getSheet(moduleConfig.sheet);
    ensureHeaders(sheet, moduleConfig.fields);
    sheet.appendRow(buildRow(data, moduleConfig.fields, savedAt));

    return jsonResponse({
      ok: true,
      module: data.module,
      savedAt
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      module: "",
      savedAt,
      error: error.message || String(error)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // Lock may not have been acquired if parsing failed very early.
    }
  }
}

function parseRequest(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error("Payload vacio.");
  }

  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error("Payload JSON invalido.");
  }
}

function validateToken(data) {
  if (!EXPECTED_TOKEN) return;
  if (data.token !== EXPECTED_TOKEN) {
    throw new Error("Token invalido.");
  }
}

function validateModule(data) {
  if (!data.module || !MODULES[data.module]) {
    throw new Error("Modulo desconocido.");
  }
  if (!data.payload || typeof data.payload !== "object") {
    throw new Error("Payload de modulo vacio.");
  }
  if (!data.submissionId || !data.participantId) {
    throw new Error("Faltan identificadores.");
  }
  return MODULES[data.module];
}

function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeaders(sheet, fields) {
  const headers = BASE_HEADERS.concat(fields, ["payloadJson"]);
  const existing = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];

  const needsHeaders = existing.filter(String).length === 0;
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  if (headers.some((header, index) => existing[index] !== header)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function buildRow(data, fields, savedAt) {
  const payload = data.payload || {};
  return BASE_HEADERS.map((header) => data[header] || (header === "savedAt" ? savedAt : ""))
    .concat(fields.map((field) => payload[field] || ""))
    .concat([JSON.stringify(payload)]);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
