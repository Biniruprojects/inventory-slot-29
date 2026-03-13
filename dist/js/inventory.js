/**
 * Inventory Management — 28-slot system with stackable items.
 *
 * All functions return new arrays (immutable-friendly).
 * They never mutate the input inventory.
 */

import { MAX_SLOTS } from "./utils.js";

/**
 * Item definitions — icons and display info.
 */
export const ITEMS = Object.freeze({
  // ── Ores (stackable) ──
  copper_ore:  Object.freeze({ name: "Copper Ore",  icon: "assets/copper_ore.svg",  stackable: true }),
  tin_ore:     Object.freeze({ name: "Tin Ore",     icon: "assets/tin_ore.svg",     stackable: true }),
  iron_ore:    Object.freeze({ name: "Iron Ore",    icon: "assets/iron_ore.svg",    stackable: true }),
  coal_ore:    Object.freeze({ name: "Coal",         icon: "assets/coal_ore.svg",    stackable: true }),
  mithril_ore: Object.freeze({ name: "Mithril Ore", icon: "assets/mithril_ore.svg", stackable: true }),

  // ── Bars (stackable) ──
  copper_bar:  Object.freeze({ name: "Copper Bar",  icon: "assets/copper_bar.svg",  stackable: true }),
  tin_bar:     Object.freeze({ name: "Tin Bar",     icon: "assets/tin_bar.svg",     stackable: true }),
  iron_bar:    Object.freeze({ name: "Iron Bar",    icon: "assets/iron_bar.svg",    stackable: true }),
  steel_bar:   Object.freeze({ name: "Steel Bar",   icon: "assets/steel_bar.svg",   stackable: true }),
  mithril_bar: Object.freeze({ name: "Mithril Bar", icon: "assets/mithril_bar.svg", stackable: true }),

  // ── Runes (stackable) ──
  air_rune:   Object.freeze({ name: "Air Rune",   icon: "assets/rune_air.svg",   stackable: true }),
  fire_rune:  Object.freeze({ name: "Fire Rune",  icon: "assets/rune_fire.svg",  stackable: true }),
  earth_rune: Object.freeze({ name: "Earth Rune", icon: "assets/rune_earth.svg", stackable: true }),
  water_rune: Object.freeze({ name: "Water Rune", icon: "assets/rune_water.svg", stackable: true }),

  // ── Arrows (stackable) ──
  bronze_arrow: Object.freeze({ name: "Bronze Arrow", icon: "assets/arrow_bronze.svg", stackable: true }),
  iron_arrow:   Object.freeze({ name: "Iron Arrow",   icon: "assets/arrow_iron.svg",   stackable: true }),
  steel_arrow:  Object.freeze({ name: "Steel Arrow",  icon: "assets/arrow_steel.svg",  stackable: true }),

  // ── Equipment: Copper (non-stackable) ──
  copper_sword: Object.freeze({
    name: "Copper Sword", icon: "assets/eq_copper_sword.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 5, strengthBonus: 4, defenceBonus: 0,
  }),
  copper_armor: Object.freeze({
    name: "Copper Armor", icon: "assets/eq_copper_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 6,
  }),
  copper_shield: Object.freeze({
    name: "Copper Shield", icon: "assets/eq_copper_shield.svg", stackable: false,
    equipSlot: "shield", attackBonus: 0, strengthBonus: 0, defenceBonus: 4,
  }),

  // ── Equipment: Tin (non-stackable) ──
  tin_sword: Object.freeze({
    name: "Tin Sword", icon: "assets/eq_tin_sword.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 9, strengthBonus: 8, defenceBonus: 0,
  }),
  tin_armor: Object.freeze({
    name: "Tin Armor", icon: "assets/eq_tin_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 11,
  }),
  tin_shield: Object.freeze({
    name: "Tin Shield", icon: "assets/eq_tin_shield.svg", stackable: false,
    equipSlot: "shield", attackBonus: 0, strengthBonus: 0, defenceBonus: 7,
  }),

  // ── Equipment: Iron (non-stackable) ──
  iron_sword: Object.freeze({
    name: "Iron Sword", icon: "assets/eq_iron_sword.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 14, strengthBonus: 13, defenceBonus: 0,
  }),
  iron_armor: Object.freeze({
    name: "Iron Armor", icon: "assets/eq_iron_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 17,
  }),
  iron_shield: Object.freeze({
    name: "Iron Shield", icon: "assets/eq_iron_shield.svg", stackable: false,
    equipSlot: "shield", attackBonus: 0, strengthBonus: 0, defenceBonus: 10,
  }),

  // ── Equipment: Steel (non-stackable) ──
  steel_sword: Object.freeze({
    name: "Steel Sword", icon: "assets/eq_steel_sword.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 20, strengthBonus: 19, defenceBonus: 0,
  }),
  steel_armor: Object.freeze({
    name: "Steel Armor", icon: "assets/eq_steel_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 24,
  }),
  steel_shield: Object.freeze({
    name: "Steel Shield", icon: "assets/eq_steel_shield.svg", stackable: false,
    equipSlot: "shield", attackBonus: 0, strengthBonus: 0, defenceBonus: 14,
  }),

  // ── Equipment: Mithril (non-stackable) ──
  mithril_sword: Object.freeze({
    name: "Mithril Sword", icon: "assets/eq_mithril_sword.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 28, strengthBonus: 26, defenceBonus: 0,
  }),
  mithril_armor: Object.freeze({
    name: "Mithril Armor", icon: "assets/eq_mithril_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 32,
  }),
  mithril_shield: Object.freeze({
    name: "Mithril Shield", icon: "assets/eq_mithril_shield.svg", stackable: false,
    equipSlot: "shield", attackBonus: 0, strengthBonus: 0, defenceBonus: 19,
  }),

  // ── Equipment: Special (non-stackable) ──
  apprentice_staff: Object.freeze({
    name: "Apprentice Staff", icon: "assets/eq_staff.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 8, strengthBonus: 0, defenceBonus: 2, magicBonus: 10,
  }),
  short_bow: Object.freeze({
    name: "Short Bow", icon: "assets/eq_shortbow.svg", stackable: false,
    equipSlot: "weapon", attackBonus: 7, strengthBonus: 0, defenceBonus: 0, rangedBonus: 9,
  }),
  leather_armor: Object.freeze({
    name: "Leather Armor", icon: "assets/eq_leather_armor.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 8, rangedBonus: 12,
  }),
  wizard_robe: Object.freeze({
    name: "Wizard Robe", icon: "assets/eq_wizard_robe.svg", stackable: false,
    equipSlot: "armor", attackBonus: 0, strengthBonus: 0, defenceBonus: 3, magicBonus: 15,
  }),

  // ── Logs (stackable) ──
  normal_log:  Object.freeze({ name: "Normal Log",  icon: "assets/normal_log.svg",  stackable: true }),
  oak_log:     Object.freeze({ name: "Oak Log",     icon: "assets/oak_log.svg",     stackable: true }),
  willow_log:  Object.freeze({ name: "Willow Log",  icon: "assets/willow_log.svg",  stackable: true }),
  maple_log:   Object.freeze({ name: "Maple Log",   icon: "assets/maple_log.svg",   stackable: true }),
  yew_log:     Object.freeze({ name: "Yew Log",     icon: "assets/yew_log.svg",     stackable: true }),

  // ── Potions (stackable) ──
  attack_potion:   Object.freeze({ name: "Attack Potion",   icon: "assets/item_attack_potion.svg",   stackable: true, category: "potion" }),
  strength_potion: Object.freeze({ name: "Strength Potion", icon: "assets/item_strength_potion.svg", stackable: true, category: "potion" }),
  defence_potion:  Object.freeze({ name: "Defence Potion",  icon: "assets/item_defence_potion.svg",  stackable: true, category: "potion" }),
  magic_potion:    Object.freeze({ name: "Magic Potion",    icon: "assets/item_magic_potion.svg",    stackable: true, category: "potion" }),
  ranging_potion:  Object.freeze({ name: "Ranging Potion",  icon: "assets/item_ranging_potion.svg",  stackable: true, category: "potion" }),
  super_restore:   Object.freeze({ name: "Super Restore",   icon: "assets/item_super_restore.svg",   stackable: true, category: "potion" }),

  // ── Food (stackable) ──
  raw_shrimp:      Object.freeze({ name: "Raw Shrimp",      icon: "assets/food_raw_shrimp.svg",      stackable: true }),
  cooked_shrimp:   Object.freeze({ name: "Cooked Shrimp",   icon: "assets/food_cooked_shrimp.svg",   stackable: true, healAmount: 3 }),
  raw_trout:       Object.freeze({ name: "Raw Trout",       icon: "assets/food_raw_trout.svg",       stackable: true }),
  cooked_trout:    Object.freeze({ name: "Cooked Trout",    icon: "assets/food_cooked_trout.svg",    stackable: true, healAmount: 7 }),
  raw_lobster:     Object.freeze({ name: "Raw Lobster",     icon: "assets/food_raw_lobster.svg",     stackable: true }),
  cooked_lobster:  Object.freeze({ name: "Cooked Lobster",  icon: "assets/food_cooked_lobster.svg",  stackable: true, healAmount: 12 }),
  raw_swordfish:   Object.freeze({ name: "Raw Swordfish",   icon: "assets/food_raw_swordfish.svg",   stackable: true }),
  cooked_swordfish: Object.freeze({ name: "Cooked Swordfish", icon: "assets/food_cooked_swordfish.svg", stackable: true, healAmount: 14 }),
});

