/**
 * Adventures — Locations, timers, and offline support.
 *
 * Players send their character on timed adventures. When the timer
 * completes (even while offline), they collect loot and XP.
 */

import { getLevel } from "./xp.js";
import { MONSTERS, BOSSES, BOSS_ENCOUNTER_THRESHOLD } from "./monsters.js";
import { simulateAdventure } from "./combat.js";
import { ITEMS } from "./inventory.js";
import { rollForPet, addPet, getActivePetBonus, applyPetXpBonus, applyPetGpBonus } from "./pets.js";
import { getActiveBoosts, clearActiveBoosts } from "./potions.js";

/**
 * Location definitions — each has requirements, duration options,
 * and a pool of monsters to encounter.
 */
export const LOCATIONS = Object.freeze({
  muddy_crossroad: Object.freeze({
    id: "muddy_crossroad",
    name: "The Muddy Crossroad",
    icon: "assets/loc_crossroad.svg",
    description: "A well-trodden path. Roaches and petty thieves lurk here.",
    minCombatLevel: 1,
    durations: Object.freeze([5, 15, 30]),
    monsterIds: ["giant_roach"],
  }),

  bone_woods: Object.freeze({
    id: "bone_woods",
    name: "The Bone Woods",
    icon: "assets/loc_woods.svg",
    description: "Dense, dark forest. Thugs hide among the dead trees.",
    minCombatLevel: 8,
    durations: Object.freeze([15, 30, 60]),
    monsterIds: ["giant_roach", "hooded_thug"],
  }),

  ashen_caves: Object.freeze({
    id: "ashen_caves",
    name: "Ashen Caves",
    icon: "assets/loc_caves.svg",
    description: "Deep underground. Lurkers and crawlers thrive in the dark.",
    minCombatLevel: 20,
    durations: Object.freeze([30, 60, 120]),
    monsterIds: ["hooded_thug", "swamp_lurker", "cave_crawler"],
  }),

  dragons_hollow: Object.freeze({
    id: "dragons_hollow",
    name: "Dragon's Hollow",
    icon: "assets/loc_dragons_hollow.svg",
    description: "A scorched ravine where golems and dark mages dwell.",
    minCombatLevel: 35,
    durations: Object.freeze([30, 60, 120]),
    monsterIds: ["steel_golem", "dark_mage"],
  }),

  shadow_fortress: Object.freeze({
    id: "shadow_fortress",
    name: "Shadow Fortress",
    icon: "assets/loc_shadow_fortress.svg",
    description: "An ancient stronghold. Shadow knights guard young dragons within.",
    minCombatLevel: 50,
    durations: Object.freeze([60, 120, 240]),
    monsterIds: ["shadow_knight", "young_dragon"],
  }),
});

/**
 * Calculate the player's combat level from their skills.
 * Simplified OSRS formula: base + defence + hitpoints contribution.
 *
 * @param {object} skills - Player skills from state.
 * @returns {number} Combat level.
 */
export function getCombatLevel(skills) {
  const atk = getLevel(skills.attack.xp);
  const str = getLevel(skills.strength.xp);
  const def = getLevel(skills.defence.xp);
  const hp = getLevel(skills.hitpoints.xp);
  const mag = skills.magic && skills.magic.unlocked !== false ? getLevel(skills.magic.xp) : 0;
  const rng = skills.ranged && skills.ranged.unlocked !== false ? getLevel(skills.ranged.xp) : 0;

  const meleeOffence = (atk + str) * 0.325;
  const magicOffence = mag * 0.325;
  const rangedOffence = rng * 0.325;
  const offence = Math.max(meleeOffence, magicOffence, rangedOffence);

  return Math.floor(offence + (def + hp) * 0.25);
}

/**
 * Get locations available to the player based on combat level.
 * @param {object} skills - Player skills.
 * @returns {Array} Available locations.
 */
export function getAvailableLocations(skills) {
  const level = getCombatLevel(skills);
  return Object.values(LOCATIONS).filter((loc) => level >= loc.minCombatLevel);
}

/**
 * Start an adventure — returns the adventure state to persist.
 *
 * @param {string} locationId - Location ID.
 * @param {number} durationMinutes - Chosen duration in minutes.
 * @param {string} styleId - Combat style ID.
 * @returns {object} Adventure state: { locationId, startTime, duration, style }.
 */
export function startAdventure(locationId, durationMinutes, styleId) {
  return {
    locationId,
    startTime: Date.now(),
    duration: durationMinutes,
    style: styleId,
  };
}

/**
 * Check if an active adventure has completed.
 * @param {object} adventure - Active adventure state.
 * @returns {boolean}
 */
export function isAdventureComplete(adventure) {
  if (!adventure) return false;
  const elapsed = Date.now() - adventure.startTime;
  return elapsed >= adventure.duration * 60 * 1000;
}

/**
 * Get the remaining time for an active adventure.
 * @param {object} adventure - Active adventure state.
 * @returns {number} Remaining milliseconds (0 if complete).
 */
export function getTimeRemaining(adventure) {
  if (!adventure) return 0;
  const elapsed = Date.now() - adventure.startTime;
  const total = adventure.duration * 60 * 1000;
  return Math.max(0, total - elapsed);
}

/**
 * Auto-select food from inventory for an adventure.
 * Gathers all available cooked food, sorts by heal amount (lowest first
 * to preserve the player's best food), then takes up to 10.
 *
 * @param {Array} inventory - Current inventory.
 * @returns {Array} Array of { id, healAmount }.
 */
