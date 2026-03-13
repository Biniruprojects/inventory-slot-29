/**
 * Combat System — OSRS-style damage calculation and fight simulation.
 *
 * Simplified for idle game: fights are simulated in bulk when an
 * adventure completes, not in real-time.
 *
 * Supports three combat categories:
 * - Melee: uses attack/strength levels and equipment bonuses
 * - Magic: uses magic level, consumes runes, spell-based damage
 * - Ranged: uses ranged level, consumes arrows, arrow-based damage
 */

import { getLevel } from "./xp.js";
import { getBestSpell, getMagicMaxHit, getMaxCasts } from "./magic.js";
import { getBestArrow, getRangedMaxHit, getArrowCount } from "./ranged.js";

/** Default zero bonuses (when no equipment). */
const ZERO_BONUSES = Object.freeze({
  attackBonus: 0, strengthBonus: 0, defenceBonus: 0, magicBonus: 0, rangedBonus: 0,
});

/** Combat styles and which skills they train. */
export const COMBAT_STYLES = Object.freeze({
  melee_attack: Object.freeze({
    id: "melee_attack",
    label: "Accurate (Attack)",
    trainedSkills: ["attack", "hitpoints"],
    xpSplit: { attack: 4, hitpoints: 1.33 },
    category: "melee",
    requiresUnlock: false,
  }),
  melee_strength: Object.freeze({
    id: "melee_strength",
    label: "Aggressive (Strength)",
    trainedSkills: ["strength", "hitpoints"],
    xpSplit: { strength: 4, hitpoints: 1.33 },
    category: "melee",
    requiresUnlock: false,
  }),
  melee_defence: Object.freeze({
    id: "melee_defence",
    label: "Defensive (Defence)",
    trainedSkills: ["defence", "hitpoints"],
    xpSplit: { defence: 4, hitpoints: 1.33 },
    category: "melee",
    requiresUnlock: false,
  }),
  magic_standard: Object.freeze({
    id: "magic_standard",
    label: "Magic (Standard)",
    trainedSkills: ["magic", "hitpoints"],
    xpSplit: { magic: 4, hitpoints: 1.33 },
    category: "magic",
    requiresUnlock: true,
    unlockSkill: "magic",
  }),
  ranged_accurate: Object.freeze({
    id: "ranged_accurate",
    label: "Ranged (Accurate)",
    trainedSkills: ["ranged", "hitpoints"],
    xpSplit: { ranged: 4, hitpoints: 1.33 },
    category: "ranged",
    requiresUnlock: true,
    unlockSkill: "ranged",
  }),
});

/**
 * Get combat styles available to the player (filters out locked ones).
 * @param {object} skills - Player skills from state.
 * @returns {Array} Available combat styles.
 */
export function getAvailableCombatStyles(skills) {
  return Object.values(COMBAT_STYLES).filter((style) => {
    if (!style.requiresUnlock) return true;
    const skill = skills[style.unlockSkill];
    return skill && skill.unlocked !== false;
  });
}

/**
 * Calculate the player's max hit based on skill levels, style, equipment, ammo, and potion boosts.
 *
 * For magic/ranged: returns 1 (minimum damage) when the required ammo (spell or arrow)
 * is not provided. This is intentional — it serves as a fallback so combat can still
 * proceed at reduced effectiveness when ammo runs out mid-adventure. The calling code
 * in simulateFight() handles ammo availability separately and uses this fallback when
 * the player has exhausted their supply.
 *
 * @param {object} skills - Player skills from state.
 * @param {string} styleId - Combat style ID.
 * @param {object} [bonuses] - Equipment bonuses.
 * @param {object} [ammoInfo] - { spell, arrow } for magic/ranged.
 * @param {object} [boosts] - Potion boosts: { attack: +X, strength: +Y, ... }.
 * @returns {number} Maximum damage per hit (minimum 1).
 */
