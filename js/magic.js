/**
 * Magic Skill — Spells, rune costs, damage calculation.
 *
 * Magic works through the combat system: when using a magic combat style,
 * the best available spell is auto-selected based on magic level and rune supply.
 * Runes are consumed per fight during adventure simulation.
 */

import { getLevel } from "./xp.js";
import { getItemCount } from "./inventory.js";

/**
 * Spell definitions — ordered by power (weakest first).
 * Each spell defines rune costs and a damage multiplier.
 */
export const SPELLS = Object.freeze([
  Object.freeze({
    id: "wind_strike",
    name: "Wind Strike",
    minLevel: 1,
    runeCost: Object.freeze({ air_rune: 1 }),
    baseDamage: 2,
    xpPerCast: 5,
  }),
  Object.freeze({
    id: "fire_strike",
    name: "Fire Strike",
    minLevel: 13,
    runeCost: Object.freeze({ fire_rune: 1, air_rune: 1 }),
    baseDamage: 4,
    xpPerCast: 11,
  }),
  Object.freeze({
    id: "earth_bolt",
    name: "Earth Bolt",
    minLevel: 29,
    runeCost: Object.freeze({ earth_rune: 2, air_rune: 1 }),
    baseDamage: 7,
    xpPerCast: 19,
  }),
  Object.freeze({
    id: "water_wave",
    name: "Water Wave",
    minLevel: 50,
    runeCost: Object.freeze({ water_rune: 3, air_rune: 1 }),
    baseDamage: 11,
    xpPerCast: 30,
  }),
]);

/**
 * Get the best spell the player can cast given their level and inventory.
 * @param {number} magicXp - Magic XP.
 * @param {Array} inventory - Current inventory.
 * @returns {object|null} Best available spell, or null if no runes.
 */
export function getBestSpell(magicXp, inventory) {
  const level = getLevel(magicXp);

  // Iterate from most powerful to weakest
  for (let i = SPELLS.length - 1; i >= 0; i--) {
    const spell = SPELLS[i];
    if (level < spell.minLevel) continue;

    const hasRunes = canCastSpell(spell, inventory);
    if (hasRunes) return spell;
  }

  return null;
}

/**
 * Check if a spell can be cast with the current inventory.
 * @param {object} spell - Spell definition.
 * @param {Array} inventory - Current inventory.
 * @returns {boolean}
 */
export function canCastSpell(spell, inventory) {
  for (const [runeId, qty] of Object.entries(spell.runeCost)) {
    if (getItemCount(inventory, runeId) < qty) return false;
  }
  return true;
}

/**
 * Calculate how many times a spell can be cast with current rune supply.
 * @param {object} spell - Spell definition.
 * @param {Array} inventory - Current inventory.
 * @returns {number} Max casts available.
 */
export function getMaxCasts(spell, inventory) {
  let minCasts = Infinity;
  for (const [runeId, qty] of Object.entries(spell.runeCost)) {
    const available = getItemCount(inventory, runeId);
    minCasts = Math.min(minCasts, Math.floor(available / qty));
  }
  return minCasts === Infinity ? 0 : minCasts;
}

/**
 * Get max hit for a magic spell based on magic level and equipment.
 * @param {number} magicXp - Magic XP.
 * @param {object} spell - Spell definition.
 * @param {number} [magicBonus=0] - Equipment magic bonus.
 * @returns {number}
 */
export function getMagicMaxHit(magicXp, spell, magicBonus) {
  const level = getLevel(magicXp);
  const bonusMult = 1 + (magicBonus || 0) * 0.01;
  return Math.max(1, Math.floor(spell.baseDamage * bonusMult + level * 0.15));
}
