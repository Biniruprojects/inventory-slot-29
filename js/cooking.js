/**
 * Cooking Skill — Raw fish → Cooked food.
 *
 * Processing skill: consumes raw food, produces cooked food.
 * Follows the generic skill contract: RECIPES, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { getItemCount, removeItem, addItem, isFull } from "./inventory.js";

export const RECIPES = Object.freeze([
  Object.freeze({ id: "cook_shrimp",    input: "raw_shrimp",    output: "cooked_shrimp",    xp: 30,  minLevel: 1,  label: "Raw Shrimp → Cooked Shrimp (3HP)" }),
  Object.freeze({ id: "cook_trout",     input: "raw_trout",     output: "cooked_trout",     xp: 70,  minLevel: 15, label: "Raw Trout → Cooked Trout (7HP)" }),
  Object.freeze({ id: "cook_lobster",   input: "raw_lobster",   output: "cooked_lobster",   xp: 120, minLevel: 40, label: "Raw Lobster → Cooked Lobster (12HP)" }),
  Object.freeze({ id: "cook_swordfish", input: "raw_swordfish", output: "cooked_swordfish", xp: 140, minLevel: 45, label: "Raw Swordfish → Cooked Swordfish (14HP)" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return RECIPES.filter((r) => level >= r.minLevel);
}

export function canExecute(recipe, inventory, xp) {
  const level = getLevel(xp);
  if (level < recipe.minLevel) {
    return { can: false, reason: `Requires Cooking level ${recipe.minLevel}` };
  }
  if (getItemCount(inventory, recipe.input) < 1) {
    return { can: false, reason: `No ${recipe.input.replace(/_/g, " ")}` };
  }
  const hasStack = inventory.some((s) => s && s.id === recipe.output);
  if (!hasStack && isFull(inventory)) {
    if (getItemCount(inventory, recipe.input) === 1) {
      return { can: true, reason: "" };
    }
    return { can: false, reason: "Inventory full" };
  }
  return { can: true, reason: "" };
}

export function execute(recipe, inventory, xp) {
  const check = canExecute(recipe, inventory, xp);
  if (!check.can) return null;

  let newInventory = removeItem(inventory, recipe.input, 1);
  if (!newInventory) return null;

  newInventory = addItem(newInventory, recipe.output, 1);
  if (!newInventory) return null;

  return { inventory: newInventory, xpGained: recipe.xp };
}