export function getMaxHit(skills, styleId, bonuses, ammoInfo, boosts) {
  const b = bonuses || ZERO_BONUSES;
  const pb = boosts || {};
  const style = COMBAT_STYLES[styleId];

  if (style && style.category === "magic") {
    const spell = ammoInfo && ammoInfo.spell;
    if (!spell) return 1;
    // Magic potion boost adds to effective magic level for max hit
    const magicBoost = pb.magic || 0;
    return getMagicMaxHit(skills.magic.xp, spell, b.magicBonus + magicBoost);
  }

  if (style && style.category === "ranged") {
    const arrow = ammoInfo && ammoInfo.arrow;
    if (!arrow) return 1;
    // Ranging potion boost adds to effective ranged level for max hit
    const rangedBoost = pb.ranged || 0;
    return getRangedMaxHit(skills.ranged.xp, arrow, b.rangedBonus + rangedBoost);
  }

  // Melee — strength potion boost adds to effective strength
  const strLevel = getLevel(skills.strength.xp) + (pb.strength || 0);
  const styleBonus = styleId === "melee_strength" ? 3 : 0;
  const effectiveStr = strLevel + styleBonus + Math.floor((b.strengthBonus || 0) * 0.25);
  return Math.max(1, Math.floor(effectiveStr * 0.4 + 1));
}

/**
 * Calculate the player's accuracy (0.0 to 1.0) against a monster.
 * @param {object} skills - Player skills from state.
 * @param {string} styleId - Combat style ID.
 * @param {number} monsterDefence - Monster's defence level.
 * @param {object} [bonuses] - Equipment bonuses.
 * @param {object} [boosts] - Potion boosts: { attack: +X, magic: +Y, ... }.
 * @returns {number} Hit chance 0.0 to 1.0.
 */
export function getAccuracy(skills, styleId, monsterDefence, bonuses, boosts) {
  const b = bonuses || ZERO_BONUSES;
  const pb = boosts || {};
  const style = COMBAT_STYLES[styleId];

  let effectiveAtk;
  if (style && style.category === "magic") {
    const magicLevel = getLevel(skills.magic ? skills.magic.xp : 0) + (pb.magic || 0);
    effectiveAtk = magicLevel + Math.floor((b.magicBonus || 0) * 0.25);
  } else if (style && style.category === "ranged") {
    const rangedLevel = getLevel(skills.ranged ? skills.ranged.xp : 0) + (pb.ranged || 0);
    effectiveAtk = rangedLevel + Math.floor((b.rangedBonus || 0) * 0.25);
  } else {
    const atkLevel = getLevel(skills.attack ? skills.attack.xp : 0) + (pb.attack || 0);
    const styleBonus = styleId === "melee_attack" ? 3 : 0;
    effectiveAtk = atkLevel + styleBonus + Math.floor((b.attackBonus || 0) * 0.25);
  }

  const roll = effectiveAtk / (effectiveAtk + monsterDefence);
  return Math.min(0.95, Math.max(0.05, roll));
}

/**
 * Simulate a single fight between the player and a monster.
 *
 * @param {object} skills - Player's skills.
 * @param {object} monster - Monster definition.
 * @param {string} styleId - Combat style ID.
 * @param {object} [bonuses] - Equipment bonuses.
 * @param {object} [foodState] - { items: [{id, healAmount}], nextIndex: number }.
 * @param {object} [ammoInfo] - { spell, arrow, runesLeft, arrowsLeft }.
 * @param {object} [boosts] - Potion boosts: { attack: +X, strength: +Y, ... }.
 * @param {boolean} [superRestoreAlreadyUsed] - Whether Super Restore was already consumed this adventure.
 * @returns {{ won, hpLost, xpGains, foodEaten, ammoUsed: { runesUsed: object, arrowsUsed: number }, superRestoreTriggered: boolean }}
 */
