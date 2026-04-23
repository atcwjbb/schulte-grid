const difficulties = [
  { size: 3, name: "入门" },
  { size: 4, name: "初级" },
  { size: 5, name: "标准" },
  { size: 6, name: "进阶" },
  { size: 7, name: "挑战" },
];

const storageKey = "schulte-grid-best-times";
const settingsKey = "schulte-grid-settings";
const defaultSettings = {
  boardSize: "medium",
  theme: "forest",
};

const pigThresholds = {
  3: 5000,
  4: 10000,
  5: 20000,
  6: 40000,
  7: 70000,
};

const pigMessages = {
  idle: "要被自己蠢哭了",
  crying: "擦干泪不要怕",
  happy: "继续前进吧！",
};

const ornamentSets = {
  forest: [
    { type: "leaf", x: 4, y: 18, size: 70, avoid: true },
    { type: "leaf", x: 93, y: 17, size: 54, interactive: true },
    { type: "leaf", x: 6, y: 86, size: 46, avoid: true },
    { type: "branch", x: 90, y: 84, size: 116 },
    { type: "branch", x: 5, y: 38, size: 92, interactive: true },
    { type: "bird", x: 82, y: 11, size: 48, avoid: true },
    { type: "butterfly", x: 30, y: 92, size: 44, interactive: true },
    { type: "seed", x: 93, y: 48, size: 34, avoid: true },
    { type: "seed", x: 3, y: 64, size: 28, interactive: true },
  ],
  ocean: [
    { type: "wave", x: 5, y: 21, size: 90, avoid: true },
    { type: "wave", x: 90, y: 86, size: 116 },
    { type: "fish", x: 7, y: 76, size: 58, interactive: true },
    { type: "fish", x: 92, y: 19, size: 48, avoid: true },
    { type: "shell", x: 86, y: 9, size: 48, interactive: true },
    { type: "bubble", x: 24, y: 11, size: 34, avoid: true },
    { type: "bubble", x: 93, y: 55, size: 26, interactive: true },
    { type: "coral", x: 4, y: 90, size: 54 },
    { type: "starfish", x: 65, y: 93, size: 42, interactive: true },
  ],
  sun: [
    { type: "sun-disc", x: 7, y: 20, size: 80, interactive: true },
    { type: "ray", x: 90, y: 15, size: 108, avoid: true },
    { type: "cloud", x: 7, y: 78, size: 88 },
    { type: "spark", x: 82, y: 13, size: 42, interactive: true },
    { type: "spark", x: 93, y: 62, size: 34, avoid: true },
    { type: "petal", x: 31, y: 92, size: 52, interactive: true },
    { type: "petal", x: 3, y: 50, size: 38, avoid: true },
    { type: "halo", x: 62, y: 93, size: 64 },
    { type: "ray", x: 20, y: 13, size: 64, interactive: true },
  ],
  night: [
    { type: "moon", x: 5, y: 18, size: 72, interactive: true },
    { type: "star", x: 92, y: 18, size: 44, avoid: true },
    { type: "star", x: 7, y: 79, size: 34, interactive: true },
    { type: "comet", x: 90, y: 74, size: 96, avoid: true },
    { type: "cloud-night", x: 24, y: 10, size: 86 },
    { type: "moth", x: 82, y: 11, size: 44, interactive: true },
    { type: "spark", x: 93, y: 52, size: 28, interactive: true },
    { type: "moon", x: 3, y: 57, size: 42, avoid: true },
    { type: "star", x: 53, y: 93, size: 30 },
  ],
};

const app = document.querySelector("#app");
const eyebrow = document.querySelector(".eyebrow");
const homeTitle = document.querySelector("#homeTitle");
const settingsButton = document.querySelector("#settingsButton");
const settingsPanel = document.querySelector("#settingsPanel");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const boardSizeOptions = document.querySelector("#boardSizeOptions");
const themeOptions = document.querySelector("#themeOptions");
const homeOrnaments = document.querySelector("#homeOrnaments");
const catchCursor = document.querySelector("#catchCursor");
const state = {
  size: 5,
  target: 1,
  total: 25,
  startTime: 0,
  elapsed: 0,
  timerFrame: 0,
  active: false,
  running: false,
  assistUsed: false,
  pigMood: "hidden",
  lastPointer: { x: 0, y: 0 },
  isTouch: false,
  isMobileLayout: false,
  settings: { ...defaultSettings },
};