/**
 * Add items to the inventory.
 * Stacks on existing slot if possible, otherwise uses first empty slot.
 *
 * @param {Array} inventory - Current inventory (frozen array of slots).
 * @param {string} itemId - Item ID to add.
 * @param {number} qty - Quantity to add.
 * @returns {Array|null} New inventory array, or null if no space.
 */
export function addItem(inventory, itemId, qty) {
  const slots = inventory.map((s) => (s ? { ...s } : null));
  const itemDef = ITEMS[itemId];
  if (!itemDef) return null;

  // Non-stackable: each unit takes its own slot (qty always 1).
  // Strict: all-or-nothing — only succeeds if ALL items can be placed.
  if (!itemDef.stackable) {
    const emptyCount = slots.filter((s) => s === null).length;
    if (emptyCount < qty) return null;

    let placed = 0;
    for (let i = 0; i < slots.length && placed < qty; i++) {
      if (slots[i] === null) {
        slots[i] = { id: itemId, name: itemDef.name, qty: 1 };
        placed++;
      }
    }
    return slots;
  }

  // Stackable: try stacking on existing slot
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] && slots[i].id === itemId) {
      slots[i] = { ...slots[i], qty: slots[i].qty + qty };
      return slots;
    }
  }

  // Find first empty slot
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === null) {
      slots[i] = { id: itemId, name: itemDef.name, qty };
      return slots;
    }
  }

  // No space
  return null;
}

