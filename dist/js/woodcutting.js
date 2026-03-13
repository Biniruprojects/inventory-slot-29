/**
 * Woodcutting Skill — Gathering logs from trees.
 *
 * Gathering skill: no input, produces logs on a tick timer.
 * Follows the generic skill contract: ACTIONS, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { addItem, isFull } from "./inventory.js";

export const ACTIONS = Object.freeze([
  Object.freeze({ id: "normal_tree", output: "normal_log", xp: 25,  minLevel: 1,  tickMs: 3500, label: "Normal Tree" }),
  Object.freeze({ id: "oak_tree",    output: "oak_log",    xp: 37,  minLevel: 15, tickMs: 5000, label: "Oak Tree" }),
  Object.freeze({ id: "willow_tree", output: "willow_log", xp: 67,  minLevel: 30, tickMs: 6000, label: "Willow Tree" }),
  Object.freeze({ id: "maple_tree",  output: "maple_log",  xp: 100, minLevel: 45, tickMs: 7500, label: "Maple Tree" }),
  Object.freeze({ id: "yew_tree",    output: "yew_log",    xp: 175, minLevel: 60, tickMs: 9000, label: "Yew Tree" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return ACTIONS.filter((a) => level >= a.minLevel);
}

export function canExecute(action, inventory, xp) {
  const level = getLevel(xp);
  if (level < action.minLevel) {
    return { can: false, reason: `Requires Woodcutting level ${action.minLevel}` };
  }
  const hasStack = inventory.some((s) => s && s.id === action.output);
  if (!hasStack && isFull(inventory)) {
    return { can: false, reason: "Inventory full" };
  }
  return { can: true, reason: "" };
}

export function execute(action, inventory, xp) {
  const check = canExecute(action, inventory, xp);
  if (!check.can) return null;

  const newInventory = addItem(inventory, action.output, 1);
  if (!newInventory) return null;

  return { inventory: newInventory, xpGained: action.xp };
}