const difficultyView = document.querySelector("#difficultyView");
const difficultyGrid = document.querySelector("#difficultyGrid");
const gameView = document.querySelector("#gameView");
const resultView = document.querySelector("#resultView");
const backButton = document.querySelector("#backButton");
const board = document.querySelector("#board");
const timer = document.querySelector("#timer");
const assistNote = document.querySelector("#assistNote");
const resultTime = document.querySelector("#resultTime");
const resultBest = document.querySelector("#resultBest");
const retryButton = document.querySelector("#retryButton");
const chooseButton = document.querySelector("#chooseButton");
const creditNote = document.querySelector("#creditNote");
const pigAlert = document.querySelector("#pigAlert");
const pigMessage = document.querySelector("#pigMessage");

function readBestTimes() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function writeBestTimes(bestTimes) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(bestTimes));
  } catch {
    // Best times are a convenience; gameplay should continue if storage is unavailable.
  }
}

function readSettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(settingsKey)) || {};
    return { ...defaultSettings, ...savedSettings };
  } catch {
    return { ...defaultSettings };
  }
}

function writeSettings() {
  try {
    localStorage.setItem(settingsKey, JSON.stringify(state.settings));
  } catch {
    // Settings are optional; defaults keep the game usable.
  }
}

function formatTime(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "--";
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

function getBest(size) {
  return readBestTimes()[size];
}

function shuffle(values) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function show(view) {
  app.classList.toggle("is-home", view === "difficulty");
  difficultyView.classList.toggle("is-hidden", view !== "difficulty");
  gameView.classList.toggle("is-hidden", view !== "game");
  resultView.classList.toggle("is-hidden", view !== "result");
  backButton.classList.toggle("is-hidden", view === "difficulty");
}

function syncViewportMode() {
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;
  const isMobileLayout = window.matchMedia("(max-width: 720px)").matches;

  state.isTouch = isTouch;
  state.isMobileLayout = isMobileLayout;
  app.classList.toggle("is-touch", isTouch);
  app.classList.toggle("is-mobile-layout", isMobileLayout);
}

function setActiveOption(container, attribute, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset[attribute] === value);
  });
}

function applyOrnaments(theme) {
  const ornaments = ornamentSets[theme] || ornamentSets.forest;
  homeOrnaments.innerHTML = "";

  ornaments.forEach((ornament, index) => {
    const element = document.createElement(ornament.interactive ? "button" : "span");
    const visualSize = Math.round(ornament.size * 1.14);
    const safeX = Math.min(93, Math.max(7, ornament.x));
    const safeY = Math.min(94, Math.max(6, ornament.y));
    element.className = `ornament ornament-${ornament.type}`;
    element.style.setProperty("--x", `${safeX}%`);
    element.style.setProperty("--y", `${safeY}%`);
    element.style.setProperty("--s", `${visualSize}px`);
    element.style.setProperty("--delay", `${index * -0.42}s`);
    element.style.setProperty("--base-rotate", `${(index % 5) * 9 - 18}deg`);

    if (ornament.avoid) element.classList.add("is-avoid");
    if (ornament.interactive) {
      element.type = "button";
      element.classList.add("is-interactive");
      element.dataset.collected = "false";
      element.setAttribute("aria-label", "互动漂浮物");
    }

    element.innerHTML = '<span class="shape"></span>';
    homeOrnaments.append(element);
  });
}

function applySettings() {
  resetCatchCursor();
  app.dataset.boardSize = state.settings.boardSize;
  document.body.dataset.theme = state.settings.theme;
  setActiveOption(boardSizeOptions, "boardSize", state.settings.boardSize);
  setActiveOption(themeOptions, "theme", state.settings.theme);
  applyOrnaments(state.settings.theme);
}

function resetCatchCursor() {
  app.classList.remove("is-catching");
}

function resetPigAlert() {
  pigAlert.classList.add("is-hidden");
  pigAlert.classList.remove("is-crying", "is-happy");
  state.pigMood = "hidden";
  pigMessage.textContent = pigMessages.idle;
}

function showPigAlert() {
  pigAlert.classList.remove("is-hidden");
  pigAlert.classList.remove("is-crying", "is-happy");
  state.pigMood = "idle";
  pigMessage.textContent = pigMessages.idle;
}

function renderDifficulties() {
  const bestTimes = readBestTimes();
  difficultyGrid.innerHTML = "";

  difficulties.forEach((difficulty) => {
    const button = document.createElement("button");
    button.className = "difficulty-card";
    button.type = "button";
    button.style.setProperty("--grid-lines", difficulty.size);
    button.innerHTML = `
      <span class="difficulty-size">${difficulty.size}x${difficulty.size}</span>
      <span class="difficulty-name">${difficulty.name}</span>
      <span class="difficulty-best">最佳 ${formatTime(bestTimes[difficulty.size])}</span>
    `;
    button.addEventListener("click", () => startGame(difficulty.size));
    difficultyGrid.append(button);
  });
}