export function selectFoodForAdventure(inventory) {
  // Collect all individual food units across all inventory slots
  const allFoods = [];
  for (let i = 0; i < inventory.length; i++) {
    const slot = inventory[i];
    if (!slot) continue;
    const def = ITEMS[slot.id];
    if (def && def.healAmount) {
      for (let q = 0; q < slot.qty; q++) {
        allFoods.push({ id: slot.id, healAmount: def.healAmount });
      }
    }
  }

  // Sort by heal amount ascending — use worst food first, preserve best
  allFoods.sort((a, b) => a.healAmount - b.healAmount);

  // Take up to 10
  return allFoods.slice(0, 10);
}

/**
 * Complete an adventure — simulate all fights and return results.
 *
 * Integrates potion boosts (applied during combat) and pet drops (rolled after).
 * Active potion boosts are cleared after the adventure completes.
 *
 * @param {object} adventure - Active adventure state.
 * @param {object} skills - Player skills from state.
 * @param {object} [bonuses] - Equipment bonuses.
 * @param {Array} [foodItems] - Array of { id, healAmount } for food.
 * @param {Array} [inventory] - Current inventory for ammo checks.
 * @param {object} [state] - Full game state (for potion boosts).
 * @returns {object} { monstersKilled, totalXpGains, loot, fled, location, gpGained, foodConsumed, ammoConsumed, petDrop }
 */
export function completeAdventure(adventure, skills, bonuses, foodItems, inventory, state) {
  const location = LOCATIONS[adventure.locationId];
  if (!location) return null;

  const monsterPool = location.monsterIds
    .map((id) => MONSTERS[id])
    .filter(Boolean);

  if (monsterPool.length === 0) return null;

  // Get active potion boosts for this adventure
  const boosts = state ? getActiveBoosts(state) : {};

  const result = simulateAdventure(
    skills,
    monsterPool,
    adventure.style,
    adventure.duration,
    bonuses,
    foodItems,
    inventory,
    boosts,
  );

  // Apply pet bonus to XP and GP rewards
  const petBonus = state ? getActivePetBonus(state) : null;
  const adjustedXpGains = {};
  for (const [skill, amount] of Object.entries(result.totalXpGains)) {
    adjustedXpGains[skill] = applyPetXpBonus(amount, skill, petBonus);
  }
  const adjustedGp = applyPetGpBonus(result.gpGained, petBonus);

  // Roll for a pet drop from this location
  const petDrop = rollForPet(adventure.locationId);
  if (petDrop) {
    addPet(petDrop);
  }

  // Clear active potion boosts — potions are single-adventure consumables
  clearActiveBoosts();

  // ── Boss encounter check ──
  // Track kills per location; every BOSS_ENCOUNTER_THRESHOLD kills → boss fight
  const locationKills = state ? { ...(state.stats.locationKills || {}) } : {};
  const prevLocationKills = locationKills[adventure.locationId] || 0;
  const newLocationKills = prevLocationKills + result.monstersKilled;
  locationKills[adventure.locationId] = newLocationKills;

  let bossResult = null;
  const boss = BOSSES[adventure.locationId];
  const prevBossThreshold = Math.floor(prevLocationKills / BOSS_ENCOUNTER_THRESHOLD);
  const newBossThreshold  = Math.floor(newLocationKills / BOSS_ENCOUNTER_THRESHOLD);

  if (boss && newBossThreshold > prevBossThreshold) {
    // Simulate boss fight using same system
    const bossSimulation = simulateAdventure(
      skills,
      [boss],
      adventure.style,
      5, // 5-min equivalent for boss fight
      bonuses,
      foodItems,
      inventory,
      boosts,
    );
    bossResult = {
      boss: boss.name,
      won: bossSimulation.monstersKilled > 0,
      loot: bossSimulation.loot,
      gpGained: bossSimulation.gpGained,
    };
    if (bossResult.won) {
      result.loot = [
        ...result.loot,
        ...bossResult.loot,
      ];
      result.gpGained += bossResult.gpGained;
    }
  }

  return {
    ...result,
    totalXpGains: adjustedXpGains,
    gpGained: adjustedGp + (bossResult && bossResult.won ? bossResult.gpGained : 0),
    location: location.name,
    petDrop,
    bossResult,
    locationKills,
  };
}

/**
 * Format remaining time as "Xm Ys" or "Xh Ym".
 * @param {number} ms - Milliseconds remaining.
 * @returns {string}
 */
export function formatTime(ms) {
  if (ms <= 0) return "Complete!";

  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ─── Web Worker wrapper ───────────────────────────────────

let _combatWorker = null;
let _workerSupported = typeof Worker !== "undefined";

function getCombatWorker() {
  if (!_workerSupported) return null;
  if (!_combatWorker) {
    try {
      _combatWorker = new Worker("./combat-worker.js", { type: "module" });
    } catch {
      _workerSupported = false;
      return null;
    }
  }
  return _combatWorker;
}

/**
 * Complete an adventure asynchronously via Web Worker (falls back to sync).
 * Returns a Promise resolving to the same shape as completeAdventure().
 */
export function completeAdventureAsync(adventure, skills, bonuses, foodItems, inventory, state) {
  // Sync path first — always works
  const syncResult = completeAdventure(adventure, skills, bonuses, foodItems, inventory, state);
  return Promise.resolve(syncResult);

  // Worker path kept for future activation when TWA allows module workers:
  // const worker = getCombatWorker();
  // if (!worker) return Promise.resolve(syncResult);
  // ... (postMessage / onmessage pattern)
}
