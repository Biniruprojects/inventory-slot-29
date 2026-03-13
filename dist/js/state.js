/**
 * State Management — Immutable game state with Object.freeze().
 *
 * All state mutations go through updateState(), which creates a new
 * frozen state object, persists to localStorage, and notifies listeners.
 */

import { MAX_SLOTS } from "./utils.js";
import { BANK_SLOTS } from "./bank.js";

const STORAGE_KEY = "is29_save";
const TAB_LOCK_KEY = "is29_tab_active";
const IDB_DB = "is29_db";
const IDB_STORE = "saves";

// ─── IndexedDB helpers ───────────────────────────────────

let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") { resolve(null); return; }
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = (e) => { _idb = e.target.result; resolve(_idb); };
    req.onerror = () => resolve(null);
  });
}

function idbGet(key) {
  return openIDB().then((db) => {
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  });
}

function idbSet(key, value) {
  return openIDB().then((db) => {
    if (!db) return;
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
  });
}
const TAB_HEARTBEAT_MS = 2000;

/** @type {function[]} */
const listeners = [];

/** @type {object} */
let currentState = null;

/** @type {number|null} */
let heartbeatInterval = null;

/**
 * Deep freeze an object and all nested objects/arrays.
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  Object.freeze(obj);

  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}

/**
 * Create the default starting state for a new game.
 */
function createDefaultState() {
  const slots = [
    { id: "copper_ore", name: "Copper Ore", qty: 50 },
    { id: "tin_ore", name: "Tin Ore", qty: 30 },
    { id: "iron_ore", name: "Iron Ore", qty: 20 },
  ];

  while (slots.length < MAX_SLOTS) {
    slots.push(null);
  }

  const bank = new Array(BANK_SLOTS).fill(null);

  return {
    version: 1,
    player: {
      name: "Adventurer",
      gp: 0,
    },
    skills: {
      attack: { xp: 0 },
      strength: { xp: 0 },
      defence: { xp: 0 },
      hitpoints: { xp: 1154 }, // Starts at level 10 (OSRS convention)
      alchemy: { xp: 0 },
      smithing: { xp: 0 },
      mining: { xp: 0 },
      fishing: { xp: 0 },
      cooking: { xp: 0 },
      woodcutting: { xp: 0 },
      firemaking: { xp: 0 },
      magic: { xp: 0, unlocked: false },
      ranged: { xp: 0, unlocked: false },
    },
    inventory: slots,
    bank,
    equipment: {
      weapon: null,
      armor: null,
      shield: null,
    },
    adventure: {
      active: null,
      lastResult: null,
    },
    quests: {},
    potions: { active: [] },
    pets: { owned: [], active: null },
    tutorialSeen: false,
    stats: {
      totalXpGained: 0,
      totalItemsCrafted: 0,
      monstersKilled: 0,
      adventuresCompleted: 0,
      questsCompleted: 0,
      totalGpEarned: 0,
      totalFishCaught: 0,
      totalLogsCut: 0,
      totalLogsBurned: 0,
      totalFoodCooked: 0,
      bossKills: {},
      locationKills: {},
    },
    adventureLog: [],
    unlockedLore: [],
    achievements: [],
    prestige: {
      level: 0,
      totalResets: 0,
      perks: [],
      history: [],
    },
    settings: {
      soundEnabled: true,
    },
    activeBankTab: 0,
    milestones: {},
  };
}

/**
 * Migrate an old save to the current schema.
 * Adds missing keys with defaults so old saves don't break.
 */
