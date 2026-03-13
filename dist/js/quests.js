/**
 * Quest System — Definitions, progress tracking, rewards.
 *
 * Quests track objectives and award rewards on completion.
 * Progress is checked against the current game state.
 */

import { getLevel } from "./xp.js";

export const QUESTS = Object.freeze({
  first_blood: Object.freeze({
    id: "first_blood",
    name: "First Blood",
    icon: "assets/quest_sword.svg",
    description: "Kill your first monster on an adventure.",
    requirement: "Complete 1 adventure with at least 1 kill.",
    objectives: Object.freeze([
      Object.freeze({ type: "monsters_killed", target: 1, label: "Kill 1 monster" }),
    ]),
    rewards: Object.freeze({
      gp: 100,
      xp: { attack: 50 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  pest_control: Object.freeze({
    id: "pest_control",
    name: "Pest Control",
    icon: "assets/quest_shield.svg",
    description: "The crossroad is overrun with giant roaches. Clear them out.",
    requirement: "Kill 10 monsters total.",
    objectives: Object.freeze([
      Object.freeze({ type: "monsters_killed", target: 10, label: "Kill 10 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 300,
      xp: { strength: 100, defence: 50 },
      items: [{ itemId: "tin_ore", qty: 20 }],
    }),
    minCombatLevel: 1,
  }),

  into_the_woods: Object.freeze({
    id: "into_the_woods",
    name: "Into the Woods",
    icon: "assets/quest_forest.svg",
    description: "Venture into The Bone Woods and survive.",
    requirement: "Complete an adventure in The Bone Woods.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "bone_woods", label: "Complete a Bone Woods adventure" }),
    ]),
    rewards: Object.freeze({
      gp: 500,
      xp: { hitpoints: 200 },
      items: [{ itemId: "iron_ore", qty: 15 }],
    }),
    minCombatLevel: 8,
  }),

  deep_delver: Object.freeze({
    id: "deep_delver",
    name: "Deep Delver",
    icon: "assets/quest_cave.svg",
    description: "Descend into the Ashen Caves. Few return.",
    requirement: "Complete an adventure in Ashen Caves.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "ashen_caves", label: "Complete an Ashen Caves adventure" }),
    ]),
    rewards: Object.freeze({
      gp: 1000,
      xp: { attack: 200, strength: 200, defence: 200 },
      items: [{ itemId: "iron_bar", qty: 5 }],
    }),
    minCombatLevel: 20,
  }),

  // ── Magic & Ranged unlock quests ──

  arcane_spark: Object.freeze({
    id: "arcane_spark",
    name: "Arcane Spark",
    icon: "assets/quest_magic.svg",
    description: "The old mage senses potential in you. Prove your worth to unlock the arcane arts.",
    requirement: "Complete Ashen Caves and kill 50 monsters.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "ashen_caves", label: "Complete an Ashen Caves adventure" }),
      Object.freeze({ type: "monsters_killed", target: 50, label: "Kill 50 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 500,
      xp: { magic: 100 },
      items: [
        { itemId: "air_rune", qty: 50 },
        { itemId: "fire_rune", qty: 30 },
      ],
      unlocks: ["magic"],
    }),
    minCombatLevel: 20,
  }),

  hunters_eye: Object.freeze({
    id: "hunters_eye",
    name: "Hunter's Eye",
    icon: "assets/quest_ranged.svg",
    description: "A ranger in the woods offers to teach you the way of the bow.",
    requirement: "Complete The Bone Woods and kill 25 monsters.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "bone_woods", label: "Complete a Bone Woods adventure" }),
      Object.freeze({ type: "monsters_killed", target: 25, label: "Kill 25 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 300,
      xp: { ranged: 100 },
      items: [
        { itemId: "bronze_arrow", qty: 100 },
      ],
      unlocks: ["ranged"],
    }),
    minCombatLevel: 10,
  }),

  // ── Mid-game quests ──

  steel_resolve: Object.freeze({
    id: "steel_resolve",
    name: "Steel Resolve",
    icon: "assets/quest_steel.svg",
    description: "The blacksmith needs steel. Prove you can handle the heat of Dragon's Hollow.",
    requirement: "Complete Dragon's Hollow and kill 100 monsters.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "dragons_hollow", label: "Complete a Dragon's Hollow adventure" }),
      Object.freeze({ type: "monsters_killed", target: 100, label: "Kill 100 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 1500,
      xp: { smithing: 500, mining: 300 },
      items: [
        { itemId: "steel_bar", qty: 10 },
        { itemId: "coal_ore", qty: 30 },
      ],
    }),
    minCombatLevel: 35,
  }),

  arcane_mastery: Object.freeze({
    id: "arcane_mastery",
    name: "Arcane Mastery",
    icon: "assets/quest_mage.svg",
    description: "Master the elements. The mage tower's secrets await the truly devoted.",
    requirement: "Kill 200 monsters and complete Dragon's Hollow.",
    objectives: Object.freeze([
      Object.freeze({ type: "monsters_killed", target: 200, label: "Kill 200 monsters" }),
      Object.freeze({ type: "location_completed", target: "dragons_hollow", label: "Complete a Dragon's Hollow adventure" }),
    ]),
    rewards: Object.freeze({
      gp: 2000,
      xp: { magic: 1000 },
      items: [
        { itemId: "earth_rune", qty: 50 },
        { itemId: "water_rune", qty: 50 },
        { itemId: "wizard_robe", qty: 1 },
      ],
    }),
    minCombatLevel: 35,
  }),

  // ── Endgame quests ──

  shadow_conqueror: Object.freeze({
    id: "shadow_conqueror",
    name: "Shadow Conqueror",
    icon: "assets/quest_fortress.svg",
    description: "Break through the Shadow Fortress. Only the strongest survive its halls.",
    requirement: "Complete Shadow Fortress and kill 500 monsters.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "shadow_fortress", label: "Complete a Shadow Fortress adventure" }),
      Object.freeze({ type: "monsters_killed", target: 500, label: "Kill 500 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 5000,
      xp: { attack: 1000, strength: 1000, defence: 1000, hitpoints: 500 },
      items: [
        { itemId: "mithril_bar", qty: 5 },
      ],
    }),
    minCombatLevel: 50,
  }),

  dragon_slayer: Object.freeze({
    id: "dragon_slayer",
    name: "Dragon Slayer",
    icon: "assets/quest_dragon.svg",
    description: "Slay the young dragons of the Hollow. Prove you are the realm's champion.",
    requirement: "Kill 1000 monsters and complete Shadow Fortress.",
    objectives: Object.freeze([
      Object.freeze({ type: "monsters_killed", target: 1000, label: "Kill 1,000 monsters" }),
      Object.freeze({ type: "location_completed", target: "shadow_fortress", label: "Complete Shadow Fortress" }),
    ]),
    rewards: Object.freeze({
      gp: 10000,
      xp: { attack: 2000, strength: 2000, defence: 2000, hitpoints: 2000 },
      items: [
        { itemId: "mithril_bar", qty: 10 },
        { itemId: "steel_arrow", qty: 200 },
      ],
    }),
    minCombatLevel: 50,
  }),

  // ── New quests (Ship It Done) ──

  miners_apprentice: Object.freeze({
    id: "miners_apprentice",
    name: "Miner's Apprentice",
    icon: "assets/skill_mining.svg",
    description: "The old miner sees promise in you. Prove your worth at the rocks.",
    requirement: "Reach Mining level 10.",
    objectives: Object.freeze([
      Object.freeze({ type: "skill_level", skill: "mining", target: 10, label: "Reach Mining level 10" }),
    ]),
    rewards: Object.freeze({
      gp: 500,
      xp: { mining: 100 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  the_angler: Object.freeze({
    id: "the_angler",
    name: "The Angler",
    icon: "assets/skill_fishing.svg",
    description: "The dock master challenges you to fill his basket.",
    requirement: "Catch 20 fish.",
    objectives: Object.freeze([
      Object.freeze({ type: "fish_caught", target: 20, label: "Catch 20 fish" }),
    ]),
    rewards: Object.freeze({
      gp: 200,
      xp: { fishing: 150 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  smelt_it_down: Object.freeze({
    id: "smelt_it_down",
    name: "Smelt It Down",
    icon: "assets/skill_alchemy.svg",
    description: "The furnace burns hot. Time to put those ores to work.",
    requirement: "Smelt 30 bars.",
    objectives: Object.freeze([
      Object.freeze({ type: "items_crafted", target: 30, label: "Craft 30 items" }),
    ]),
    rewards: Object.freeze({
      gp: 300,
      xp: { alchemy: 200 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  iron_will: Object.freeze({
    id: "iron_will",
    name: "Iron Will",
    icon: "assets/skill_strength.svg",
    description: "A well-rounded adventurer is a strong adventurer.",
    requirement: "Reach total level 50.",
    objectives: Object.freeze([
      Object.freeze({ type: "total_level", target: 50, label: "Reach total level 50" }),
    ]),
    rewards: Object.freeze({
      gp: 1000,
      xp: {},
      items: [],
    }),
    minCombatLevel: 1,
  }),

  pet_collector: Object.freeze({
    id: "pet_collector",
    name: "Pet Collector",
    icon: "assets/pet_rock_crab.svg",
    description: "Every adventurer needs a loyal companion. Find your first pet.",
    requirement: "Obtain your first pet.",
    objectives: Object.freeze([
      Object.freeze({ type: "pets_owned", target: 1, label: "Own 1 pet" }),
    ]),
    rewards: Object.freeze({
      gp: 2000,
      xp: {},
      items: [],
    }),
    minCombatLevel: 1,
  }),

  the_lumberjack: Object.freeze({
    id: "the_lumberjack",
    name: "The Lumberjack",
    icon: "assets/skill_woodcutting.svg",
    description: "The forest provides, but only to those who chop.",
    requirement: "Cut 50 logs.",
    objectives: Object.freeze([
      Object.freeze({ type: "logs_cut", target: 50, label: "Cut 50 logs" }),
    ]),
    rewards: Object.freeze({
      gp: 400,
      xp: { woodcutting: 200 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  fire_starter: Object.freeze({
    id: "fire_starter",
    name: "Fire Starter",
    icon: "assets/skill_firemaking.svg",
    description: "Nothing warms the soul like a roaring fire.",
    requirement: "Burn 30 logs.",
    objectives: Object.freeze([
      Object.freeze({ type: "logs_burned", target: 30, label: "Burn 30 logs" }),
    ]),
    rewards: Object.freeze({
      gp: 300,
      xp: { firemaking: 200 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  master_chef: Object.freeze({
    id: "master_chef",
    name: "Master Chef",
    icon: "assets/skill_cooking.svg",
    description: "A full belly is the best armor. Time to master the kitchen.",
    requirement: "Cook 50 fish.",
    objectives: Object.freeze([
      Object.freeze({ type: "food_cooked", target: 50, label: "Cook 50 food" }),
    ]),
    rewards: Object.freeze({
      gp: 500,
      xp: { cooking: 300 },
      items: [],
    }),
    minCombatLevel: 1,
  }),

  dragons_bane: Object.freeze({
    id: "dragons_bane",
    name: "Dragon's Bane",
    icon: "assets/quest_dragon.svg",
    description: "The Shadow Fortress trembles. Prove you can survive its darkest halls.",
    requirement: "Kill 100 monsters in Shadow Fortress.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "shadow_fortress", label: "Complete Shadow Fortress" }),
      Object.freeze({ type: "monsters_killed", target: 100, label: "Kill 100 monsters" }),
    ]),
    rewards: Object.freeze({
      gp: 5000,
      xp: { attack: 500, strength: 500 },
      items: [{ itemId: "mithril_bar", qty: 3 }],
    }),
    minCombatLevel: 50,
  }),

  // ── Phase 3 new quests ──

  lost_pickaxe: Object.freeze({
    id: "lost_pickaxe",
    name: "The Lost Pickaxe",
    icon: "assets/skill_mining.svg",
    description: "Old Edric the miner lost his pickaxe deep in the rocks. Bring him ore to prove you know your way around a mine.",
    requirement: "Mine 20 ore of any kind.",
    objectives: Object.freeze([
      Object.freeze({ type: "items_crafted", target: 0, label: "" }), // dummy — uses logs_cut-style stat
      Object.freeze({ type: "skill_level", skill: "mining", target: 5, label: "Reach Mining level 5" }),
    ]),
    rewards: Object.freeze({
      gp: 400,
      xp: { mining: 200 },
      items: [{ itemId: "iron_ore", qty: 10 }],
    }),
    minCombatLevel: 1,
  }),

  fishers_tale: Object.freeze({
    id: "fishers_tale",
    name: "A Fisher's Tale",
    icon: "assets/skill_fishing.svg",
    description: "The old harbour woman claims she once caught a fish that could talk. Catch 15 fish and cook 10 to earn her trust.",
    requirement: "Catch 15 fish and cook 10 food.",
    objectives: Object.freeze([
      Object.freeze({ type: "fish_caught", target: 15, label: "Catch 15 fish" }),
      Object.freeze({ type: "food_cooked", target: 10, label: "Cook 10 food" }),
    ]),
    rewards: Object.freeze({
      gp: 600,
      xp: { fishing: 250, cooking: 200 },
      items: [{ itemId: "cooked_trout", qty: 5 }],
    }),
    minCombatLevel: 1,
  }),

  alchemists_secret: Object.freeze({
    id: "alchemists_secret",
    name: "The Alchemist's Secret",
    icon: "assets/skill_alchemy.svg",
    description: "A reclusive alchemist guards the formula for steel. Reach Alchemy 30 and smelt 50 bars to earn her secrets.",
    requirement: "Reach Alchemy level 30 and smelt 50 total items.",
    objectives: Object.freeze([
      Object.freeze({ type: "skill_level", skill: "alchemy", target: 30, label: "Reach Alchemy level 30" }),
      Object.freeze({ type: "items_crafted", target: 50, label: "Smelt 50 items total" }),
    ]),
    rewards: Object.freeze({
      gp: 1500,
      xp: { alchemy: 500 },
      items: [
        { itemId: "coal_ore", qty: 20 },
        { itemId: "iron_ore", qty: 10 },
      ],
    }),
    minCombatLevel: 1,
  }),

  dragon_slayer_lite: Object.freeze({
    id: "dragon_slayer_lite",
    name: "Dragon Slayer Lite",
    icon: "assets/quest_dragon.svg",
    description: "Legends speak of a hidden hollow beyond Dragon's Hollow where young dragons roam free. Reach combat level 35 and survive the Hollow.",
    requirement: "Reach combat level 35 and complete Dragon's Hollow.",
    objectives: Object.freeze([
      Object.freeze({ type: "location_completed", target: "dragons_hollow", label: "Complete Dragon's Hollow" }),
      Object.freeze({ type: "skill_level", skill: "hitpoints", target: 30, label: "Reach Hitpoints level 30" }),
    ]),
    rewards: Object.freeze({
      gp: 3000,
      xp: { attack: 400, strength: 400, defence: 400 },
      items: [{ itemId: "steel_bar", qty: 5 }],
    }),
    minCombatLevel: 35,
  }),

  the_completionist: Object.freeze({
    id: "the_completionist",
    name: "The Completionist",
    icon: "assets/quest_fortress.svg",
    description: "The ultimate challenge. Complete every quest in the realm.",
    requirement: "Complete all other quests.",
    objectives: Object.freeze([
      Object.freeze({ type: "all_quests_complete", target: 1, label: "Complete all other quests" }),
    ]),
    rewards: Object.freeze({
      gp: 10000,
      xp: {},
      items: [],
    }),
    minCombatLevel: 40,
  }),
});

/** Total number of quests excluding the_completionist (for the completionist check). */
const QUESTS_FOR_COMPLETION = Object.keys(QUESTS).filter((id) => id !== "the_completionist").length;

/**
 * Calculate the total level (sum of all skill levels).
 * @param {object} skills - Player skills from state.
 * @returns {number}
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
 * Get quests available to the player (not yet completed, meets requirements).
 * @param {object} questProgress - Quest progress from state.
 * @param {number} combatLevel - Player's combat level.
 * @returns {Array} Available quests.
 */
export function getAvailableQuests(questProgress, combatLevel) {
  return Object.values(QUESTS).filter((quest) => {
    const progress = questProgress[quest.id];
    if (progress && progress.completed) return false;
    return combatLevel >= quest.minCombatLevel;
  });
}

/**
 * Get all completed quests.
 * @param {object} questProgress - Quest progress from state.
 * @returns {Array} Completed quest definitions.
 */
export function getCompletedQuests(questProgress) {
  return Object.values(QUESTS).filter((quest) => {
    const progress = questProgress[quest.id];
    return progress && progress.completed;
  });
}

/**
 * Check quest objectives against current state.
 * Returns the quest progress object with updated values.
 *
 * @param {object} quest - Quest definition.
 * @param {object} stats - Player stats from state.
 * @param {object} currentProgress - Current quest progress (or empty).
 * @param {object} [fullState] - Full game state (needed for skill_level, pets_owned, total_level, all_quests_complete).
 * @returns {{ objectives: Array<{current, target, done}>, allDone: boolean }}
 */
export function checkQuestProgress(quest, stats, currentProgress, fullState) {
  const objectives = quest.objectives.map((obj) => {
    let current = 0;

    if (obj.type === "monsters_killed") {
      current = stats.monstersKilled || 0;
    } else if (obj.type === "location_completed") {
      current = currentProgress && currentProgress[`loc_${obj.target}`] ? 1 : 0;
    } else if (obj.type === "skill_level" && fullState) {
      const skill = fullState.skills[obj.skill];
      if (skill && skill.unlocked !== false) {
        current = getLevel(skill.xp);
      }
    } else if (obj.type === "items_crafted") {
      current = stats.totalItemsCrafted || 0;
    } else if (obj.type === "gp_earned") {
      current = stats.totalGpEarned || 0;
    } else if (obj.type === "pets_owned" && fullState) {
      current = fullState.pets ? fullState.pets.owned.length : 0;
    } else if (obj.type === "total_level" && fullState) {
      current = getTotalLevel(fullState.skills);
    } else if (obj.type === "fish_caught") {
      current = stats.totalFishCaught || 0;
    } else if (obj.type === "logs_cut") {
      current = stats.totalLogsCut || 0;
    } else if (obj.type === "logs_burned") {
      current = stats.totalLogsBurned || 0;
    } else if (obj.type === "food_cooked") {
      current = stats.totalFoodCooked || 0;
    } else if (obj.type === "all_quests_complete" && fullState) {
      const completedCount = Object.values(fullState.quests).filter((q) => q && q.completed).length;
      current = completedCount >= QUESTS_FOR_COMPLETION ? 1 : 0;
    }

    return {
      label: obj.label,
      current: Math.min(current, typeof obj.target === "number" ? obj.target : 1),
      target: typeof obj.target === "number" ? obj.target : 1,
      done: typeof obj.target === "number" ? current >= obj.target : current > 0,
    };
  });

  return {
    objectives,
    allDone: objectives.every((o) => o.done),
  };
}
