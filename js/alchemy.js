/**
 * Alchemy Skill — Recipes, training logic, auto-smelt.
 *
 * Pure functions for recipe validation and execution.
 * Auto-smelt timer managed by the caller (main.js).
 */

import { getLevel } from "./xp.js";
import { getItemCount, removeItem, addItem, isFull } from "./inventory.js";

/**
 * Alchemy recipes — immutable.
 * Multi-input recipes use the `inputs` array; single-input use `input`.
 */
export const RECIPES = Object.freeze([
  Object.freeze({
    id: "copper",
    input: "copper_ore",
    output: "copper_bar",
    xp: 10,
    minLevel: 1,
    label: "Copper Ore \u2192 Copper Bar",
  }),
  Object.freeze({
    id: "tin",
    input: "tin_ore",
    output: "tin_bar",
    xp: 15,
    minLevel: 1,
    label: "Tin Ore \u2192 Tin Bar",
  }),
  Object.freeze({
    id: "iron",
    input: "iron_ore",
    output: "iron_bar",
    xp: 25,
    minLevel: 15,
    label: "Iron Ore \u2192 Iron Bar",
  }),
  Object.freeze({
    id: "steel",
    inputs: Object.freeze([
      Object.freeze({ itemId: "iron_ore", qty: 1 }),
      Object.freeze({ itemId: "coal_ore", qty: 2 }),
    ]),
    output: "steel_bar",
    xp: 45,
    minLevel: 30,
    label: "Iron Ore + 2\u00D7 Coal \u2192 Steel Bar",
  }),
  Object.freeze({
    id: "mithril",
    inputs: Object.freeze([
      Object.freeze({ itemId: "mithril_ore", qty: 1 }),
      Object.freeze({ itemId: "coal_ore", qty: 4 }),
    ]),
    output: "mithril_bar",
    xp: 75,
    minLevel: 50,
    label: "Mithril Ore + 4\u00D7 Coal \u2192 Mithril Bar",
  }),
]);

/**
 * Get recipes available at the current alchemy level.
 * @param {number} xp - Current alchemy XP.
 * @returns {Array} Available recipes.
 */
export function getAvailableRecipes(xp) {
  const level = getLevel(xp);
  return RECIPES.filter((r) => level >= r.minLevel);
}

/**
 * Check if a recipe can be executed with the current inventory.
 * @param {object} recipe - The recipe to check.
 * @param {Array} inventory - Current inventory.
 * @param {number} xp - Current alchemy XP.
 * @returns {{ canSmelt: boolean, reason: string }}
 */
export function canSmelt(recipe, inventory, xp) {
  const level = getLevel(xp);

  if (level < recipe.minLevel) {
    return { canSmelt: false, reason: `Requires level ${recipe.minLevel}` };
  }

  // Check inputs (supports both single and multi-input recipes)
  if (recipe.inputs) {
    for (const inp of recipe.inputs) {
      if (getItemCount(inventory, inp.itemId) < inp.qty) {
        return { canSmelt: false, reason: `Need ${inp.qty}\u00D7 ${inp.itemId.replace(/_/g, " ")}` };
      }
    }
  } else {
    if (getItemCount(inventory, recipe.input) < 1) {
      return { canSmelt: false, reason: `No ${recipe.input.replace(/_/g, " ")}` };
    }
  }

  const hasStack = inventory.some((s) => s && s.id === recipe.output);
  if (!hasStack && isFull(inventory)) {
    return { canSmelt: false, reason: "Inventory full" };
  }

  return { canSmelt: true, reason: "" };
}

/**
 * Execute a single smelt action.
 * Returns the new inventory and XP gained, or null if impossible.
 *
 * @param {object} recipe - The recipe to execute.
 * @param {Array} inventory - Current inventory.
 * @param {number} xp - Current alchemy XP.
 * @returns {{ inventory: Array, xpGained: number } | null}
 */
export function executeSmelt(recipe, inventory, xp) {
  const check = canSmelt(recipe, inventory, xp);
  if (!check.canSmelt) return null;

  let newInventory = inventory;

  // Remove inputs
  if (recipe.inputs) {
    for (const inp of recipe.inputs) {
      newInventory = removeItem(newInventory, inp.itemId, inp.qty);
      if (!newInventory) return null;
    }
  } else {
    newInventory = removeItem(newInventory, recipe.input, 1);
    if (!newInventory) return null;
  }

  // Add output
  newInventory = addItem(newInventory, recipe.output, 1);
  if (!newInventory) return null;

  return {
    inventory: newInventory,
    xpGained: recipe.xp,
  };
}
