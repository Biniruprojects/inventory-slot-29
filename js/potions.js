/**
 * Potions — OSRS-style combat boosts consumed from inventory.
 *
 * Potions are inventory items. When used, they are consumed (qty -1)
 * and their boost is added to state.potions.active. Active boosts
 * are applied during combat and cleared after the adventure completes.
 */

import { getState, updateState } from "./state.js";
import { removeItem, getItemCount } from "./inventory.js";
import { getLevel } from "./xp.js";

/**
 * Potion definitions — each has a skill it boosts and a boost formula.
 * The boost function receives the player's base level and returns the bonus.
 */
export const POTIONS = Object.freeze({
  attack_potion: Object.freeze({
    name: "Attack Potion",
    skill: "attack",
    boost: (lvl) => Math.floor(lvl * 0.1) + 3,
    category: "combat",
  }),
  strength_potion: Object.freeze({
    name: "Strength Potion",
    skill: "strength",
    boost: (lvl) => Math.floor(lvl * 0.1) + 3,
    category: "combat",
  }),
  defence_potion: Object.freeze({
    name: "Defence Potion",
    skill: "defence",
    boost: (lvl) => Math.floor(lvl * 0.1) + 3,
    category: "combat",
  }),
  magic_potion: Object.freeze({
    name: "Magic Potion",
    skill: "magic",
    boost: (lvl) => Math.floor(lvl * 0.1) + 4,
    category: "combat",
  }),
  ranging_potion: Object.freeze({
    name: "Ranging Potion",
    skill: "ranged",
    boost: (lvl) => Math.floor(lvl * 0.1) + 4,
    category: "combat",
  }),
  super_restore: Object.freeze({
    name: "Super Restore",
    healPercent: 0.25,
    restoreAll: true,
    category: "healing",
  }),
});

/**
 * Get a potion definition by ID.
 * @param {string} potionId - The potion item ID.
 * @returns {object|null} Potion definition or null if not a potion.
 */
export function getPotion(potionId) {
  return POTIONS[potionId] || null;
}

/**
 * Check if a potion can be used (player has at least 1 in inventory).
 * @param {string} potionId - The potion item ID.
 * @param {object} state - Current game state.
 * @returns {boolean}
 */
export function canUsePotion(potionId, state) {
  const potion = POTIONS[potionId];
  if (!potion) return false;
  return getItemCount(state.inventory, potionId) > 0;
}

/**
 * Use a potion — removes 1 from inventory and applies the boost.
 *
 * Combat potions add a { skill, amount } entry to state.potions.active.
 * Super restore does not add a combat boost — its effect is applied
 * differently during combat (heals HP).
 *
 * @param {string} potionId - The potion item ID.
 * @returns {boolean} True if the potion was used successfully.
 */
export function usePotion(potionId) {
  const potion = POTIONS[potionId];
  if (!potion) return false;

  const state = getState();

  // Must have the potion in inventory
  if (getItemCount(state.inventory, potionId) < 1) return false;

  // Remove from inventory
  const newInventory = removeItem(state.inventory, potionId, 1);
  if (!newInventory) return false;

  // Build the updated active boosts array
  const currentActive = state.potions ? [...state.potions.active] : [];

  if (potion.category === "combat" && potion.skill) {
    // Calculate boost amount from current skill level
    const skillData = state.skills[potion.skill];
    const baseLevel = skillData ? getLevel(skillData.xp) : 1;
    const boostAmount = potion.boost(baseLevel);

    // Replace existing boost for this skill (don't stack same potion)
    const filtered = currentActive.filter((b) => b.skill !== potion.skill);
    filtered.push({ skill: potion.skill, amount: boostAmount });

    updateState({
      inventory: newInventory,
      potions: { active: filtered },
    });
  } else if (potion.category === "healing" && potion.healPercent) {
    // Super Restore — add healing effect and refresh all active combat boosts
    const filtered = currentActive.filter((b) => b.type !== "super_restore");
    filtered.push({ type: "super_restore", healPercent: potion.healPercent });

    if (potion.restoreAll) {
      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        if (entry.skill) {
          const skillData = state.skills[entry.skill];
          const baseLevel = skillData ? getLevel(skillData.xp) : 1;
          const potionDef = Object.values(POTIONS).find(
            (p) => p.skill === entry.skill && typeof p.boost === "function"
          );
          if (potionDef) {
            filtered[i] = Object.freeze({ skill: entry.skill, amount: potionDef.boost(baseLevel) });
          }
        }
      }
    }

    updateState({
      inventory: newInventory,
      potions: { active: filtered },
    });
  } else {
    // Other non-combat potions — just consume
    updateState({
      inventory: newInventory,
    });
  }

  return true;
}

/**
 * Get active potion boosts as a flat object of { skill: amount }.
 * Used by combat to add bonuses to effective skill levels.
 *
 * @param {object} state - Current game state.
 * @returns {object} Map of skill name to boost amount (e.g. { attack: 5, strength: 4 }).
 */
export function getActiveBoosts(state) {
  const boosts = {};
  const active = state.potions ? state.potions.active : [];

  for (const entry of active) {
    if (entry.type === "super_restore") {
      boosts.superRestore = entry.healPercent;
      continue;
    }
    boosts[entry.skill] = (boosts[entry.skill] || 0) + entry.amount;
  }

  return boosts;
}

/**
 * Clear all active potion boosts — called after an adventure completes.
 * Potions are single-adventure consumables.
 */
export function clearActiveBoosts() {
  updateState({
    potions: { active: [] },
  });
}
