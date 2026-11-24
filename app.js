// Time Capsule behavior. Plain JavaScript only — no frameworks, no CSS.
// Capsules are kept in localStorage so they survive a page refresh.

const STORAGE_KEY = "timeCapsule.capsules";

const form = document.getElementById("capsule-form");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("open-date");
const messageInput = document.getElementById("message");
const errorOutput = document.getElementById("form-error");
const list = document.getElementById("capsule-list");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("capsule-count");

// References to the live parts of each capsule, so the countdown tick can
// update a capsule without rebuilding (and closing) the whole list.
const rendered = new Map();

// --- storage --------------------------------------------------------------

function loadCapsules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read capsules:", err);
    return [];
  }
}

function saveCapsules(capsules) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  } catch (err) {
    console.warn("Could not save capsules:", err);
  }
}

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `capsule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- formatting helpers ---------------------------------------------------

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatLongDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// --- countdown + progress -------------------------------------------------

function isUnlocked(capsule, now) {
  return now >= capsule.openTime;
}

function countdownText(remainingMs) {
  const totalSeconds = Math.floor(Math.max(0, remainingMs) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function capsuleProgress(capsule, now) {
  const total = capsule.openTime - capsule.sealedAt;
  if (total <= 0 || now >= capsule.openTime) return 100;
  const done = now - capsule.sealedAt;
  return Math.round((done / total) * 100);
}

// --- rendering ------------------------------------------------------------

function buildBody(container, capsule, reveal) {
  container.replaceChildren();

  if (!reveal) {
    const notice = document.createElement("p");
    notice.textContent = `🔒 Sealed. The message stays hidden until ${formatLongDate(capsule.openDate)}.`;
    container.append(notice);
    return;
  }

  // Only now does the message actually make it onto the page.
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Open message";
  const message = document.createElement("p");
  message.textContent = capsule.message;
  details.append(summary, message);
  container.append(details);
}

function renderCapsule(capsule) {
  const li = document.createElement("li");

  const heading = document.createElement("h3");
  heading.textContent = capsule.title;

  const meta = document.createElement("p");
  meta.textContent = `Sealed ${new Date(capsule.sealedAt).toLocaleString()} · opens ${formatLongDate(capsule.openDate)}`;

  const countdown = document.createElement("strong");
  const countdownLine = document.createElement("p");
  countdownLine.append(countdown);

  const progressLabel = document.createElement("p");
  progressLabel.textContent = "Progress toward opening:";
  const progress = document.createElement("progress");
  progress.max = 100;
  progress.value = 0;

  const body = document.createElement("div");

  li.append(heading, meta, countdownLine, progressLabel, progress, body);
  return { node: li, countdown, progress, body };
}

function renderCapsules() {
  const capsules = loadCapsules();
  const now = Date.now();

  list.replaceChildren();
  rendered.clear();

  capsules.forEach((capsule) => {
    const reveal = isUnlocked(capsule, now);
    const view = renderCapsule(capsule);
    buildBody(view.body, capsule, reveal);
    list.append(view.node);
    rendered.set(capsule.id, { capsule, ...view, revealed: reveal });
  });

  countLabel.textContent = capsules.length ? ` (${capsules.length})` : "";
  emptyState.hidden = capsules.length > 0;
}

// --- the one-second tick --------------------------------------------------

function updateView(view, now) {
  const { capsule } = view;
  if (isUnlocked(capsule, now)) {
    view.countdown.textContent = "Unlocked";
    view.progress.value = 100;
    return;
  }
  view.countdown.textContent = `Unlocks in ${countdownText(capsule.openTime - now)}`;
  view.progress.value = capsuleProgress(capsule, now);
}

function tick() {
  const now = Date.now();
  rendered.forEach((view) => {
    if (isUnlocked(view.capsule, now) && !view.revealed) {
      // Reaching the opening date is the moment we swap in the message.
      view.revealed = true;
      buildBody(view.body, view.capsule, true);
    }
    updateView(view, now);
  });
}

// --- sealing -------------------------------------------------------------

function handleSubmit(event) {
  event.preventDefault();

  const capsule = {
    id: makeId(),
    title: titleInput.value.trim(),
    message: messageInput.value.trim(),
    openDate: dateInput.value,
    sealedAt: Date.now(),
    openTime: new Date(`${dateInput.value}T00:00:00`).getTime(),
  };

  const capsules = loadCapsules();
  capsules.push(capsule);
  saveCapsules(capsules);

  renderCapsules();
  form.reset();
  titleInput.focus();
}

function init() {
  dateInput.min = todayString();
  form.addEventListener("submit", handleSubmit);
  renderCapsules();
  tick();
  setInterval(tick, 1000);
}

init();
