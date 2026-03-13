/**
 * Equipment System — Equip/unequip items, stat calculation.
 *
 * 3 slots: weapon, armor, shield.
 * All functions return new objects (immutable-friendly).
 */

import { ITEMS, addItem, removeItem, isFull } from "./inventory.js";

/**
 * Calculate total equipment bonuses from all equipped items.
 * @param {object} equipment - { weapon, armor, shield } with item IDs or null.
 * @returns {{ attackBonus, strengthBonus, defenceBonus, magicBonus, rangedBonus }}
 */
export function getEquipmentBonuses(equipment) {
  const totals = { attackBonus: 0, strengthBonus: 0, defenceBonus: 0, magicBonus: 0, rangedBonus: 0 };

  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const def = ITEMS[itemId];
    if (!def) continue;

    totals.attackBonus += def.attackBonus || 0;
    totals.strengthBonus += def.strengthBonus || 0;
    totals.defenceBonus += def.defenceBonus || 0;
    totals.magicBonus += def.magicBonus || 0;
    totals.rangedBonus += def.rangedBonus || 0;
  }

  return Object.freeze(totals);
}

/**
 * Equip an item from inventory into the appropriate slot.
 * If the slot is already occupied, the old item goes back to inventory.
 *
 * @param {Array} inventory - Current inventory.
 * @param {object} equipment - Current equipment state.
 * @param {string} itemId - Item ID to equip.
 * @returns {{ inventory: Array, equipment: object } | null} New state, or null if impossible.
 */
export function equipItem(inventory, equipment, itemId) {
  const def = ITEMS[itemId];
  if (!def || !def.equipSlot) return null;

  const slot = def.equipSlot;

  // Remove item from inventory
  let newInventory = removeItem(inventory, itemId, 1);
  if (!newInventory) return null;

  // If slot is occupied, put old item back in inventory
  const oldItemId = equipment[slot];
  let newEquipment = { ...equipment, [slot]: itemId };

  if (oldItemId) {
    newInventory = addItem(newInventory, oldItemId, 1);
    if (!newInventory) return null; // Can't fit old item back (shouldn't happen — we just freed a slot)
  }

  return { inventory: newInventory, equipment: newEquipment };
}

/**
 * Unequip an item from a slot back to inventory.
 *
 * @param {Array} inventory - Current inventory.
 * @param {object} equipment - Current equipment state.
 * @param {string} slotName - Slot to unequip ("weapon", "armor", "shield").
 * @returns {{ inventory: Array, equipment: object } | null} New state, or null if inventory full.
 */
export function unequipItem(inventory, equipment, slotName) {
  const itemId = equipment[slotName];
  if (!itemId) return null;

  // Check if we can add to inventory
  if (isFull(inventory)) return null;

  const newInventory = addItem(inventory, itemId, 1);
  if (!newInventory) return null;

  const newEquipment = { ...equipment, [slotName]: null };

  return { inventory: newInventory, equipment: newEquipment };
}