export function simulateFight(skills, monster, styleId, bonuses, foodState, ammoInfo, boosts, superRestoreAlreadyUsed) {
  const b = bonuses || ZERO_BONUSES;
  const pb = boosts || {};
  const style = COMBAT_STYLES[styleId];
  const ammoUsed = { runesUsed: {}, arrowsUsed: 0 };

  // Check ammo availability for magic/ranged
  let hasAmmo = true;
  if (style && style.category === "magic") {
    if (!ammoInfo || !ammoInfo.spell || ammoInfo.runesLeft <= 0) hasAmmo = false;
  }
  if (style && style.category === "ranged") {
    if (!ammoInfo || !ammoInfo.arrow || ammoInfo.arrowsLeft <= 0) hasAmmo = false;
  }

  // If no ammo for magic/ranged, player can't attack effectively
  const maxHit = hasAmmo ? getMaxHit(skills, styleId, b, ammoInfo, pb) : 1;
  const accuracy = getAccuracy(skills, styleId, monster.defence, b, pb);
  const playerMaxHp = getLevel(skills.hitpoints.xp) * 10;

  const boostSnapshot = Object.freeze(Object.assign({}, pb));

  let monsterHp = monster.hp;
  let playerHpLost = 0;
  let foodEaten = 0;
  let rounds = 0;
  const maxRounds = 100;
  let currentFoodIdx = foodState ? foodState.nextIndex : 0;
  let superRestoreUsed = !!superRestoreAlreadyUsed;

  // Consume ammo for this fight (1 per fight for simplicity)
  if (hasAmmo && style) {
    if (style.category === "magic" && ammoInfo && ammoInfo.spell) {
      for (const [runeId, qty] of Object.entries(ammoInfo.spell.runeCost)) {
        ammoUsed.runesUsed[runeId] = (ammoUsed.runesUsed[runeId] || 0) + qty;
      }
      ammoInfo.runesLeft--;
    }
    if (style.category === "ranged" && ammoInfo) {
      ammoUsed.arrowsUsed = 1;
      ammoInfo.arrowsLeft--;
    }
  }

  while (monsterHp > 0 && playerHpLost < playerMaxHp && rounds < maxRounds) {
    rounds++;

    // Player attacks
    if (Math.random() < accuracy) {
      const damage = Math.floor(Math.random() * (maxHit + 1));
      monsterHp -= damage;
    }

    // Monster attacks back (if still alive)
    if (monsterHp > 0) {
      const defLevel = getLevel(skills.defence.xp) + (pb.defence || 0);
      const defBonus = Math.floor((b.defenceBonus || 0) * 0.25);
      const effectiveDef = defLevel + (styleId === "melee_defence" ? 3 : 0) + defBonus;
      const monsterAccuracy = Math.min(0.8, monster.attack / (monster.attack + effectiveDef));

      if (Math.random() < monsterAccuracy) {
        const damage = Math.floor(Math.random() * (monster.maxHit + 1));
        playerHpLost += damage;
      }
    }

    // Auto-eat food if HP < 30%
    if (foodState && playerHpLost > playerMaxHp * 0.7) {
      if (currentFoodIdx < foodState.items.length) {
        const food = foodState.items[currentFoodIdx];
        playerHpLost = Math.max(0, playerHpLost - food.healAmount);
        currentFoodIdx++;
        foodEaten++;
      }
    }

    // Super Restore — emergency heal once per fight when HP drops below 50%
    if (!superRestoreUsed && pb.superRestore && playerHpLost > playerMaxHp * 0.5) {
      playerHpLost = Math.max(0, playerHpLost - Math.floor(playerMaxHp * pb.superRestore));
      for (const key of Object.keys(boostSnapshot)) {
        pb[key] = boostSnapshot[key];
      }
      superRestoreUsed = true;
    }
  }

  const won = monsterHp <= 0;

  const xpGains = {};
  if (won) {
    const baseXp = monster.hp;
    for (const [skill, multiplier] of Object.entries(style.xpSplit)) {
      xpGains[skill] = Math.floor(baseXp * multiplier);
    }
  }

  if (foodState) {
    foodState.nextIndex = currentFoodIdx;
  }

  return { won, hpLost: playerHpLost, xpGains, foodEaten, ammoUsed, superRestoreTriggered: superRestoreUsed && !superRestoreAlreadyUsed };
}

