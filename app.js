// Time Capsule behavior. Plain JavaScript only — no frameworks, no CSS.
// Capsules are kept in localStorage so they survive a page refresh.

const STORAGE_KEY = "timeCapsule.capsules";

const form = document.getElementById("capsule-form");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("open-date");
const messageInput = document.getElementById("message");
const list = document.getElementById("capsule-list");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("capsule-count");

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

// --- rendering ------------------------------------------------------------

function renderCapsule(capsule) {
  const li = document.createElement("li");

  const heading = document.createElement("h3");
  heading.textContent = capsule.title;

  const meta = document.createElement("p");
  meta.textContent = `Sealed ${new Date(capsule.sealedAt).toLocaleString()} · opens ${formatLongDate(capsule.openDate)}`;

  // The message stays off the page entirely until its opening date arrives.
  const sealed = document.createElement("p");
  sealed.textContent = `🔒 Sealed. The message stays hidden until ${formatLongDate(capsule.openDate)}.`;

  li.append(heading, meta, sealed);
  return li;
}

function renderCapsules() {
  const capsules = loadCapsules();
  list.replaceChildren();
  capsules.forEach((capsule) => list.append(renderCapsule(capsule)));

  countLabel.textContent = capsules.length ? ` (${capsules.length})` : "";
  emptyState.hidden = capsules.length > 0;
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
}

init();