function startTimer() {
  state.running = true;
  state.startTime = performance.now();
  state.elapsed = 0;
  cancelAnimationFrame(state.timerFrame);

  const tick = () => {
    if (!state.running) return;
    state.elapsed = performance.now() - state.startTime;
    timer.textContent = formatTime(state.elapsed);
    state.timerFrame = requestAnimationFrame(tick);
  };

  tick();
}

function startTimerIfNeeded() {
  if (!state.running) {
    startTimer();
  }
}

function stopTimer() {
  state.running = false;
  cancelAnimationFrame(state.timerFrame);
}

function renderBoard(size) {
  const total = size * size;
  const numbers = shuffle(Array.from({ length: total }, (_, index) => index + 1));
  board.innerHTML = "";
  board.dataset.size = String(size);
  board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  board.style.setProperty("--tile-font", `${Math.max(1.12, 4.55 - size * 0.32)}rem`);

  numbers.forEach((number, cellIndex) => {
    const row = Math.floor(cellIndex / size);
    const column = cellIndex % size;
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.type = "button";
    tile.textContent = number;
    tile.dataset.number = number;

    if (row === 0) tile.classList.add("edge-top");
    if (row === size - 1) tile.classList.add("edge-bottom");
    if (column === 0) tile.classList.add("edge-left");
    if (column === size - 1) tile.classList.add("edge-right");

    tile.addEventListener("click", () => handleTileClick(tile, number));
    board.append(tile);
  });
}

function markTileFound(tile) {
  tile.classList.add("is-found");
  tile.disabled = true;
}

function findTileByNumber(number) {
  return board.querySelector(`[data-number="${number}"]`);
}

function showAssistUsed() {
  assistNote.classList.remove("is-hidden");
}

function updateSetting(key, value) {
  state.settings[key] = value;
  applySettings();
  writeSettings();
}

function startGame(size) {
  stopTimer();
  state.size = size;
  state.total = size * size;
  state.target = 1;
  state.elapsed = 0;
  state.active = true;
  state.assistUsed = false;
  timer.textContent = "0.00s";
  assistNote.classList.add("is-hidden");
  resetPigAlert();
  renderBoard(size);
  show("game");
}

function handleTileClick(tile, number) {
  if (!state.active || tile.classList.contains("is-found")) return;

  const skippedNumber = state.target;
  const isNextNumber = number === skippedNumber + 1;

  if (number !== skippedNumber && !(isNextNumber && !state.assistUsed)) {
    tile.classList.remove("is-wrong");
    window.requestAnimationFrame(() => tile.classList.add("is-wrong"));
    window.setTimeout(() => tile.classList.remove("is-wrong"), 190);
    return;
  }

  if (skippedNumber === 1) {
    startTimerIfNeeded();
  }

  if (isNextNumber && !state.assistUsed) {
    const skippedTile = findTileByNumber(skippedNumber);
    if (skippedTile) markTileFound(skippedTile);
    markTileFound(tile);
    state.assistUsed = true;
    showAssistUsed();
    state.target += 2;

    if (state.target > state.total) {
      finishGame();
    }

    return;
  }

  markTileFound(tile);

  if (state.target === state.total) {
    finishGame();
    return;
  }

  state.target += 1;
}

function finishGame() {
  state.elapsed = state.running ? performance.now() - state.startTime : 0;
  state.active = false;
  stopTimer();

  const finalTime = state.elapsed;
  const bestTimes = readBestTimes();
  const previousBest = bestTimes[state.size];
  const isNewBest = !previousBest || finalTime < previousBest;

  if (isNewBest) {
    bestTimes[state.size] = Math.round(finalTime);
    writeBestTimes(bestTimes);
  }

  resultTime.textContent = formatTime(finalTime);
  timer.textContent = formatTime(finalTime);
  resultBest.classList.toggle("is-record", isNewBest);
  resultBest.textContent = isNewBest
    ? `🏆 新的 ${state.size}x${state.size} 最佳纪录`
    : `${state.size}x${state.size} 最佳 ${formatTime(previousBest)}`;

  renderDifficulties();
  show("result");

  if (finalTime > pigThresholds[state.size]) {
    showPigAlert();
  }
}

