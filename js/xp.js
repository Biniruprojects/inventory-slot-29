/**
 * XP System — OSRS-accurate XP table and level calculations.
 *
 * Formula: xpForLevel(L) = floor( sum(x=1..L-1) floor(x + 300 * 2^(x/7)) / 4 )
 * Level 1 = 0 XP, Level 2 = 83 XP, Level 99 = 13,034,431 XP.
 */

/** Pre-computed XP thresholds for levels 1-99. Index 0 = level 1 = 0 XP. */
const XP_TABLE = Object.freeze(buildXpTable());

function buildXpTable() {
  const table = [0]; // Level 1 = 0 XP
  let cumulative = 0;

  for (let level = 1; level < 99; level++) {
    cumulative += Math.floor(level + 300 * Math.pow(2, level / 7));
    table.push(Math.floor(cumulative / 4));
  }

  return table;
}

/**
 * Get the level for a given XP amount.
 * @param {number} xp - Total experience points.
 * @returns {number} Level (1-99).
 */
export function getLevel(xp) {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get the XP required for a specific level.
 * @param {number} level - Target level (1-99).
 * @returns {number} XP threshold for that level.
 */
export function xpForLevel(level) {
  const clamped = Math.max(1, Math.min(99, level));
  return XP_TABLE[clamped - 1];
}

/**
 * Get XP remaining until the next level.
 * @param {number} xp - Current total XP.
 * @returns {number} XP needed for next level, or 0 if already 99.
 */
export function xpToNextLevel(xp) {
  const currentLevel = getLevel(xp);
  if (currentLevel >= 99) return 0;
  return xpForLevel(currentLevel + 1) - xp;
}

/**
 * Get progress percentage toward the next level.
 * @param {number} xp - Current total XP.
 * @returns {number} Progress 0.0 to 1.0.
 */
export function levelProgress(xp) {
  const currentLevel = getLevel(xp);
  if (currentLevel >= 99) return 1.0;

  const currentThreshold = xpForLevel(currentLevel);
  const nextThreshold = xpForLevel(currentLevel + 1);
  const range = nextThreshold - currentThreshold;

  if (range <= 0) return 1.0;
  return (xp - currentThreshold) / range;
}
