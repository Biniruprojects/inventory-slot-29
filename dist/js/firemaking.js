/**
 * Firemaking Skill — Burning logs for XP.
 *
 * Processing skill: consumes logs, no output item.
 * Follows the generic skill contract: RECIPES, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { getItemCount, removeItem } from "./inventory.js";

export const RECIPES = Object.freeze([
  Object.freeze({ id: "burn_normal_log", input: "normal_log", xp: 40,  minLevel: 1,  label: "Burn Normal Log" }),
  Object.freeze({ id: "burn_oak_log",    input: "oak_log",    xp: 60,  minLevel: 15, label: "Burn Oak Log" }),
  Object.freeze({ id: "burn_willow_log", input: "willow_log", xp: 90,  minLevel: 30, label: "Burn Willow Log" }),
  Object.freeze({ id: "burn_maple_log",  input: "maple_log",  xp: 135, minLevel: 45, label: "Burn Maple Log" }),
  Object.freeze({ id: "burn_yew_log",    input: "yew_log",    xp: 202, minLevel: 60, label: "Burn Yew Log" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return RECIPES.filter((r) => level >= r.minLevel);
}

export function canExecute(recipe, inventory, xp) {
  const level = getLevel(xp);
  if (level < recipe.minLevel) {
    return { can: false, reason: `Requires Firemaking level ${recipe.minLevel}` };
  }
  if (getItemCount(inventory, recipe.input) < 1) {
    return { can: false, reason: `No ${recipe.input.replace(/_/g, " ")}` };
  }
  return { can: true, reason: "" };
}

export function execute(recipe, inventory, xp) {
  const check = canExecute(recipe, inventory, xp);
  if (!check.can) return null;

  const newInventory = removeItem(inventory, recipe.input, 1);
  if (!newInventory) return null;

  return { inventory: newInventory, xpGained: recipe.xp };
}
