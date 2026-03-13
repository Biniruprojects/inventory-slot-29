/**
 * Achievement Diary — Tiered milestones with permanent rewards.
 *
 * Uses the same milestone-check pattern as lore.js.
 * Tiers: Easy (green), Medium (blue), Hard (red), Elite (gold).
 *
 * Rewards:
 * - Easy: GP bonus
 * - Medium: permanent +1% XP boost
 * - Hard: permanent +2% XP boost
 * - Elite: permanent +5% XP boost
 */

import { getLevel } from "./xp.js";
import { getCombatLevel } from "./adventures.js";

// ─── Tier Definitions ───────────────────────────────────

export const ACHIEVEMENT_TIERS = Object.freeze({
  easy:   Object.freeze({ id: "easy",   label: "Easy",   color: "#50d050", xpBoost: 0 }),
  medium: Object.freeze({ id: "medium", label: "Medium", color: "#5090e0", xpBoost: 0.01 }),
  hard:   Object.freeze({ id: "hard",   label: "Hard",   color: "#e04040", xpBoost: 0.02 }),
  elite:  Object.freeze({ id: "elite",  label: "Elite",  color: "#ffd700", xpBoost: 0.05 }),
});

// ─── Achievement Definitions ────────────────────────────

export const ACHIEVEMENTS = Object.freeze([
  // ── Easy ──
  Object.freeze({
    id: "ach_kill_10",
    tier: "easy",
    name: "First Steps",
    description: "Kill 10 monsters.",
    check: (state) => (state.stats.monstersKilled || 0) >= 10,
    progress: (state) => ({ current: Math.min(state.stats.monstersKilled || 0, 10), target: 10 }),
    reward: { gp: 200 },
  }),
  Object.freeze({
    id: "ach_smelt_10",
    tier: "easy",
    name: "Smelter's Start",
    description: "Craft 10 items.",
    check: (state) => (state.stats.totalItemsCrafted || 0) >= 10,
    progress: (state) => ({ current: Math.min(state.stats.totalItemsCrafted || 0, 10), target: 10 }),
    reward: { gp: 200 },
  }),
  Object.freeze({
    id: "ach_catch_10",
    tier: "easy",
    name: "Gone Fishing",
    description: "Catch 10 fish.",
    check: (state) => (state.stats.totalFishCaught || 0) >= 10,
    progress: (state) => ({ current: Math.min(state.stats.totalFishCaught || 0, 10), target: 10 }),
    reward: { gp: 200 },
  }),
  Object.freeze({
    id: "ach_total_25",
    tier: "easy",
    name: "Well Rounded",
    description: "Reach total level 25.",
    check: (state) => getTotalLevel(state.skills) >= 25,
    progress: (state) => ({ current: Math.min(getTotalLevel(state.skills), 25), target: 25 }),
    reward: { gp: 500 },
  }),
  Object.freeze({
    id: "ach_quest_1",
    tier: "easy",
    name: "Quest Beginner",
    description: "Complete 1 quest.",
    check: (state) => (state.stats.questsCompleted || 0) >= 1,
    progress: (state) => ({ current: Math.min(state.stats.questsCompleted || 0, 1), target: 1 }),
    reward: { gp: 300 },
  }),
  Object.freeze({
    id: "ach_earn_1k",
    tier: "easy",
    name: "First Fortune",
    description: "Earn 1,000 GP total.",
    check: (state) => (state.stats.totalGpEarned || 0) >= 1000,
    progress: (state) => ({ current: Math.min(state.stats.totalGpEarned || 0, 1000), target: 1000 }),
    reward: { gp: 500 },
  }),

  // ── Medium ──
  Object.freeze({
    id: "ach_kill_100",
    tier: "medium",
    name: "Monster Hunter",
    description: "Kill 100 monsters.",
    check: (state) => (state.stats.monstersKilled || 0) >= 100,
    progress: (state) => ({ current: Math.min(state.stats.monstersKilled || 0, 100), target: 100 }),
    reward: { gp: 1000, xpBoost: 0.01 },
  }),
  Object.freeze({
    id: "ach_quest_5",
    tier: "medium",
    name: "Questmaster",
    description: "Complete 5 quests.",
    check: (state) => (state.stats.questsCompleted || 0) >= 5,
    progress: (state) => ({ current: Math.min(state.stats.questsCompleted || 0, 5), target: 5 }),
    reward: { gp: 1000, xpBoost: 0.01 },
  }),
  Object.freeze({
    id: "ach_total_100",
    tier: "medium",
    name: "Centurion",
    description: "Reach total level 100.",
    check: (state) => getTotalLevel(state.skills) >= 100,
    progress: (state) => ({ current: Math.min(getTotalLevel(state.skills), 100), target: 100 }),
    reward: { gp: 2000, xpBoost: 0.01 },
  }),
  Object.freeze({
    id: "ach_pet_1",
    tier: "medium",
    name: "Pet Owner",
    description: "Own 1 pet.",
    check: (state) => (state.pets?.owned?.length || 0) >= 1,
    progress: (state) => ({ current: Math.min(state.pets?.owned?.length || 0, 1), target: 1 }),
    reward: { gp: 2000, xpBoost: 0.01 },
  }),
  Object.freeze({
    id: "ach_craft_100",
    tier: "medium",
    name: "Craftsman",
    description: "Craft 100 items.",
    check: (state) => (state.stats.totalItemsCrafted || 0) >= 100,
    progress: (state) => ({ current: Math.min(state.stats.totalItemsCrafted || 0, 100), target: 100 }),
    reward: { gp: 1000, xpBoost: 0.01 },
  }),
  Object.freeze({
    id: "ach_adventures_10",
    tier: "medium",
    name: "Adventurer",
    description: "Complete 10 adventures.",
    check: (state) => (state.stats.adventuresCompleted || 0) >= 10,
    progress: (state) => ({ current: Math.min(state.stats.adventuresCompleted || 0, 10), target: 10 }),
    reward: { gp: 1000, xpBoost: 0.01 },
  }),

  // ── Hard ──
  Object.freeze({
    id: "ach_kill_500",
    tier: "hard",
    name: "Slayer",
    description: "Kill 500 monsters.",
    check: (state) => (state.stats.monstersKilled || 0) >= 500,
    progress: (state) => ({ current: Math.min(state.stats.monstersKilled || 0, 500), target: 500 }),
    reward: { gp: 5000, xpBoost: 0.02 },
  }),
  Object.freeze({
    id: "ach_total_300",
    tier: "hard",
    name: "Veteran",
    description: "Reach total level 300.",
    check: (state) => getTotalLevel(state.skills) >= 300,
    progress: (state) => ({ current: Math.min(getTotalLevel(state.skills), 300), target: 300 }),
    reward: { gp: 5000, xpBoost: 0.02 },
  }),
  Object.freeze({
    id: "ach_pet_3",
    tier: "hard",
    name: "Pet Collector",
    description: "Own 3 pets.",
    check: (state) => (state.pets?.owned?.length || 0) >= 3,
    progress: (state) => ({ current: Math.min(state.pets?.owned?.length || 0, 3), target: 3 }),
    reward: { gp: 5000, xpBoost: 0.02 },
  }),
  Object.freeze({
    id: "ach_earn_100k",
    tier: "hard",
    name: "Wealthy",
    description: "Earn 100,000 GP total.",
    check: (state) => (state.stats.totalGpEarned || 0) >= 100000,
    progress: (state) => ({ current: Math.min(state.stats.totalGpEarned || 0, 100000), target: 100000 }),
    reward: { gp: 10000, xpBoost: 0.02 },
  }),
  Object.freeze({
    id: "ach_adventures_50",
    tier: "hard",
    name: "Seasoned Explorer",
    description: "Complete 50 adventures.",
    check: (state) => (state.stats.adventuresCompleted || 0) >= 50,
    progress: (state) => ({ current: Math.min(state.stats.adventuresCompleted || 0, 50), target: 50 }),
    reward: { gp: 5000, xpBoost: 0.02 },
  }),

  // ── Elite ──
  Object.freeze({
    id: "ach_kill_2000",
    tier: "elite",
    name: "Annihilator",
    description: "Kill 2,000 monsters.",
    check: (state) => (state.stats.monstersKilled || 0) >= 2000,
    progress: (state) => ({ current: Math.min(state.stats.monstersKilled || 0, 2000), target: 2000 }),
    reward: { gp: 20000, xpBoost: 0.05 },
  }),
  Object.freeze({
    id: "ach_total_500",
    tier: "elite",
    name: "Legend",
    description: "Reach total level 500.",
    check: (state) => getTotalLevel(state.skills) >= 500,
    progress: (state) => ({ current: Math.min(getTotalLevel(state.skills), 500), target: 500 }),
    reward: { gp: 20000, xpBoost: 0.05 },
  }),
  Object.freeze({
    id: "ach_pet_all",
    tier: "elite",
    name: "Menagerie",
    description: "Own all 4 pets.",
    check: (state) => (state.pets?.owned?.length || 0) >= 4,
    progress: (state) => ({ current: Math.min(state.pets?.owned?.length || 0, 4), target: 4 }),
    reward: { gp: 25000, xpBoost: 0.05 },
  }),
  Object.freeze({
    id: "ach_skill_99",
    tier: "elite",
    name: "Mastery",
    description: "Reach level 99 in any skill.",
    check: (state) => {
      for (const data of Object.values(state.skills)) {
        if (data && typeof data.xp === "number" && data.unlocked !== false && getLevel(data.xp) >= 99) {
          return true;
        }
      }
      return false;
    },
    progress: (state) => {
      let maxLevel = 1;
      for (const data of Object.values(state.skills)) {
        if (data && typeof data.xp === "number" && data.unlocked !== false) {
          maxLevel = Math.max(maxLevel, getLevel(data.xp));
        }
      }
      return { current: Math.min(maxLevel, 99), target: 99 };
    },
    reward: { gp: 50000, xpBoost: 0.05 },
  }),
  Object.freeze({
    id: "ach_all_quests",
    tier: "elite",
    name: "Completionist",
    description: "Complete all quests.",
    check: (state) => (state.stats.questsCompleted || 0) >= 20,
    progress: (state) => ({ current: Math.min(state.stats.questsCompleted || 0, 20), target: 20 }),
    reward: { gp: 50000, xpBoost: 0.05 },
  }),
]);

