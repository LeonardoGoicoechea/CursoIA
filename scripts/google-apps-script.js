const PROPERTY_KEYS = {
  spreadsheetId: "CURSOIA_SPREADSHEET_ID",
  apiToken: "CURSOIA_API_TOKEN"
};

const DEFAULT_MAX_LENGTH = 1200;
const SHORT_TEXT_MAX_LENGTH = 160;
const LONG_TEXT_MAX_LENGTH = 2400;
const MAX_PAYLOAD_JSON_LENGTH = 30000;

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
      "personalGoal",
      "consent"
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

const FIELD_RULES = {
  fullName: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  email: { type: "string", maxLength: 254, required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: "string", maxLength: 40 },
  age: { type: "string", maxLength: 20 },
  role: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  industry: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  aiExperience: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  participantType: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  personalGoal: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  consent: { type: "string", maxLength: 5, required: true, pattern: /^(true)$/ },
  repetitiveTasks: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  frequency: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  weeklyTime: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  energyDrain: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  delegationRisk: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  humanCriteria: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  fearLagging: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  fearBadDelegation: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  overload: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  experimentConfidence: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  opportunity: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  realProblem: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  context: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  currentInput: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  expectedOutput: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  aiAssistance: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  humanDecision: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  aiBoundary: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  risks: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  currentFlow: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  newFlow: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  delegatedStep: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  supervisedStep: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  preservedStep: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  improvementMetric: { type: "string", maxLength: DEFAULT_MAX_LENGTH, required: true },
  testedAction: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  toolUsed: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  timeBefore: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  timeAfter: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  result: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  humanCorrections: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  learning: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  nextAdjustment: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  willDelegate: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  willPreserve: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  ethicalLimit: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  verificationPractice: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  thirtyDayCommitment: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH, required: true },
  signature: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  type: { type: "string", maxLength: SHORT_TEXT_MAX_LENGTH, required: true },
  message: { type: "string", maxLength: DEFAULT_MAX_LENGTH },
  details: { type: "string", maxLength: LONG_TEXT_MAX_LENGTH }
};

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
    data.payload = validatePayload(data.payload, moduleConfig.fields);
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
  const expectedToken = getRequiredProperty(PROPERTY_KEYS.apiToken);
  if (data.token !== expectedToken) {
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

function validatePayload(payload, allowedFields) {
  const allowed = new Set(allowedFields);
  const unknownFields = Object.keys(payload).filter((field) => !allowed.has(field));
  if (unknownFields.length) {
    throw new Error("Campos no permitidos: " + unknownFields.join(", "));
  }

  return allowedFields.reduce((validated, field) => {
    const rule = FIELD_RULES[field] || { type: "string", maxLength: DEFAULT_MAX_LENGTH };
    const rawValue = payload[field];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (rule.required) {
        throw new Error("Campo obligatorio faltante: " + field);
      }
      validated[field] = "";
      return validated;
    }

    if (rule.type === "string" && typeof rawValue !== "string") {
      throw new Error("Tipo invalido para " + field + ".");
    }

    const value = String(rawValue).trim();
    if (rule.required && !value) {
      throw new Error("Campo obligatorio vacio: " + field);
    }
    if (value.length > rule.maxLength) {
      throw new Error("Campo demasiado largo: " + field + ".");
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new Error("Formato invalido para " + field + ".");
    }

    validated[field] = value;
    return validated;
  }, {});
}

function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(getRequiredProperty(PROPERTY_KEYS.spreadsheetId));
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
  const payloadJson = JSON.stringify(payload);
  if (payloadJson.length > MAX_PAYLOAD_JSON_LENGTH) {
    throw new Error("Payload demasiado grande.");
  }
  return BASE_HEADERS.map((header) => data[header] || (header === "savedAt" ? savedAt : ""))
    .concat(fields.map((field) => payload[field] || ""))
    .concat([payloadJson]);
}

function getRequiredProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error("Falta configurar Script Property: " + key);
  }
  return value;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
