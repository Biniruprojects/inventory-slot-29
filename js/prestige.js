/**
 * Prestige System — Reset progress for permanent bonuses.
 *
 * Requirements: Total level 500+ (or all skills 50+).
 *
 * What RESETS: Skills (HP back to 10), inventory (except starter ores),
 * equipment, quests, active adventure + potions.
 *
 * What STAYS: GP (50%), bank, pets, achievements, lore, prestige state.
 */

import { getLevel } from "./xp.js";
import { MAX_SLOTS } from "./utils.js";
import { BANK_SLOTS } from "./bank.js";

// ─── Prestige Tiers (cosmetic) ──────────────────────────

export const PRESTIGE_TIERS = Object.freeze([
  Object.freeze({ minLevel: 0,  label: "",             star: "" }),
  Object.freeze({ minLevel: 1,  label: "Bronze Star",  star: "\u2605" }),
  Object.freeze({ minLevel: 3,  label: "Iron Star",    star: "\u2605\u2605" }),
  Object.freeze({ minLevel: 6,  label: "Steel Star",   star: "\u2605\u2605\u2605" }),
  Object.freeze({ minLevel: 11, label: "Mithril Star", star: "\u2605\u2605\u2605\u2605" }),
]);

// ─── Public API ──────────────────────────────────────────

/**
 * Calculate the total level (sum of all skill levels).
 */
function getTotalLevel(skills) {
  let total = 0;
  for (const data of Object.values(skills)) {
    if (data && typeof data.xp === "number" && data.unlocked !== false) {
      total += getLevel(data.xp);
    }
  }
  return total;
}

/**
 * Check if the player can prestige.
 * @param {object} state - Full game state.
 * @returns {boolean}
 */
export function canPrestige(state) {
  return getTotalLevel(state.skills) >= 500;
}

/**
 * Get the prestige XP bonus multiplier.
 * Formula: bonus = 1 - 1/(1 + level * 0.05)
 * @param {number} level - Prestige level.
 * @returns {number} Decimal bonus (e.g. 0.05 for 5%).
 */
export function getPrestigeXpBonus(level) {
  if (level <= 0) return 0;
  return 1 - 1 / (1 + level * 0.05);
}

/**
 * Get the prestige GP bonus multiplier.
 * Starts at prestige 2.
 * @param {number} level - Prestige level.
 * @returns {number} Decimal bonus (e.g. 0.05 for 5%).
 */
export function getPrestigeGpBonus(level) {
  if (level < 2) return 0;
  return Math.min((level - 1) * 0.05, 0.5); // cap at 50%
}

/**
 * Get the prestige tier for a given level.
 * @param {number} level - Prestige level.
 * @returns {{ label: string, star: string }}
 */
export function getPrestigeTier(level) {
  let tier = PRESTIGE_TIERS[0];
  for (const t of PRESTIGE_TIERS) {
    if (level >= t.minLevel) tier = t;
  }
  return tier;
}

/**
 * Execute prestige — returns the new state after reset.
 * Caller must pass this to updateState().
 *
 * @param {object} state - Full game state.
 * @returns {object|null} Partial state for updateState, or null if can't prestige.
 */
export function executePrestige(state) {
  if (!canPrestige(state)) return null;

  const newPrestigeLevel = (state.prestige?.level || 0) + 1;
  const totalLevel = getTotalLevel(state.skills);

  // Starter ores for new run
  const newInventory = [
    { id: "copper_ore", name: "Copper Ore", qty: 50 },
    { id: "tin_ore", name: "Tin Ore", qty: 30 },
    { id: "iron_ore", name: "Iron Ore", qty: 20 },
  ];
  while (newInventory.length < MAX_SLOTS) {
    newInventory.push(null);
  }

  return {
    skills: {
      attack: { xp: 0 },
      strength: { xp: 0 },
      defence: { xp: 0 },
      hitpoints: { xp: 1154 },
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
    player: {
      name: state.player.name,
      gp: Math.floor(state.player.gp * 0.5),
    },
    inventory: newInventory,
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
    stats: {
      ...state.stats,
      // Keep cumulative stats, reset per-run counts if desired
    },
    prestige: {
      level: newPrestigeLevel,
      totalResets: (state.prestige?.totalResets || 0) + 1,
      perks: state.prestige?.perks || [],
      history: [
        ...(state.prestige?.history || []),
        {
          level: newPrestigeLevel - 1,
          totalLevel,
          date: Date.now(),
        },
      ],
    },
    // These are preserved (not included = kept as-is by updateState):
    // bank, pets, achievements, unlockedLore, settings
  };
}