function returnToDifficulty() {
  state.active = false;
  stopTimer();
  resetPigAlert();
  renderDifficulties();
  show("difficulty");
}

backButton.addEventListener("click", returnToDifficulty);
chooseButton.addEventListener("click", returnToDifficulty);
retryButton.addEventListener("click", () => startGame(state.size));

settingsButton.addEventListener("click", () => {
  settingsPanel.classList.toggle("is-hidden");
});

closeSettingsButton.addEventListener("click", () => {
  settingsPanel.classList.add("is-hidden");
});

settingsPanel.addEventListener("click", (event) => {
  if (event.target === settingsPanel) {
    settingsPanel.classList.add("is-hidden");
  }
});

boardSizeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  updateSetting("boardSize", button.dataset.boardSize);
});

themeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  updateSetting("theme", button.dataset.theme);
});

homeTitle.addEventListener("pointerdown", () => {
  homeTitle.classList.remove("is-popped");
  window.requestAnimationFrame(() => homeTitle.classList.add("is-popped"));
});

homeTitle.addEventListener("animationend", () => {
  homeTitle.classList.remove("is-popped");
});

eyebrow.addEventListener("pointerdown", () => {
  eyebrow.classList.remove("is-popped");
  creditNote.classList.toggle("is-hidden");
  window.requestAnimationFrame(() => eyebrow.classList.add("is-popped"));
});

eyebrow.addEventListener("animationend", () => {
  eyebrow.classList.remove("is-popped");
});

creditNote.addEventListener("click", () => {
  creditNote.classList.add("is-hidden");
});

homeOrnaments.addEventListener("click", (event) => {
  const ornament = event.target.closest(".is-interactive");
  if (!ornament || ornament.dataset.collected === "true") return;

  ornament.dataset.collected = "true";
  ornament.classList.add("is-collected");
  resetCatchCursor();

  const interactiveOrnaments = [...homeOrnaments.querySelectorAll(".ornament.is-interactive")];
  const allCollected = interactiveOrnaments.every((item) => item.dataset.collected === "true");
  if (!allCollected) return;

  window.setTimeout(() => {
    interactiveOrnaments.forEach((item, index) => {
      item.style.setProperty("--regen-delay", `${index * 70}ms`);
      item.dataset.collected = "false";
      item.classList.remove("is-collected");
      item.classList.add("is-regenerated");
      window.setTimeout(() => item.classList.remove("is-regenerated"), 520 + index * 70);
    });
  }, 360);
});

pigAlert.addEventListener("click", () => {
  if (state.pigMood === "crying") {
    pigAlert.classList.remove("is-crying");
    pigAlert.classList.add("is-happy");
    state.pigMood = "happy";
    pigMessage.textContent = pigMessages.happy;
    return;
  }

  if (state.pigMood === "happy") {
    resetPigAlert();
    return;
  }

  pigAlert.classList.add("is-crying");
  state.pigMood = "crying";
  pigMessage.textContent = pigMessages.crying;
});

homeOrnaments.addEventListener("pointerover", (event) => {
  if (state.isTouch) return;
  if (event.target.closest(".ornament.is-interactive:not(.is-collected)")) {
    app.classList.add("is-catching");
  }
});

homeOrnaments.addEventListener("pointerout", (event) => {
  if (state.isTouch) return;
  if (!event.relatedTarget?.closest?.(".ornament.is-interactive:not(.is-collected)")) {
    resetCatchCursor();
  }
});

window.addEventListener("pointermove", (event) => {
  state.lastPointer = { x: event.clientX, y: event.clientY };
  catchCursor.style.setProperty("--cursor-x", `${event.clientX}px`);
  catchCursor.style.setProperty("--cursor-y", `${event.clientY}px`);

  if (!app.classList.contains("is-home")) return;
  if (state.isTouch) return;

  document.querySelectorAll(".ornament.is-avoid").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = centerX - event.clientX;
    const deltaY = centerY - event.clientY;
    const distance = Math.hypot(deltaX, deltaY);
    const radius = 390;

    if (distance > radius || distance === 0) {
      element.style.setProperty("--avoid-x", "0px");
      element.style.setProperty("--avoid-y", "0px");
      return;
    }

    const force = (1 - distance / radius) * 170;
    element.style.setProperty("--avoid-x", `${(deltaX / distance) * force}px`);
    element.style.setProperty("--avoid-y", `${(deltaY / distance) * force}px`);
  });
});

window.addEventListener("resize", syncViewportMode);

state.settings = readSettings();
syncViewportMode();
applySettings();
renderDifficulties();
show("difficulty");