/**
 * Remove items from the inventory.
 * Reduces quantity; removes slot entirely if qty reaches 0.
 *
 * @param {Array} inventory - Current inventory.
 * @param {string} itemId - Item ID to remove.
 * @param {number} qty - Quantity to remove.
 * @returns {Array|null} New inventory array, or null if insufficient items.
 */
export function removeItem(inventory, itemId, qty) {
  const itemDef = ITEMS[itemId];

  // Non-stackable: remove individual slots one by one
  if (itemDef && !itemDef.stackable) {
    const slots = inventory.map((s) => (s ? { ...s } : null));
    let removed = 0;
    for (let i = 0; i < slots.length && removed < qty; i++) {
      if (slots[i] && slots[i].id === itemId) {
        slots[i] = null;
        removed++;
      }
    }
    return removed >= qty ? slots : null;
  }

  // Stackable: original logic
  const idx = inventory.findIndex((s) => s && s.id === itemId);
  if (idx === -1) return null;
  if (inventory[idx].qty < qty) return null;

  const slots = inventory.map((s) => (s ? { ...s } : null));

  if (slots[idx].qty === qty) {
    slots[idx] = null;
  } else {
    slots[idx] = { ...slots[idx], qty: slots[idx].qty - qty };
  }

  return slots;
}

/**
 * Get total quantity of a specific item across all slots.
 * @param {Array} inventory - Current inventory.
 * @param {string} itemId - Item ID to count.
 * @returns {number} Total quantity.
 */
export function getItemCount(inventory, itemId) {
  const itemDef = ITEMS[itemId];
  let total = 0;
  for (const slot of inventory) {
    if (slot && slot.id === itemId) {
      // Non-stackable items occupy one slot each with qty 1
      total += (itemDef && !itemDef.stackable) ? 1 : slot.qty;
    }
  }
  return total;
}

/**
 * Check if the inventory is completely full (no null slots).
 * @param {Array} inventory - Current inventory.
 * @returns {boolean}
 */
export function isFull(inventory) {
  return inventory.every((s) => s !== null);
}

/**
 * Count the number of occupied slots.
 * @param {Array} inventory - Current inventory.
 * @returns {number}
 */
export function usedSlots(inventory) {
  return inventory.filter((s) => s !== null).length;
}