/**
 * Simulate an entire adventure's worth of fights.
 *
 * @param {object} skills - Player's skills from state.
 * @param {Array} monsterPool - Array of monster objects.
 * @param {string} styleId - Combat style ID.
 * @param {number} durationMinutes - Adventure duration in minutes.
 * @param {object} [bonuses] - Equipment bonuses.
 * @param {Array} [foodItems] - Array of { id, healAmount } for food consumption.
 * @param {Array} [inventory] - Current inventory (for ammo checks).
 * @param {object} [boosts] - Potion boosts: { attack: +X, strength: +Y, ... }.
 * @returns {{ monstersKilled, totalXpGains, loot, fled, gpGained, foodConsumed, ammoConsumed }}
 */
export function simulateAdventure(skills, monsterPool, styleId, durationMinutes, bonuses, foodItems, inventory, boosts) {
  const totalFights = Math.floor(durationMinutes * 2);
  const playerMaxHp = getLevel(skills.hitpoints.xp) * 10;
  let currentHpLost = 0;
  const style = COMBAT_STYLES[styleId];
  let superRestoreUsedThisAdventure = false;

  let monstersKilled = 0;
  const totalXpGains = {};
  const lootAccumulator = {};
  let gpGained = 0;
  let fled = false;

  const foodState = foodItems && foodItems.length > 0
    ? { items: foodItems, nextIndex: 0 }
    : null;

  // Set up ammo info for magic/ranged
  let ammoInfo = null;
  const totalAmmoConsumed = { runesUsed: {}, arrowsUsed: 0 };

  if (style && style.category === "magic" && inventory) {
    const spell = getBestSpell(skills.magic.xp, inventory);
    if (spell) {
      ammoInfo = { spell, runesLeft: getMaxCasts(spell, inventory) };
    }
  }
  if (style && style.category === "ranged" && inventory) {
    const arrow = getBestArrow(skills.ranged.xp, inventory);
    if (arrow) {
      ammoInfo = { arrow, arrowsLeft: getArrowCount(arrow.id, inventory) };
    }
  }

  for (let i = 0; i < totalFights; i++) {
    const monster = monsterPool[Math.floor(Math.random() * monsterPool.length)];

    const result = simulateFight(skills, monster, styleId, bonuses, foodState, ammoInfo, boosts, superRestoreUsedThisAdventure);
    if (result.superRestoreTriggered) superRestoreUsedThisAdventure = true;
    currentHpLost += result.hpLost;

    // Rest between fights (recover 10% HP)
    currentHpLost = Math.max(0, currentHpLost - Math.floor(playerMaxHp * 0.1));

    // Accumulate ammo usage
    if (result.ammoUsed) {
      for (const [runeId, qty] of Object.entries(result.ammoUsed.runesUsed)) {
        totalAmmoConsumed.runesUsed[runeId] = (totalAmmoConsumed.runesUsed[runeId] || 0) + qty;
      }
      totalAmmoConsumed.arrowsUsed += result.ammoUsed.arrowsUsed;
    }

    if (result.won) {
      monstersKilled++;

      for (const [skill, amount] of Object.entries(result.xpGains)) {
        totalXpGains[skill] = (totalXpGains[skill] || 0) + amount;
      }

      for (const drop of monster.lootTable) {
        if (Math.random() < drop.chance) {
          const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
          if (drop.itemId === "gp") {
            gpGained += qty;
          } else {
            lootAccumulator[drop.itemId] = (lootAccumulator[drop.itemId] || 0) + qty;
          }
        }
      }
    } else {
      fled = true;
      break;
    }
  }

  const loot = Object.entries(lootAccumulator).map(([itemId, qty]) => ({ itemId, qty }));
  const foodConsumed = foodState ? foodState.nextIndex : 0;

  return {
    monstersKilled, totalXpGains, loot, fled, gpGained, foodConsumed,
    ammoConsumed: totalAmmoConsumed,
  };
}
