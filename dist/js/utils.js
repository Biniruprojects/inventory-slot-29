/**
 * Shared Utilities — Common functions used across modules.
 *
 * Single source of truth for formatNumber and other shared helpers.
 */

/**
 * Format a number for display: 10K+, 100K+, 1M+ abbreviations.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000) return `${(n / 1_000).toFixed(0)}K`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

/** Max inventory slots (OSRS-style: 28). */
export const MAX_SLOTS = 28;
