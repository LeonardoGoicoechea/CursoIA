const CONFIG = window.COURSE_REGISTRATION_CONFIG || {};

const MODULES = [
  { id: "profile", label: "Perfil", sheet: "Perfiles" },
  { id: "thermometer1", label: "Termometro 1", sheet: "Termometro1" },
  { id: "thermometer2", label: "Termometro 2", sheet: "Termometro2" },
  { id: "case", label: "Caso real", sheet: "CasosReales" },
  { id: "flow", label: "Flujo IA + humano", sheet: "Flujos" },
  { id: "experiment", label: "Experimento", sheet: "Experimentos" },
  { id: "manifesto", label: "Manifiesto", sheet: "Manifiestos" }
];

const MODULE_SEQUENCE = [
  "profile",
  "thermometer1",
  "thermometer2",
  "case",
  "flow",
  "experiment",
  "manifesto",
  "summary"
];

const STORAGE_KEYS = {
  participantId: "cursoiaParticipantId",
  modules: "cursoiaModules",
  queue: "cursoiaQueue",
  audience: "cursoiaAudience"
};

const statusEl = document.querySelector("#status");
const progressCountEl = document.querySelector("#progressCount");
const summaryListEl = document.querySelector("#summaryList");
const installButton = document.querySelector("#installButton");
const syncButton = document.querySelector("#syncButton");
const resetButton = document.querySelector("#resetButton");
const captureCopyEl = document.querySelector("#captureCopy");
const navLinks = [...document.querySelectorAll("[data-target]")];
const views = [...document.querySelectorAll("[data-module-view]")];

let deferredInstallPrompt = null;
let syncing = false;

const captureCopy = {
  leader: {
    title: "El peligro de inundar a tu equipo con IA sin darles una estrategia.",
    problem: "Llenar la empresa de herramientas nuevas solo genera presion por usarlas o miedo a quedar obsoletos.",
    agitation: "Mandar a tu gente a cursos de prompts aislados no alcanza. El equipo necesita criterio para saber que delegar y que preservar.",
    solution: "Un taller practico de 3 encuentros para pasar de la urgencia a una adopcion con foco, medicion y responsabilidad humana."
  },
  professional: {
    title: "Corriendo detras de la tecnologia o liderando tu espacio de trabajo?",
    problem: "Sentir que todos avanzan mas rapido con IA mientras seguis tapado de tareas repetitivas es el nuevo desgaste laboral.",
    agitation: "La solucion no es acumular herramientas. El valor aparece cuando usas IA para recuperar tiempo de pensar, crear y decidir.",
    solution: "Un recorrido para revisar tus tareas reales, disenar experimentos seguros y mejorar tu flujo sin perder control."
  }
};

const nowIso = () => new Date().toISOString();

const createId = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getParticipantId = () => {
  const existing = localStorage.getItem(STORAGE_KEYS.participantId);
  if (existing) return existing;
  const created = createId();
  localStorage.setItem(STORAGE_KEYS.participantId, created);
  return created;
};

