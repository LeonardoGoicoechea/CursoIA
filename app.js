const form = document.querySelector("#registrationForm");
const statusText = document.querySelector("#status");
const submitButton = form.querySelector('button[type="submit"]');
const installPanel = document.querySelector("#installPanel");
const installButton = document.querySelector("#installButton");
const installCopy = document.querySelector("#installCopy");

const CONFIG = window.COURSE_REGISTRATION_CONFIG || {};
const STORAGE_KEYS = {
  queue: "aiCourseRegistrationQueue",
  last: "aiCourseRegistrationLast"
};

let deferredInstallPrompt = null;
let syncing = false;

const uuid = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.queue) || "[]");
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
};

const setStatus = (message, tone = "info") => {
  statusText.textContent = message;
  statusText.dataset.tone = tone;
};

const normalizePayload = (formData) => ({
  submissionId: uuid(),
  fullName: String(formData.get("fullName") || "").trim(),
  email: String(formData.get("email") || "").trim().toLowerCase(),
  phone: String(formData.get("phone") || "").trim(),
  age: Number(formData.get("age")),
  level: String(formData.get("level") || "").trim(),
  mode: String(formData.get("mode") || "").trim(),
  goal: String(formData.get("goal") || "").trim(),
  consent: formData.get("consent") === "on",
  createdAt: new Date().toISOString(),
  source: "pwa"
});

const validatePayload = (payload) => {
  if (payload.fullName.length < 3) return "Ingresá un nombre válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Ingresá un correo válido.";
  if (!payload.phone) return "Ingresá un teléfono.";
  if (!Number.isInteger(payload.age) || payload.age < 13 || payload.age > 99) return "Ingresá una edad válida.";
  if (!payload.level || !payload.mode) return "Seleccioná nivel y modalidad.";
  if (payload.goal.length < 8) return "Contanos brevemente tu objetivo.";
  if (!payload.consent) return "Debés aceptar recibir información del curso.";
  return "";
};

const endpointConfigured = () =>
  typeof CONFIG.googleAppsScriptUrl === "string" && CONFIG.googleAppsScriptUrl.startsWith("https://");

const postToSheets = async (payload) => {
  if (!endpointConfigured()) throw new Error("Endpoint de Google Sheets sin configurar.");

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    Number(CONFIG.requestTimeoutMs) || 12000
  );

  try {
    const send = (mode = "cors") => fetch(CONFIG.googleAppsScriptUrl, {
      method: "POST",
      mode,
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        token: CONFIG.apiToken || "",
        payload
      }),
      signal: controller.signal
    });

    let response;
    try {
      response = await send("cors");
    } catch (error) {
      if (error.name === "AbortError") throw error;
      response = await send("no-cors");
    }

    if (response.type === "opaque") {
      return { ok: true, opaque: true };
    }

    const text = await response.text();
    let result = {};
    try {
      result = JSON.parse(text);
    } catch {
      result = { ok: response.ok };
    }

    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "No se pudo guardar en Google Sheets.");
    }

    return result;
  } finally {
    window.clearTimeout(timeout);
  }
};

const syncQueue = async () => {
  if (syncing || !endpointConfigured() || !navigator.onLine) return;
  syncing = true;

  const queue = readQueue();
  const remaining = [];

  for (const item of queue) {
    try {
      await postToSheets(item);
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  syncing = false;

  if (remaining.length === 0 && queue.length > 0) {
    setStatus("Registros pendientes sincronizados.", "success");
  }
};

const enqueue = (payload) => {
  const queue = readQueue();
  writeQueue([...queue.filter((item) => item.submissionId !== payload.submissionId), payload]);
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      setStatus("La app funciona, pero no se pudo activar el modo offline.", "warning");
    });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = normalizePayload(new FormData(form));
  const validationError = validatePayload(payload);
  if (validationError) {
    setStatus(validationError, "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  localStorage.setItem(STORAGE_KEYS.last, JSON.stringify(payload));

  try {
    await postToSheets(payload);
    form.reset();
    setStatus("Registro guardado en Google Sheets.", "success");
    await syncQueue();
  } catch (error) {
    enqueue(payload);
    form.reset();
    const reason = endpointConfigured() ? "Se sincronizará cuando vuelva la conexión." : "Configurá Google Sheets para sincronizar.";
    setStatus(`Registro guardado localmente. ${reason}`, "warning");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar registro";
  }
});

window.addEventListener("online", syncQueue);
window.addEventListener("load", syncQueue);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const platform = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  const iOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = ua.includes("android");
  const windows = ua.includes("windows");
  return { iOS, android, windows };
};

const showInstallPanel = (copy, buttonText = "Instalar") => {
  if (!installPanel || isStandalone()) return;
  installCopy.textContent = copy;
  installButton.textContent = buttonText;
  installPanel.hidden = false;
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const { android, windows } = platform();
  const device = android ? "Android" : windows ? "Windows" : "este dispositivo";
  showInstallPanel(`Instala la app en ${device} para abrirla desde tu pantalla de inicio.`, "Instalar");
});

installButton?.addEventListener("click", async () => {
  const { iOS } = platform();

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice.outcome === "accepted") installPanel.hidden = true;
    return;
  }

  if (iOS) {
    showInstallPanel("En iPhone o iPad: toca Compartir y despues Agregar a pantalla de inicio.", "Listo");
    return;
  }

  showInstallPanel("Abri el menu del navegador y elegi Instalar app o Agregar a pantalla de inicio.", "Entendido");
});

window.addEventListener("appinstalled", () => {
  if (installPanel) installPanel.hidden = true;
});

if (!isStandalone()) {
  const { iOS } = platform();
  if (iOS) showInstallPanel("En iPhone o iPad: toca Compartir y despues Agregar a pantalla de inicio.", "Ver pasos");
}