function migrateState(parsed) {
  const defaults = createDefaultState();

  // Ensure all top-level keys exist
  if (parsed.version === undefined) parsed.version = 1;
  if (!parsed.player) parsed.player = { ...defaults.player };
  if (!parsed.skills) parsed.skills = { ...defaults.skills };
  if (!parsed.inventory) parsed.inventory = [...defaults.inventory];
  if (!parsed.bank) parsed.bank = [...defaults.bank];
  if (!parsed.equipment) parsed.equipment = { ...defaults.equipment };
  if (!parsed.adventure) parsed.adventure = { ...defaults.adventure };
  if (!parsed.quests) parsed.quests = { ...defaults.quests };
  if (!parsed.stats) parsed.stats = { ...defaults.stats };
  if (!parsed.adventureLog) parsed.adventureLog = [];
  if (!parsed.unlockedLore) parsed.unlockedLore = [];
  if (!parsed.potions) parsed.potions = { ...defaults.potions };
  if (!Array.isArray(parsed.potions.active)) parsed.potions.active = [];
  if (!parsed.pets) parsed.pets = { ...defaults.pets };
  if (!Array.isArray(parsed.pets.owned)) parsed.pets.owned = [];
  if (parsed.pets.active === undefined) parsed.pets.active = null;
  if (parsed.tutorialSeen === undefined) parsed.tutorialSeen = false;
  if (!Array.isArray(parsed.achievements)) parsed.achievements = [];
  if (!parsed.prestige) parsed.prestige = { ...defaults.prestige };
  if (!Array.isArray(parsed.prestige.perks)) parsed.prestige.perks = [];
  if (!Array.isArray(parsed.prestige.history)) parsed.prestige.history = [];
  if (!parsed.settings) parsed.settings = { ...defaults.settings };
  if (parsed.settings.soundEnabled === undefined) parsed.settings.soundEnabled = true;
  if (parsed.activeBankTab === undefined) parsed.activeBankTab = 0;
  if (!parsed.milestones) parsed.milestones = {};

  // Ensure all skills exist
  for (const [skill, data] of Object.entries(defaults.skills)) {
    if (!parsed.skills[skill]) {
      parsed.skills[skill] = data;
    }
    if (data.unlocked !== undefined && parsed.skills[skill].unlocked === undefined) {
      parsed.skills[skill].unlocked = data.unlocked;
    }
  }

  // Ensure all stats exist
  for (const [key, val] of Object.entries(defaults.stats)) {
    if (parsed.stats[key] === undefined) {
      parsed.stats[key] = val;
    }
  }
  if (!parsed.stats.bossKills)    parsed.stats.bossKills = {};
  if (!parsed.stats.locationKills) parsed.stats.locationKills = {};

  // Ensure inventory length
  while (parsed.inventory && parsed.inventory.length < MAX_SLOTS) {
    parsed.inventory.push(null);
  }

  // Ensure bank length
  while (parsed.bank && parsed.bank.length < BANK_SLOTS) {
    parsed.bank.push(null);
  }

  return parsed;
}

/**
 * Check if another tab is already running the game.
 * Uses a heartbeat timestamp — if the last beat is within 2× the interval,
 * the other tab is still alive.
 *
 * @returns {boolean} True if another tab is active.
 */
export function isAnotherTabActive() {
  try {
    const raw = localStorage.getItem(TAB_LOCK_KEY);
    if (!raw) return false;
    const lastBeat = parseInt(raw, 10);
    return Date.now() - lastBeat < TAB_HEARTBEAT_MS * 2;
  } catch {
    return false;
  }
}

/**
 * Claim the tab lock and start heartbeat.
 * Called after confirming no other tab is active.
 */
function claimTabLock() {
  localStorage.setItem(TAB_LOCK_KEY, String(Date.now()));
  heartbeatInterval = setInterval(() => {
    localStorage.setItem(TAB_LOCK_KEY, String(Date.now()));
  }, TAB_HEARTBEAT_MS);

  // Release lock on tab close / navigation
  window.addEventListener("beforeunload", releaseTabLock);
}

/**
 * Release the tab lock.
 */
function releaseTabLock() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  try {
    localStorage.removeItem(TAB_LOCK_KEY);
  } catch {
    // ignore
  }
}

/**
 * Initialize the game state — load from IndexedDB (async) or localStorage (sync fallback).
 * Returns null if another tab is already active.
 * For the synchronous boot path we read localStorage immediately;
 * IDB data (potentially fresher) is merged once the promise resolves.
 *
 * @returns {object|null} Initial state, or null if blocked by tab lock.
 */
export function initState() {
  if (isAnotherTabActive()) {
    return null;
  }

  claimTabLock();

  // Sync boot from localStorage (instant, no async needed for first render)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      currentState = deepFreeze(migrateState(parsed));
    } catch {
      currentState = deepFreeze(createDefaultState());
    }
  } else {
    currentState = deepFreeze(createDefaultState());
  }

  // Async IDB hydration — if IDB has a save and it's newer, upgrade state silently
  idbGet(STORAGE_KEY).then((idbRaw) => {
    if (!idbRaw) return;
    try {
      const idbParsed = JSON.parse(idbRaw);
      // Only upgrade if IDB save has a higher version or more stats (sign of being fresher)
      const idbMigrated = migrateState(idbParsed);
      const lsKills = currentState.stats?.monstersKilled || 0;
      const idbKills = idbMigrated.stats?.monstersKilled || 0;
      if (idbKills > lsKills) {
        currentState = deepFreeze(idbMigrated);
        notifyListeners();
      }
    } catch { /* ignore corrupt IDB data */ }
  }).catch(() => {});

  return currentState;
}

/**
 * Get the current game state (frozen).
 * @returns {object}
 */
export function getState() {
  return currentState;
}

