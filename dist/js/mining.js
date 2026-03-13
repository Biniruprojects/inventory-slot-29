/**
 * Mining Skill — Gathering ores from rocks.
 *
 * Gathering skill: no input, produces ore on a tick timer.
 * Follows the generic skill contract: ACTIONS, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { addItem, isFull } from "./inventory.js";

export const ACTIONS = Object.freeze([
  Object.freeze({ id: "copper_rock",  output: "copper_ore",  xp: 17,  minLevel: 1,  tickMs: 4000, label: "Copper Rock" }),
  Object.freeze({ id: "tin_rock",     output: "tin_ore",     xp: 17,  minLevel: 1,  tickMs: 4000, label: "Tin Rock" }),
  Object.freeze({ id: "iron_rock",    output: "iron_ore",    xp: 35,  minLevel: 15, tickMs: 5500, label: "Iron Rock" }),
  Object.freeze({ id: "coal_rock",    output: "coal_ore",    xp: 50,  minLevel: 30, tickMs: 6000, label: "Coal Rock" }),
  Object.freeze({ id: "mithril_rock", output: "mithril_ore", xp: 80,  minLevel: 55, tickMs: 8000, label: "Mithril Rock" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return ACTIONS.filter((a) => level >= a.minLevel);
}

export function canExecute(action, inventory, xp) {
  const level = getLevel(xp);
  if (level < action.minLevel) {
    return { can: false, reason: `Requires Mining level ${action.minLevel}` };
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