const setStatus = (message, tone = "info") => {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`;
};

const endpointConfigured = () =>
  typeof CONFIG.googleAppsScriptUrl === "string" && CONFIG.googleAppsScriptUrl.startsWith("https://");

const moduleMeta = (moduleId) => MODULES.find((item) => item.id === moduleId);

const viewLabel = (viewId) => {
  const link = navLinks.find((item) => item.dataset.target === viewId);
  return link ? link.textContent.trim() : "siguiente etapa";
};

const nextViewForModule = (moduleId) => {
  const index = MODULE_SEQUENCE.indexOf(moduleId);
  return index >= 0 ? MODULE_SEQUENCE[index + 1] : "";
};

const isModuleComplete = (state) =>
  state?.status === "completed" && ["synced", "pending", "local"].includes(state?.syncStatus);

const firstPendingView = () => {
  const modules = readModules();
  return MODULE_SEQUENCE.find((viewId) => {
    if (viewId === "summary") return false;
    return !isModuleComplete(modules[viewId]);
  }) || "summary";
};

const isViewAvailable = (viewId) => {
  if (viewId === "welcome") return true;
  if (viewId === "summary") return firstPendingView() === "summary";
  const pending = firstPendingView();
  const viewIndex = MODULE_SEQUENCE.indexOf(viewId);
  const pendingIndex = MODULE_SEQUENCE.indexOf(pending);
  return viewIndex >= 0 && viewIndex <= pendingIndex;
};

const scrollToViewStart = (viewId) => {
  const view = views.find((item) => item.dataset.moduleView === viewId);
  const target = view || document.querySelector(".workspace");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const readModules = () => readJson(STORAGE_KEYS.modules, {});

const writeModuleState = (moduleId, patch) => {
  const modules = readModules();
  modules[moduleId] = {
    ...(modules[moduleId] || { status: "pending" }),
    ...patch,
    updatedAt: nowIso()
  };
  writeJson(STORAGE_KEYS.modules, modules);
  renderProgress();
};

const readQueue = () => readJson(STORAGE_KEYS.queue, []);

const writeQueue = (queue) => {
  writeJson(STORAGE_KEYS.queue, queue);
  renderProgress();
};

const compactQueue = (queue) => {
  const modules = readModules();
  const latestByModule = new Map();

  queue.forEach((item) => {
    if (!item?.module) return;
    if (modules[item.module]?.syncStatus === "synced") return;
    latestByModule.set(item.module, item);
  });

  return [...latestByModule.values()];
};

const refreshStoredQueue = () => {
  const queue = readQueue();
  const compacted = compactQueue(queue);
  if (compacted.length !== queue.length) {
    writeQueue(compacted);
  }
  return compacted;
};

const enqueue = (envelope) => {
  const queue = compactQueue(readQueue());
  writeQueue([...queue.filter((item) => item.module !== envelope.module), envelope]);
  writeModuleState(envelope.module, { status: "completed", syncStatus: "pending" });
};

const formToPayload = (form) => {
  const payload = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    payload[key] = value === "true" ? true : String(value).trim();
  }
  return payload;
};

const fillForm = (form, payload = {}) => {
  [...form.elements].forEach((field) => {
    if (!field.name) return;
    field.value = payload[field.name] ?? field.defaultValue ?? "";
  });
};

const buildEnvelope = (moduleId, payload) => {
  const submissionId = createId();
  const participantId = getParticipantId();
  const timestamp = nowIso();
  const appVersion = CONFIG.appVersion || "1.0.0";
  const storedProfile = readModules().profile?.payload || {};
  const basePayload = moduleId === "profile" ? payload : storedProfile;
  const acceptedConsent = payload.consent === true || basePayload.consent === true;
  const compatibilityPayload = {
    ...basePayload,
    ...payload,
    submissionId,
    participantId,
    module: moduleId,
    timestamp,
    appVersion,
    fullName: payload.fullName || basePayload.fullName || payload.name || basePayload.name || "",
    email: payload.email || basePayload.email || "",
    phone: payload.phone || basePayload.phone || "",
    age: payload.age || basePayload.age || "",
    name: payload.fullName || basePayload.fullName || payload.name || basePayload.name || "",
    mode: payload.participantType || payload.mode || basePayload.participantType || basePayload.mode || "",
    goal: payload.personalGoal || payload.goal || basePayload.personalGoal || basePayload.goal || "",
    level: payload.aiExperience || payload.level || basePayload.aiExperience || basePayload.level || "",
    nivel: payload.aiExperience || payload.nivel || basePayload.aiExperience || basePayload.nivel || "",
    modality: payload.participantType || payload.modality || basePayload.participantType || basePayload.modality || "",
    modalidad: payload.participantType || payload.modalidad || basePayload.participantType || basePayload.modalidad || "",
    consent: acceptedConsent,
    consentimiento: acceptedConsent
  };

  return {
    submissionId,
    module: moduleId,
    participantId,
    timestamp,
    appVersion,
    consent: compatibilityPayload.consent,
    consentimiento: compatibilityPayload.consentimiento,
    payload: compatibilityPayload
  };
};

const prepareQueuedEnvelope = (envelope) => {
  const modulePayload = readModules()[envelope.module]?.payload || envelope.payload || {};
  const rebuilt = buildEnvelope(envelope.module, modulePayload);
  return {
    ...rebuilt,
    submissionId: envelope.submissionId || rebuilt.submissionId,
    timestamp: envelope.timestamp || rebuilt.timestamp
  };
};

const validateForm = (form) => {
  if (!form.reportValidity()) return false;
  return true;
};

const sendEnvelope = async (envelope) => {
  if (!endpointConfigured()) throw new Error("Endpoint no configurado.");

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    Number(CONFIG.requestTimeoutMs) || 12000
  );

  try {
    const response = await fetch(CONFIG.googleAppsScriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: CONFIG.apiToken || "",
        ...envelope
      }),
      signal: controller.signal
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "No se pudo guardar en Google Sheets.");
    }
    return result;
  } finally {
    window.clearTimeout(timeout);
  }
};

const syncQueue = async () => {
  if (syncing || !navigator.onLine || !endpointConfigured()) return;
  const queue = refreshStoredQueue().map(prepareQueuedEnvelope);
  if (queue.length === 0) return;

  syncing = true;
  const remaining = [];

  for (const item of queue) {
    if (readModules()[item.module]?.syncStatus === "synced") continue;

    try {
      await sendEnvelope(item);
      writeModuleState(item.module, {
        status: "completed",
        syncStatus: "synced",
        syncedAt: nowIso()
      });
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  syncing = false;

  if (remaining.length === 0) {
    setStatus("Registros pendientes sincronizados.", "success");
  } else {
    setStatus(`Quedan ${remaining.length} envios pendientes de sincronizar.`, "warning");
  }
};

const saveModule = async (moduleId, payload) => {
  const meta = moduleMeta(moduleId);
  if (!meta) throw new Error("Modulo desconocido.");

  writeModuleState(moduleId, {
    status: "completed",
    syncStatus: "local",
    payload
  });

  if (moduleId === "profile") {
    localStorage.setItem(STORAGE_KEYS.participantId, getParticipantId());
  }

  const envelope = buildEnvelope(moduleId, payload);

  try {
    await sendEnvelope(envelope);
    writeModuleState(moduleId, {
      status: "completed",
      syncStatus: "synced",
      payload,
      syncedAt: nowIso()
    });
    setStatus(`${meta.label} guardado y sincronizado.`, "success");
    await syncQueue();
  } catch (error) {
    enqueue(envelope);
    const reason = navigator.onLine ? error.message : "Sin conexion.";
    setStatus(`${meta.label} guardado localmente. ${reason}`, "warning");
  }
};

const showView = (viewId) => {
  if (!isViewAvailable(viewId)) {
    viewId = firstPendingView();
  }
  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.moduleView === viewId);
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === viewId);
  });
  hideContinueButtons();
  renderSummary();
};

const goToView = (viewId) => {
  const link = navLinks.find((item) => item.dataset.target === viewId);
  if (!link) return;
  showView(viewId);
  history.replaceState(null, "", link.getAttribute("href"));
  scrollToViewStart(viewId);
};

const showContinueFor = (moduleId) => {
  const nextView = firstPendingView();
  if (!nextView) return;
  const form = document.querySelector(`.module-form[data-module="${moduleId}"]`);
  const button = form?.querySelector(".inline-continue-action");
  if (!button) return;
  if (nextView === "summary" && moduleId === "manifesto") {
    button.textContent = "Ver cierre";
  } else if (nextView === moduleId) {
    button.hidden = true;
    return;
  } else {
    button.textContent = `Siguiente: ${viewLabel(nextView)}`;
  }
  button.dataset.target = nextView;
  button.hidden = false;
};

const hideContinueButtons = () => {
  document.querySelectorAll(".inline-continue-action").forEach((button) => {
    button.hidden = true;
  });
};

const prepareInlineContinueButtons = () => {
  document.querySelectorAll(".module-form").forEach((form) => {
    const submitButton = form.querySelector("button[type='submit']");
    if (!submitButton || form.querySelector(".inline-continue-action")) return;

    const row = document.createElement("div");
    row.className = "form-submit-row";
    submitButton.before(row);
    row.append(submitButton);

    const continueAction = document.createElement("button");
    continueAction.className = "continue-action inline-continue-action";
    continueAction.type = "button";
    continueAction.hidden = true;
    continueAction.textContent = "Siguiente";
    continueAction.addEventListener("click", () => {
      if (continueAction.dataset.target) goToView(continueAction.dataset.target);
    });
    row.append(continueAction);
  });
};

const renderCaptureCopy = () => {
  const audience = localStorage.getItem(STORAGE_KEYS.audience) || "leader";
  const copy = captureCopy[audience];
  captureCopyEl.innerHTML = `
    <h3>${copy.title}</h3>
    <p><strong>Problema:</strong> ${copy.problem}</p>
    <p><strong>Agitacion:</strong> ${copy.agitation}</p>
    <p><strong>Solucion:</strong> ${copy.solution}</p>
  `;
  document.querySelectorAll("[data-audience]").forEach((button) => {
    button.classList.toggle("active", button.dataset.audience === audience);
  });
};

const stateLabel = (state) => {
  if (!state) return "pendiente";
  if (state.syncStatus === "synced") return "sincronizado";
  if (state.syncStatus === "pending") return "pendiente sync";
  if (state.status === "completed") return "local";
  return "pendiente";
};

const renderProgress = () => {
  const modules = readModules();
  const completed = MODULES.filter((item) => modules[item.id]?.status === "completed").length;
  progressCountEl.textContent = `${completed}/${MODULES.length}`;

  navLinks.forEach((link) => {
    const moduleId = link.dataset.target;
    const state = modules[moduleId];
    const available = isViewAvailable(moduleId);
    link.dataset.state = !available
      ? "bloqueado"
      : MODULES.some((item) => item.id === moduleId)
        ? stateLabel(state)
        : "";
    link.classList.toggle("locked", !available);
    link.setAttribute("aria-disabled", String(!available));
  });

  renderSummary();
};

const renderSummary = () => {
  if (!summaryListEl) return;
  const modules = readModules();
  summaryListEl.innerHTML = MODULES.map((item) => {
    const state = modules[item.id];
    const label = stateLabel(state);
    const badgeClass = state?.syncStatus === "synced" ? "synced" : state?.status === "completed" ? "pending" : "";
    return `
      <div class="summary-item">
        <div>
          <strong>${item.label}</strong>
          <span>${state?.updatedAt ? `Ultima actualizacion: ${new Date(state.updatedAt).toLocaleString()}` : "Sin completar"}</span>
        </div>
        <span class="badge ${badgeClass}">${label}</span>
      </div>
    `;
  }).join("");
};

const hydrateForms = () => {
  const modules = readModules();
  document.querySelectorAll(".module-form").forEach((form) => {
    const moduleId = form.dataset.module;
    fillForm(form, modules[moduleId]?.payload);
  });
};

document.querySelectorAll(".module-form").forEach((form) => {
  form.addEventListener("input", () => {
    const moduleId = form.dataset.module;
    writeModuleState(moduleId, {
      status: "started",
      syncStatus: "local",
      payload: formToPayload(form)
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm(form)) return;

    const submitButton = form.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Guardando...";

    try {
      await saveModule(form.dataset.module, formToPayload(form));
      showContinueFor(form.dataset.module);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!isViewAvailable(link.dataset.target)) {
      goToView(firstPendingView());
      return;
    }
    goToView(link.dataset.target);
  });
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.jump));
});

document.querySelectorAll("[data-audience]").forEach((button) => {
  button.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEYS.audience, button.dataset.audience);
    renderCaptureCopy();
  });
});

syncButton?.addEventListener("click", syncQueue);

resetButton?.addEventListener("click", () => {
  const confirmed = window.confirm("Esto borra los datos locales de este dispositivo. Continuar?");
  if (!confirmed) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  getParticipantId();
  hydrateForms();
  renderProgress();
  setStatus("Datos locales reiniciados.", "warning");
});

window.addEventListener("online", syncQueue);
window.addEventListener("load", syncQueue);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
  if (choice.outcome === "accepted") {
    setStatus("App instalada.", "success");
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      setStatus("La app funciona, pero no se pudo activar el modo offline.", "warning");
    });
  });
}

getParticipantId();
prepareInlineContinueButtons();
renderCaptureCopy();
hydrateForms();
refreshStoredQueue();
renderProgress();

const initialHash = window.location.hash.replace("#", "");
const initialView = views.find((view) => view.id === initialHash)?.dataset.moduleView || "welcome";
const resolvedInitialView = isViewAvailable(initialView) ? initialView : firstPendingView();
showView(resolvedInitialView);
if (resolvedInitialView !== initialView) {
  const link = navLinks.find((item) => item.dataset.target === resolvedInitialView);
  if (link) history.replaceState(null, "", link.getAttribute("href"));
}