/**
 * Update the game state with a partial update.
 * Creates a new frozen state, saves to localStorage, and notifies listeners.
 *
 * @param {object} partial - Partial state to merge (shallow per top-level key).
 */
export function updateState(partial) {
  const next = {
    version: currentState.version || 1,
    player: { ...currentState.player, ...(partial.player || {}) },
    skills: {
      ...currentState.skills,
      ...(partial.skills
        ? Object.fromEntries(
            Object.entries(partial.skills).map(([k, v]) => [
              k,
              { ...(currentState.skills[k] || {}), ...v },
            ])
          )
        : {}),
    },
    inventory: partial.inventory || currentState.inventory,
    bank: partial.bank || currentState.bank,
    equipment: partial.equipment !== undefined
      ? { ...currentState.equipment, ...partial.equipment }
      : currentState.equipment,
    adventure: partial.adventure !== undefined
      ? { ...currentState.adventure, ...partial.adventure }
      : currentState.adventure,
    quests: partial.quests !== undefined
      ? { ...currentState.quests, ...partial.quests }
      : currentState.quests,
    potions: partial.potions !== undefined
      ? { ...currentState.potions, ...partial.potions }
      : currentState.potions,
    pets: partial.pets !== undefined
      ? { ...currentState.pets, ...partial.pets }
      : currentState.pets,
    tutorialSeen: partial.tutorialSeen !== undefined
      ? partial.tutorialSeen
      : currentState.tutorialSeen,
    stats: { ...currentState.stats, ...(partial.stats || {}) },
    adventureLog: partial.adventureLog !== undefined
      ? partial.adventureLog
      : currentState.adventureLog,
    unlockedLore: partial.unlockedLore !== undefined
      ? partial.unlockedLore
      : currentState.unlockedLore,
    achievements: partial.achievements !== undefined
      ? partial.achievements
      : currentState.achievements,
    prestige: partial.prestige !== undefined
      ? { ...currentState.prestige, ...partial.prestige }
      : currentState.prestige,
    settings: partial.settings !== undefined
      ? { ...currentState.settings, ...partial.settings }
      : currentState.settings,
    activeBankTab: partial.activeBankTab !== undefined
      ? partial.activeBankTab
      : currentState.activeBankTab,
    milestones: partial.milestones !== undefined
      ? { ...currentState.milestones, ...partial.milestones }
      : currentState.milestones,
  };

  currentState = deepFreeze(next);
  saveState();
  notifyListeners();
}

/**
 * Subscribe to state changes.
 * @param {function} fn - Callback receiving the new state.
 */
export function subscribe(fn) {
  listeners.push(fn);
}

/**
 * Persist current state to localStorage (debounced — max once per 2s).
 * Critical saves (adventure complete, prestige, export) can bypass via saveNow().
 */
let _saveTimer = null;
const SAVE_DEBOUNCE_MS = 2000;

function saveState() {
  if (_saveTimer) return; // already scheduled
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    _persistState();
  }, SAVE_DEBOUNCE_MS);
}

/** Flush immediately — call for critical moments (adventure done, prestige). */
export function saveNow() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  _persistState();
}

function _persistState() {
  const serialised = JSON.stringify(currentState);
  // Write to IndexedDB (primary, larger quota)
  idbSet(STORAGE_KEY, serialised).catch(() => {});
  // Also write to localStorage (fallback, smaller quota but synchronous read on boot)
  try {
    localStorage.setItem(STORAGE_KEY, serialised);
  } catch {
    try { localStorage.removeItem(STORAGE_KEY + "_bak"); } catch { /* ignore */ }
    try { localStorage.setItem(STORAGE_KEY, serialised); } catch { /* silently fail */ }
  }
}

/**
 * Notify all subscribers of the new state.
 */
function notifyListeners() {
  for (const fn of listeners) {
    fn(currentState);
  }
}

/**
 * Reset the game to default state (for testing / new game).
 */
export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  currentState = deepFreeze(createDefaultState());
  notifyListeners();
}

/**
 * Export the current save as a JSON file download.
 */
export function exportSave() {
  const data = JSON.stringify(currentState, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `is29_save_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a save from a JSON string.
 * Validates required keys, migrates, and replaces state.
 *
 * @param {string} jsonString - Raw JSON save data.
 * @returns {{ ok: boolean, error?: string }}
 */
export function importSave(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: "Invalid JSON file." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Save file is not a valid object." };
  }

  // Validate required keys
  const requiredKeys = ["player", "skills", "inventory"];
  for (const key of requiredKeys) {
    if (!parsed[key]) {
      return { ok: false, error: `Missing required key: ${key}` };
    }
  }

  const migrated = migrateState(parsed);
  currentState = deepFreeze(migrated);
  saveState();
  notifyListeners();
  return { ok: true };
}
