/**
 * Smithing Skill — Bars → Equipment recipes.
 *
 * Processing skill: consumes bars, produces equipment.
 * Follows the generic skill contract: RECIPES, getAvailableActions, canExecute, execute.
 */

import { getLevel } from "./xp.js";
import { ITEMS, getItemCount, removeItem, addItem, isFull } from "./inventory.js";

export const RECIPES = Object.freeze([
  // Copper tier (Smithing 1)
  Object.freeze({ id: "copper_sword",   input: "copper_bar", inputQty: 1, output: "copper_sword",   xp: 12, minLevel: 1,  label: "Copper Bar → Copper Sword" }),
  Object.freeze({ id: "copper_armor",   input: "copper_bar", inputQty: 2, output: "copper_armor",   xp: 20, minLevel: 1,  label: "2× Copper Bar → Copper Armor" }),
  Object.freeze({ id: "copper_shield",  input: "copper_bar", inputQty: 1, output: "copper_shield",  xp: 10, minLevel: 1,  label: "Copper Bar → Copper Shield" }),

  // Tin tier (Smithing 10)
  Object.freeze({ id: "tin_sword",      input: "tin_bar",    inputQty: 1, output: "tin_sword",      xp: 20, minLevel: 10, label: "Tin Bar → Tin Sword" }),
  Object.freeze({ id: "tin_armor",      input: "tin_bar",    inputQty: 2, output: "tin_armor",      xp: 35, minLevel: 10, label: "2× Tin Bar → Tin Armor" }),
  Object.freeze({ id: "tin_shield",     input: "tin_bar",    inputQty: 1, output: "tin_shield",     xp: 18, minLevel: 10, label: "Tin Bar → Tin Shield" }),

  // Iron tier (Smithing 25)
  Object.freeze({ id: "iron_sword",     input: "iron_bar",   inputQty: 1, output: "iron_sword",     xp: 35, minLevel: 25, label: "Iron Bar → Iron Sword" }),
  Object.freeze({ id: "iron_armor",     input: "iron_bar",   inputQty: 2, output: "iron_armor",     xp: 60, minLevel: 25, label: "2× Iron Bar → Iron Armor" }),
  Object.freeze({ id: "iron_shield",    input: "iron_bar",   inputQty: 1, output: "iron_shield",    xp: 30, minLevel: 25, label: "Iron Bar → Iron Shield" }),

  // Steel tier (Smithing 40)
  Object.freeze({ id: "steel_sword",    input: "steel_bar",  inputQty: 1, output: "steel_sword",    xp: 55, minLevel: 40, label: "Steel Bar → Steel Sword" }),
  Object.freeze({ id: "steel_armor",    input: "steel_bar",  inputQty: 2, output: "steel_armor",    xp: 90, minLevel: 40, label: "2× Steel Bar → Steel Armor" }),
  Object.freeze({ id: "steel_shield",   input: "steel_bar",  inputQty: 1, output: "steel_shield",   xp: 48, minLevel: 40, label: "Steel Bar → Steel Shield" }),

  // Mithril tier (Smithing 55)
  Object.freeze({ id: "mithril_sword",  input: "mithril_bar", inputQty: 1, output: "mithril_sword",  xp: 80,  minLevel: 55, label: "Mithril Bar → Mithril Sword" }),
  Object.freeze({ id: "mithril_armor",  input: "mithril_bar", inputQty: 2, output: "mithril_armor",  xp: 130, minLevel: 55, label: "2× Mithril Bar → Mithril Armor" }),
  Object.freeze({ id: "mithril_shield", input: "mithril_bar", inputQty: 1, output: "mithril_shield", xp: 70,  minLevel: 55, label: "Mithril Bar → Mithril Shield" }),

  // Arrow crafting
  Object.freeze({ id: "bronze_arrow",   input: "copper_bar", inputQty: 1, output: "bronze_arrow",  outputQty: 15, xp: 12, minLevel: 1,  label: "Copper Bar → 15× Bronze Arrow" }),
  Object.freeze({ id: "iron_arrow",     input: "iron_bar",   inputQty: 1, output: "iron_arrow",    outputQty: 15, xp: 25, minLevel: 20, label: "Iron Bar → 15× Iron Arrow" }),
  Object.freeze({ id: "steel_arrow",    input: "steel_bar",  inputQty: 1, output: "steel_arrow",   outputQty: 15, xp: 45, minLevel: 35, label: "Steel Bar → 15× Steel Arrow" }),
]);

export function getAvailableActions(xp) {
  const level = getLevel(xp);
  return RECIPES.filter((r) => level >= r.minLevel);
}

export function canExecute(recipe, inventory, xp) {
  const level = getLevel(xp);
  if (level < recipe.minLevel) {
    return { can: false, reason: `Requires Smithing level ${recipe.minLevel}` };
  }
  if (getItemCount(inventory, recipe.input) < recipe.inputQty) {
    return { can: false, reason: `Need ${recipe.inputQty}× ${recipe.input.replace(/_/g, " ")}` };
  }

  // Check if output fits: stackable items stack, non-stackable need a free slot
  const outputDef = ITEMS[recipe.output];
  if (outputDef && outputDef.stackable) {
    const hasStack = inventory.some((s) => s && s.id === recipe.output);
    if (!hasStack && isFull(inventory)) {
      // Consuming input might free a slot
      if (getItemCount(inventory, recipe.input) <= recipe.inputQty) {
        return { can: true, reason: "" };
      }
      return { can: false, reason: "Inventory full" };
    }
  } else if (isFull(inventory)) {
    const slotsFreed = getItemCount(inventory, recipe.input) === recipe.inputQty ? 1 : 0;
    if (slotsFreed === 0) {
      return { can: false, reason: "Inventory full" };
    }
  }

  return { can: true, reason: "" };
}

export function execute(recipe, inventory, xp) {
  const check = canExecute(recipe, inventory, xp);
  if (!check.can) return null;

  let newInventory = removeItem(inventory, recipe.input, recipe.inputQty);
  if (!newInventory) return null;

  const outputQty = recipe.outputQty || 1;
  newInventory = addItem(newInventory, recipe.output, outputQty);
  if (!newInventory) return null;

  return { inventory: newInventory, xpGained: recipe.xp };
}
