/**
 * Fishing Skill — Gathering fish from spots.
 *
 * Gathering skill: no input, produces raw fish on a tick timer.
 * Follows the generic skill contract: ACTIONS, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { addItem, isFull } from "./inventory.js";

export const ACTIONS = Object.freeze([
  Object.freeze({ id: "shrimp_spot",    output: "raw_shrimp",    xp: 10,  minLevel: 1,  tickMs: 3500, label: "Shrimp Spot" }),
  Object.freeze({ id: "trout_spot",     output: "raw_trout",     xp: 50,  minLevel: 20, tickMs: 5000, label: "Trout Spot" }),
  Object.freeze({ id: "lobster_spot",   output: "raw_lobster",   xp: 90,  minLevel: 40, tickMs: 6500, label: "Lobster Spot" }),
  Object.freeze({ id: "swordfish_spot", output: "raw_swordfish", xp: 100, minLevel: 50, tickMs: 8000, label: "Swordfish Spot" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return ACTIONS.filter((a) => level >= a.minLevel);
}

export function canExecute(action, inventory, xp) {
  const level = getLevel(xp);
  if (level < action.minLevel) {
    return { can: false, reason: `Requires Fishing level ${action.minLevel}` };
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
