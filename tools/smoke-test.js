const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const config = fs.readFileSync("config.js", "utf8");
const serviceWorker = fs.readFileSync("sw.js", "utf8");
const appsScript = fs.readFileSync("scripts/google-apps-script.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const readme = fs.readFileSync("README.md", "utf8");

const expectedModules = [
  "profile",
  "thermometer1",
  "thermometer2",
  "case",
  "flow",
  "experiment",
  "manifesto"
];

const moduleFields = {
  profile: ["fullName", "email", "phone", "age", "role", "industry", "aiExperience", "participantType", "personalGoal", "consent"],
  thermometer1: ["repetitiveTasks", "frequency", "weeklyTime", "energyDrain", "delegationRisk", "humanCriteria"],
  thermometer2: ["fearLagging", "fearBadDelegation", "overload", "experimentConfidence", "opportunity"],
  case: ["realProblem", "context", "currentInput", "expectedOutput", "aiAssistance", "humanDecision", "aiBoundary", "risks"],
  flow: ["currentFlow", "newFlow", "delegatedStep", "supervisedStep", "preservedStep", "improvementMetric"],
  experiment: ["testedAction", "toolUsed", "timeBefore", "timeAfter", "result", "humanCorrections", "learning", "nextAdjustment"],
  manifesto: ["willDelegate", "willPreserve", "ethicalLimit", "verificationPractice", "thirtyDayCommitment", "signature"]
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formFor(moduleId) {
  const match = html.match(new RegExp(`<form[^>]+data-module="${moduleId}"[\\s\\S]*?<\\/form>`));
  assert(match, `Missing form for ${moduleId}`);
  return match[0];
}

for (const moduleId of expectedModules) {
  const form = formFor(moduleId);
  assert(form.includes('type="submit"'), `${moduleId} form has no submit button`);

  for (const field of moduleFields[moduleId]) {
    assert(form.includes(`name="${field}"`), `${moduleId} form missing ${field}`);

    const fieldTag = form.match(new RegExp(`<(?:input|textarea)[^>]+name="${field}"[^>]*>`));
    if (fieldTag) {
      const tag = fieldTag[0];
      const type = ((tag.match(/\btype=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/) || []).slice(1).find(Boolean) || "text").toLowerCase();
      const textLike = tag.startsWith("<textarea") || ["text", "email", "tel", "search", "url", "password"].includes(type);
      if (textLike) {
        assert(tag.includes("maxlength="), `${field} is missing maxlength`);
      }
    }
  }
}

assert(!html.includes("sync-config-panel"), "Sync config panel should not be rendered");
assert(html.includes("id=\"exportPendingButton\""), "Missing pending export button");
assert(html.includes("No ingreses nombres reales"), "Missing global privacy warning");

assert(app.includes("localStorage.setItem"), "app.js does not persist locally");
assert(app.includes("safeSetItem"), "app.js must guard localStorage writes");
assert(app.includes("safeGetItem"), "app.js must guard localStorage reads");
assert(app.includes("isPermanentSyncError"), "app.js must classify permanent sync errors");
assert(app.includes("error sync"), "app.js must expose permanent sync error state");
assert(app.includes("fetch("), "app.js does not sync with fetch");
assert(app.includes("AbortController"), "app.js does not enforce request timeout");
assert(app.includes("navigator.serviceWorker.register"), "app.js does not register service worker");
assert(!app.includes("syncAccessState"), "app.js must not reference removed sync state UI");
assert(!app.includes("google.accounts.id"), "app.js must not require Google Sign-In");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(config, sandbox);

const cfg = sandbox.window.COURSE_REGISTRATION_CONFIG;
assert(cfg.googleAppsScriptUrl.startsWith("https://"), "googleAppsScriptUrl must be https");
assert(cfg.googleAppsScriptUrl.endsWith("/exec"), "googleAppsScriptUrl must end with /exec");
assert(!Object.prototype.hasOwnProperty.call(cfg, "googleClientId"), "config.js must not require googleClientId");
assert(!Object.prototype.hasOwnProperty.call(cfg, "apiToken"), "config.js must not hardcode apiToken");
assert(Number.isInteger(cfg.requestTimeoutMs) && cfg.requestTimeoutMs >= 5000, "requestTimeoutMs is too low");
assert(serviceWorker.includes(`cursoia-v${cfg.appVersion}`), "sw.js CACHE_NAME must match config appVersion");
assert(serviceWorker.includes("fetch(event.request)"), "sw.js must try network before cached assets");
assert(!serviceWorker.includes("return cached || networkFetch"), "sw.js must not serve cache-first app assets");
assert(app.includes("migrateLocalState"), "app.js must migrate local storage schema");
assert(appsScript.includes("FORMULA_PREFIX_PATTERN"), "Apps Script must guard against formula injection");
assert(appsScript.includes("submissionExists"), "Apps Script must deduplicate submissionId retries");
assert(appsScript.includes("allowed:"), "Apps Script must validate closed-list values");
assert(manifest.includes("Bitacora PWA"), "manifest description must match current app purpose");
assert(!readme.includes("panel superior indique acceso abierto"), "README references removed open-access panel");

console.log("Smoke test passed");
