/**
 * Skill Milestones — Permanent rewards at level thresholds.
 *
 * Every 10 levels (10, 20, 30, 40, 50, 60, 70, 80, 90, 99) each skill
 * awards a reward: GP, XP boosts, or items.
 *
 * Milestone rewards are one-time. Checked after every XP gain.
 * State: state.milestones = { "mining_10": true, "fishing_20": true, ... }
 */

import { getLevel } from "./xp.js";

/** Milestone thresholds */
export const MILESTONE_LEVELS = Object.freeze([10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);

/**
 * Skill-specific milestone reward tables.
 * Each entry: { level, gp, xpBonus, items, label }
 * xpBonus: permanent % XP boost for that skill (stacks with achievements)
 */
export const SKILL_MILESTONES = Object.freeze({
  mining: Object.freeze([
    { level: 10, gp: 200,   items: [{ itemId: "copper_ore", qty: 20 }],                label: "Apprentice Miner" },
    { level: 20, gp: 500,   items: [{ itemId: "iron_ore",   qty: 15 }],                label: "Journeyman Miner" },
    { level: 30, gp: 1000,  items: [{ itemId: "coal_ore",   qty: 20 }],                label: "Expert Miner" },
    { level: 40, gp: 2000,  items: [{ itemId: "iron_bar",   qty: 10 }],                label: "Master Miner" },
    { level: 50, gp: 3000,  items: [{ itemId: "mithril_ore", qty: 10 }], xpBonus: 0.05, label: "Ore Lord" },
    { level: 60, gp: 5000,  items: [],                                    xpBonus: 0.05, label: "Deep Delver" },
    { level: 70, gp: 8000,  items: [{ itemId: "steel_bar",  qty: 5 }],   xpBonus: 0.05, label: "Vein Hunter" },
    { level: 80, gp: 12000, items: [],                                    xpBonus: 0.10, label: "Rockbreaker" },
    { level: 90, gp: 18000, items: [{ itemId: "mithril_bar", qty: 5 }],  xpBonus: 0.10, label: "Mountain King" },
    { level: 99, gp: 30000, items: [],                                    xpBonus: 0.15, label: "Max Mining" },
  ]),

  fishing: Object.freeze([
    { level: 10, gp: 200,   items: [{ itemId: "cooked_shrimp", qty: 10 }],             label: "Apprentice Fisher" },
    { level: 20, gp: 500,   items: [{ itemId: "cooked_trout",  qty: 5 }],              label: "Journeyman Fisher" },
    { level: 30, gp: 1000,  items: [{ itemId: "cooked_trout",  qty: 10 }],             label: "Expert Fisher" },
    { level: 40, gp: 2000,  items: [{ itemId: "cooked_lobster", qty: 5 }],             label: "Master Fisher" },
    { level: 50, gp: 3000,  items: [{ itemId: "cooked_lobster", qty: 10 }], xpBonus: 0.05, label: "Deep Sea Fisher" },
    { level: 60, gp: 5000,  items: [{ itemId: "cooked_swordfish", qty: 5 }], xpBonus: 0.05, label: "Sea Captain" },
    { level: 70, gp: 8000,  items: [],                                       xpBonus: 0.05, label: "Ocean Master" },
    { level: 80, gp: 12000, items: [{ itemId: "cooked_swordfish", qty: 10 }], xpBonus: 0.10, label: "Tide Caller" },
    { level: 90, gp: 18000, items: [],                                         xpBonus: 0.10, label: "Leviathan Bane" },
    { level: 99, gp: 30000, items: [],                                         xpBonus: 0.15, label: "Max Fishing" },
  ]),

  woodcutting: Object.freeze([
    { level: 10, gp: 200,   items: [{ itemId: "normal_log", qty: 20 }],               label: "Apprentice Lumberjack" },
    { level: 20, gp: 500,   items: [{ itemId: "oak_log",    qty: 15 }],               label: "Journeyman Logger" },
    { level: 30, gp: 1000,  items: [{ itemId: "willow_log", qty: 10 }],               label: "Expert Woodcutter" },
    { level: 40, gp: 2000,  items: [{ itemId: "maple_log",  qty: 10 }],               label: "Master Woodcutter" },
    { level: 50, gp: 3000,  items: [{ itemId: "yew_log",    qty: 5 }],  xpBonus: 0.05, label: "Forest Warden" },
    { level: 60, gp: 5000,  items: [{ itemId: "yew_log",    qty: 10 }], xpBonus: 0.05, label: "Canopy Walker" },
    { level: 70, gp: 8000,  items: [],                                   xpBonus: 0.05, label: "Treefeller" },
    { level: 80, gp: 12000, items: [],                                   xpBonus: 0.10, label: "Ancient Woodsman" },
    { level: 90, gp: 18000, items: [{ itemId: "yew_log",   qty: 20 }],  xpBonus: 0.10, label: "Forest King" },
    { level: 99, gp: 30000, items: [],                                   xpBonus: 0.15, label: "Max Woodcutting" },
  ]),

  firemaking: Object.freeze([
    { level: 10, gp: 150,   items: [],                                                 label: "Spark Starter" },
    { level: 20, gp: 350,   items: [{ itemId: "normal_log", qty: 15 }],               label: "Campfire Maker" },
    { level: 30, gp: 700,   items: [{ itemId: "oak_log",    qty: 10 }],               label: "Flame Keeper" },
    { level: 40, gp: 1500,  items: [],                                  xpBonus: 0.03, label: "Bonfire Master" },
    { level: 50, gp: 2500,  items: [{ itemId: "willow_log", qty: 10 }], xpBonus: 0.05, label: "Pyromancer" },
    { level: 60, gp: 4000,  items: [],                                   xpBonus: 0.05, label: "Inferno Caller" },
    { level: 70, gp: 6000,  items: [{ itemId: "maple_log",  qty: 10 }], xpBonus: 0.05, label: "Blaze Herald" },
    { level: 80, gp: 10000, items: [],                                   xpBonus: 0.10, label: "Ash Walker" },
    { level: 90, gp: 15000, items: [{ itemId: "yew_log",    qty: 10 }], xpBonus: 0.10, label: "Phoenix Friend" },
    { level: 99, gp: 25000, items: [],                                   xpBonus: 0.15, label: "Max Firemaking" },
  ]),

  alchemy: Object.freeze([
    { level: 10, gp: 200,   items: [{ itemId: "copper_ore", qty: 15 }],               label: "Ore Apprentice" },
    { level: 20, gp: 500,   items: [{ itemId: "tin_ore",    qty: 15 }],               label: "Smelter" },
    { level: 30, gp: 1000,  items: [{ itemId: "iron_ore",   qty: 10 }],               label: "Furnace Keeper" },
    { level: 40, gp: 2000,  items: [{ itemId: "iron_bar",   qty: 5 }],                label: "Alchemist" },
    { level: 50, gp: 3500,  items: [{ itemId: "steel_bar",  qty: 5 }],  xpBonus: 0.05, label: "Steel Forger" },
    { level: 60, gp: 5500,  items: [],                                   xpBonus: 0.05, label: "Grand Alchemist" },
    { level: 70, gp: 8000,  items: [{ itemId: "mithril_bar", qty: 3 }], xpBonus: 0.05, label: "Mithril Master" },
    { level: 80, gp: 12000, items: [],                                   xpBonus: 0.10, label: "Arcane Smelter" },
    { level: 90, gp: 20000, items: [{ itemId: "mithril_bar", qty: 5 }], xpBonus: 0.10, label: "Transmuter" },
    { level: 99, gp: 35000, items: [],                                   xpBonus: 0.15, label: "Max Alchemy" },
  ]),

  smithing: Object.freeze([
    { level: 10, gp: 250,   items: [{ itemId: "copper_bar", qty: 5 }],                label: "Apprentice Smith" },
    { level: 20, gp: 600,   items: [{ itemId: "tin_bar",    qty: 5 }],                label: "Journeyman Smith" },
    { level: 30, gp: 1200,  items: [{ itemId: "iron_bar",   qty: 5 }],                label: "Expert Smith" },
    { level: 40, gp: 2500,  items: [{ itemId: "iron_sword", qty: 1 }],                label: "Master Smith" },
    { level: 50, gp: 4000,  items: [{ itemId: "steel_bar",  qty: 3 }],  xpBonus: 0.05, label: "Weaponsmith" },
    { level: 60, gp: 6000,  items: [],                                   xpBonus: 0.05, label: "Armorsmith" },
    { level: 70, gp: 9000,  items: [{ itemId: "mithril_bar", qty: 2 }], xpBonus: 0.05, label: "Grand Smith" },
    { level: 80, gp: 14000, items: [],                                   xpBonus: 0.10, label: "Legendary Smith" },
    { level: 90, gp: 22000, items: [{ itemId: "mithril_bar", qty: 3 }], xpBonus: 0.10, label: "Mythic Forger" },
    { level: 99, gp: 40000, items: [],                                   xpBonus: 0.15, label: "Max Smithing" },
  ]),

  cooking: Object.freeze([
    { level: 10, gp: 150,   items: [{ itemId: "cooked_shrimp", qty: 5 }],             label: "Cook's Apprentice" },
    { level: 20, gp: 400,   items: [{ itemId: "cooked_trout",  qty: 3 }],             label: "Home Cook" },
    { level: 30, gp: 800,   items: [{ itemId: "cooked_trout",  qty: 5 }],             label: "Skilled Chef" },
    { level: 40, gp: 1600,  items: [{ itemId: "cooked_lobster", qty: 3 }],            label: "Master Chef" },
    { level: 50, gp: 3000,  items: [{ itemId: "cooked_lobster", qty: 5 }], xpBonus: 0.05, label: "Gourmet" },
    { level: 60, gp: 4500,  items: [{ itemId: "cooked_swordfish", qty: 3 }], xpBonus: 0.05, label: "Grand Chef" },
    { level: 70, gp: 7000,  items: [],                                        xpBonus: 0.05, label: "Culinary Artist" },
    { level: 80, gp: 11000, items: [{ itemId: "cooked_swordfish", qty: 5 }],  xpBonus: 0.10, label: "Legendary Cook" },
    { level: 90, gp: 17000, items: [],                                         xpBonus: 0.10, label: "Divine Chef" },
    { level: 99, gp: 28000, items: [],                                         xpBonus: 0.15, label: "Max Cooking" },
  ]),

  attack: Object.freeze([
    { level: 10, gp: 300,   items: [],                                                 label: "Trainee Warrior" },
    { level: 20, gp: 700,   items: [{ itemId: "copper_sword", qty: 1 }],              label: "Fighter" },
    { level: 30, gp: 1500,  items: [{ itemId: "tin_sword",    qty: 1 }],              label: "Swordsman" },
    { level: 40, gp: 3000,  items: [{ itemId: "iron_sword",   qty: 1 }],              label: "Veteran" },
    { level: 50, gp: 5000,  items: [],                                  xpBonus: 0.05, label: "Knight" },
    { level: 60, gp: 8000,  items: [],                                  xpBonus: 0.05, label: "Champion" },
    { level: 70, gp: 12000, items: [],                                  xpBonus: 0.05, label: "Warlord" },
    { level: 80, gp: 18000, items: [],                                  xpBonus: 0.10, label: "Destroyer" },
    { level: 90, gp: 26000, items: [],                                  xpBonus: 0.10, label: "Blade Master" },
    { level: 99, gp: 45000, items: [],                                  xpBonus: 0.15, label: "Max Attack" },
  ]),

  strength: Object.freeze([
    { level: 10, gp: 300,   items: [],                                                 label: "Strong Arm" },
    { level: 20, gp: 700,   items: [],                                                 label: "Muscle" },
    { level: 30, gp: 1500,  items: [],                                                 label: "Brute" },
    { level: 40, gp: 3000,  items: [],                                  xpBonus: 0.03, label: "Crusher" },
    { level: 50, gp: 5000,  items: [],                                  xpBonus: 0.05, label: "Berserker" },
    { level: 60, gp: 8000,  items: [],                                  xpBonus: 0.05, label: "Titan" },
    { level: 70, gp: 12000, items: [],                                  xpBonus: 0.05, label: "Colossus" },
    { level: 80, gp: 18000, items: [],                                  xpBonus: 0.10, label: "Giant Slayer" },
    { level: 90, gp: 26000, items: [],                                  xpBonus: 0.10, label: "Mountain Breaker" },
    { level: 99, gp: 45000, items: [],                                  xpBonus: 0.15, label: "Max Strength" },
  ]),

  defence: Object.freeze([
    { level: 10, gp: 300,   items: [{ itemId: "copper_shield", qty: 1 }],             label: "Shield Bearer" },
    { level: 20, gp: 700,   items: [{ itemId: "copper_armor",  qty: 1 }],             label: "Guard" },
    { level: 30, gp: 1500,  items: [{ itemId: "tin_shield",    qty: 1 }],             label: "Defender" },
    { level: 40, gp: 3000,  items: [{ itemId: "iron_shield",   qty: 1 }],             label: "Protector" },
    { level: 50, gp: 5000,  items: [],                                  xpBonus: 0.05, label: "Bulwark" },
    { level: 60, gp: 8000,  items: [],                                  xpBonus: 0.05, label: "Fortress" },
    { level: 70, gp: 12000, items: [],                                  xpBonus: 0.05, label: "Ironwall" },
    { level: 80, gp: 18000, items: [],                                  xpBonus: 0.10, label: "Unbreakable" },
    { level: 90, gp: 26000, items: [],                                  xpBonus: 0.10, label: "Immortal Guard" },
    { level: 99, gp: 45000, items: [],                                  xpBonus: 0.15, label: "Max Defence" },
  ]),

  hitpoints: Object.freeze([
    { level: 10, gp: 200,   items: [{ itemId: "cooked_shrimp", qty: 5 }],             label: "Tough" },
    { level: 20, gp: 500,   items: [{ itemId: "cooked_trout",  qty: 3 }],             label: "Hardy" },
    { level: 30, gp: 1000,  items: [{ itemId: "cooked_lobster", qty: 2 }],            label: "Resilient" },
    { level: 40, gp: 2000,  items: [],                                                 label: "Enduring" },
    { level: 50, gp: 3500,  items: [],                                  xpBonus: 0.05, label: "Vital" },
    { level: 60, gp: 5500,  items: [{ itemId: "cooked_swordfish", qty: 3 }], xpBonus: 0.05, label: "Ironhide" },
    { level: 70, gp: 8500,  items: [],                                         xpBonus: 0.05, label: "Undying" },
    { level: 80, gp: 13000, items: [],                                         xpBonus: 0.10, label: "Unkillable" },
    { level: 90, gp: 20000, items: [],                                         xpBonus: 0.10, label: "Deathless" },
    { level: 99, gp: 35000, items: [],                                         xpBonus: 0.15, label: "Max Hitpoints" },
  ]),

  magic: Object.freeze([
    { level: 10, gp: 300,   items: [{ itemId: "air_rune",  qty: 30 }],                label: "Novice Mage" },
    { level: 20, gp: 700,   items: [{ itemId: "fire_rune", qty: 30 }],                label: "Apprentice Mage" },
    { level: 30, gp: 1500,  items: [{ itemId: "air_rune",  qty: 50 }],                label: "Mage" },
    { level: 40, gp: 3000,  items: [{ itemId: "fire_rune", qty: 50 }],                label: "Sorcerer" },
    { level: 50, gp: 5000,  items: [],                                  xpBonus: 0.05, label: "Wizard" },
    { level: 60, gp: 8000,  items: [],                                  xpBonus: 0.05, label: "Archmage" },
    { level: 70, gp: 12000, items: [{ itemId: "air_rune",  qty: 100 }], xpBonus: 0.05, label: "Void Caller" },
    { level: 80, gp: 18000, items: [],                                   xpBonus: 0.10, label: "Runelord" },
    { level: 90, gp: 27000, items: [],                                   xpBonus: 0.10, label: "Spellweaver" },
    { level: 99, gp: 45000, items: [],                                   xpBonus: 0.15, label: "Max Magic" },
  ]),

  ranged: Object.freeze([
    { level: 10, gp: 300,   items: [{ itemId: "bronze_arrow", qty: 30 }],             label: "Marksman Cadet" },
    { level: 20, gp: 700,   items: [{ itemId: "iron_arrow",   qty: 30 }],             label: "Bowman" },
    { level: 30, gp: 1500,  items: [{ itemId: "iron_arrow",   qty: 50 }],             label: "Archer" },
    { level: 40, gp: 3000,  items: [{ itemId: "steel_arrow",  qty: 30 }],             label: "Sharpshooter" },
    { level: 50, gp: 5000,  items: [],                                   xpBonus: 0.05, label: "Sniper" },
    { level: 60, gp: 8000,  items: [{ itemId: "steel_arrow",  qty: 50 }], xpBonus: 0.05, label: "Ranger" },
    { level: 70, gp: 12000, items: [],                                     xpBonus: 0.05, label: "Hawkeye" },
    { level: 80, gp: 18000, items: [],                                     xpBonus: 0.10, label: "Longbow Master" },
    { level: 90, gp: 27000, items: [],                                     xpBonus: 0.10, label: "Arrow Saint" },
    { level: 99, gp: 45000, items: [],                                     xpBonus: 0.15, label: "Max Ranged" },
  ]),
});

/**
 * Check which milestones were newly crossed for a skill.
 * @param {string} skillId
 * @param {number} oldXp
 * @param {number} newXp
 * @param {object} claimedMilestones - state.milestones map
 * @returns {Array} Array of milestone objects that are newly earned
 */
export function checkNewMilestones(skillId, oldXp, newXp, claimedMilestones) {
  const milestones = SKILL_MILESTONES[skillId];
  if (!milestones) return [];

  const oldLevel = getLevel(oldXp);
  const newLevel = getLevel(newXp);
  if (newLevel <= oldLevel) return [];

  const earned = [];
  for (const milestone of milestones) {
    const key = `${skillId}_${milestone.level}`;
    if (claimedMilestones[key]) continue;
    if (newLevel >= milestone.level && oldLevel < milestone.level) {
      earned.push({ ...milestone, skillId, key });
    }
  }
  return earned;
}

/**
 * Get total XP bonus from milestones for a given skill.
 * @param {string} skillId
 * @param {object} claimedMilestones
 * @returns {number} Total bonus multiplier (e.g. 0.15 = +15%)
 */
export function getMilestoneXpBonus(skillId, claimedMilestones) {
  const milestones = SKILL_MILESTONES[skillId];
  if (!milestones) return 0;
  let total = 0;
  for (const m of milestones) {
    if (m.xpBonus && claimedMilestones[`${skillId}_${m.level}`]) {
      total += m.xpBonus;
    }
  }
  return total;
}