// ─── Helpers ────────────────────────────────────────────

function getTotalLevel(skills) {
  let total = 0;
  for (const data of Object.values(skills)) {
    if (data && typeof data.xp === "number" && data.unlocked !== false) {
      total += getLevel(data.xp);
    }
  }
  return total;
}

// ─── Public API ──────────────────────────────────────────

/**
 * Check all achievements against current state, return newly unlocked IDs.
 * @param {object} state - Full game state.
 * @returns {string[]} Array of newly unlocked achievement IDs.
 */
export function checkAchievementUnlocks(state) {
  const already = state.achievements || [];
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (already.includes(ach.id)) continue;
    if (ach.check(state)) {
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}

/**
 * Calculate the total permanent XP boost from unlocked achievements.
 * @param {string[]} unlockedIds - Array of unlocked achievement IDs.
 * @returns {number} Total XP boost as a decimal (e.g. 0.03 for 3%).
 */
export function getAchievementXpBoost(unlockedIds) {
  let boost = 0;
  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.includes(ach.id) && ach.reward.xpBoost) {
      boost += ach.reward.xpBoost;
    }
  }
  return boost;
}

/**
 * Get the GP reward for a specific achievement.
 * @param {string} achievementId - Achievement ID.
 * @returns {number} GP reward amount.
 */
export function getAchievementReward(achievementId) {
  const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
  return ach ? (ach.reward.gp || 0) : 0;
}
