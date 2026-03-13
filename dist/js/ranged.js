/**
 * Ranged Skill — Arrow types, ranged damage calculation.
 *
 * Ranged works through the combat system: when using a ranged combat style,
 * the best available arrows are auto-selected. Arrows consumed per fight.
 */

import { getLevel } from "./xp.js";
import { getItemCount } from "./inventory.js";

/**
 * Arrow definitions — ordered by power (weakest first).
 */
export const ARROW_TYPES = Object.freeze([
  Object.freeze({
    id: "bronze_arrow",
    name: "Bronze Arrow",
    minLevel: 1,
    baseDamage: 2,
  }),
  Object.freeze({
    id: "iron_arrow",
    name: "Iron Arrow",
    minLevel: 15,
    baseDamage: 4,
  }),
  Object.freeze({
    id: "steel_arrow",
    name: "Steel Arrow",
    minLevel: 30,
    baseDamage: 7,
  }),
]);

/**
 * Get the best arrow type the player can use given their level and inventory.
 * @param {number} rangedXp - Ranged XP.
 * @param {Array} inventory - Current inventory.
 * @returns {object|null} Best available arrow type, or null if none.
 */
export function getBestArrow(rangedXp, inventory) {
  const level = getLevel(rangedXp);

  for (let i = ARROW_TYPES.length - 1; i >= 0; i--) {
    const arrow = ARROW_TYPES[i];
    if (level < arrow.minLevel) continue;

    if (getItemCount(inventory, arrow.id) > 0) return arrow;
  }

  return null;
}

/**
 * Get how many of a specific arrow the player has.
 * @param {string} arrowId - Arrow item ID.
 * @param {Array} inventory - Current inventory.
 * @returns {number}
 */
export function getArrowCount(arrowId, inventory) {
  return getItemCount(inventory, arrowId);
}

/**
 * Get max hit for ranged based on level, arrow type, and equipment.
 * @param {number} rangedXp - Ranged XP.
 * @param {object} arrow - Arrow type definition.
 * @param {number} [rangedBonus=0] - Equipment ranged bonus.
 * @returns {number}
 */
export function getRangedMaxHit(rangedXp, arrow, rangedBonus) {
  const level = getLevel(rangedXp);
  const bonusMult = 1 + (rangedBonus || 0) * 0.01;
  return Math.max(1, Math.floor(arrow.baseDamage * bonusMult + level * 0.25));
}
