/**
 * Bank System — 120-slot storage separate from inventory.
 *
 * All items in the bank are stackable (even equipment stacks by ID).
 * Functions return new arrays (immutable-friendly).
 */

import { ITEMS, addItem, removeItem, getItemCount } from "./inventory.js";

export const BANK_SLOTS = 120;

/**
 * Create a default empty bank.
 * @returns {Array} Empty bank (120 null slots).
 */
export function createDefaultBank() {
  return new Array(BANK_SLOTS).fill(null);
}

/**
 * Deposit an item from inventory into the bank.
 * Bank always stacks (even non-stackable items stack by ID in bank).
 *
 * @param {Array} inventory - Current inventory.
 * @param {Array} bank - Current bank.
 * @param {string} itemId - Item to deposit.
 * @param {number} qty - Quantity to deposit.
 * @returns {{ inventory: Array, bank: Array } | null} New state or null.
 */
export function depositItem(inventory, bank, itemId, qty) {
  const itemDef = ITEMS[itemId];
  if (!itemDef) return null;

  // Check player has enough
  if (getItemCount(inventory, itemId) < qty) return null;

  // Remove from inventory
  let newInventory = inventory;
  if (itemDef.stackable) {
    newInventory = removeItem(inventory, itemId, qty);
  } else {
    // Non-stackable: remove N individual slots
    newInventory = inventory.map((s) => (s ? { ...s } : null));
    let removed = 0;
    for (let i = 0; i < newInventory.length && removed < qty; i++) {
      if (newInventory[i] && newInventory[i].id === itemId) {
        newInventory[i] = null;
        removed++;
      }
    }
    if (removed < qty) return null;
  }
  if (!newInventory) return null;

  // Add to bank (always stacks)
  const newBank = bank.map((s) => (s ? { ...s } : null));

  // Try to stack on existing
  for (let i = 0; i < newBank.length; i++) {
    if (newBank[i] && newBank[i].id === itemId) {
      newBank[i] = { ...newBank[i], qty: newBank[i].qty + qty };
      return { inventory: newInventory, bank: newBank };
    }
  }

  // Find first empty bank slot
  for (let i = 0; i < newBank.length; i++) {
    if (newBank[i] === null) {
      newBank[i] = { id: itemId, name: itemDef.name, qty };
      return { inventory: newInventory, bank: newBank };
    }
  }

  // Bank full
  return null;
}

/**
 * Withdraw an item from the bank to inventory.
 *
 * @param {Array} inventory - Current inventory.
 * @param {Array} bank - Current bank.
 * @param {string} itemId - Item to withdraw.
 * @param {number} qty - Quantity to withdraw.
 * @returns {{ inventory: Array, bank: Array } | null} New state or null.
 */
export function withdrawItem(inventory, bank, itemId, qty) {
  const itemDef = ITEMS[itemId];
  if (!itemDef) return null;

  // Check bank has enough
  const bankIdx = bank.findIndex((s) => s && s.id === itemId);
  if (bankIdx === -1) return null;
  if (bank[bankIdx].qty < qty) return null;

  // Try to add to inventory first (fail fast if no space)
  const newInventory = addItem(inventory, itemId, qty);
  if (!newInventory) return null;

  // Remove from bank
  const newBank = bank.map((s) => (s ? { ...s } : null));
  if (newBank[bankIdx].qty === qty) {
    newBank[bankIdx] = null;
  } else {
    newBank[bankIdx] = { ...newBank[bankIdx], qty: newBank[bankIdx].qty - qty };
  }

  return { inventory: newInventory, bank: newBank };
}

/**
 * Deposit all items from inventory into bank.
 *
 * @param {Array} inventory - Current inventory.
 * @param {Array} bank - Current bank.
 * @returns {{ inventory: Array, bank: Array }}
 */
export function depositAll(inventory, bank) {
  let currentInv = inventory;
  let currentBank = bank;

  for (const slot of inventory) {
    if (!slot) continue;
    const result = depositItem(currentInv, currentBank, slot.id, slot.qty);
    if (result) {
      currentInv = result.inventory;
      currentBank = result.bank;
    }
  }

  return { inventory: currentInv, bank: currentBank };
}

/**
 * Withdraw a specific amount from a bank slot by index.
 * Supports preset amounts (1, 5, 10) or "all" (pass Infinity or the slot's qty).
 *
 * @param {Array} inventory - Current inventory.
 * @param {Array} bank - Current bank.
 * @param {number} slotIndex - Bank slot index to withdraw from.
 * @param {number} amount - Quantity to withdraw (clamped to available qty).
 * @returns {{ inventory: Array, bank: Array } | null} New state or null if impossible.
 */
export function withdrawAmount(inventory, bank, slotIndex, amount) {
  if (slotIndex < 0 || slotIndex >= bank.length) return null;

  const slot = bank[slotIndex];
  if (!slot) return null;

  const itemDef = ITEMS[slot.id];
  if (!itemDef) return null;

  // Clamp to available quantity
  const qty = Math.min(amount, slot.qty);
  if (qty <= 0) return null;

  // Delegate to the standard withdrawItem
  return withdrawItem(inventory, bank, slot.id, qty);
}

/**
 * Deposit a specific item from inventory to bank by item ID and quantity.
 * Convenience wrapper when you know the item ID rather than iterating slots.
 *
 * @param {Array} inventory - Current inventory.
 * @param {Array} bank - Current bank.
 * @param {string} itemId - Item ID to deposit.
 * @param {number} qty - Quantity to deposit.
 * @returns {{ inventory: Array, bank: Array } | null} New state or null.
 */
export function depositItemById(inventory, bank, itemId, qty) {
  return depositItem(inventory, bank, itemId, qty);
}

/**
 * Get the number of used bank slots.
 * @param {Array} bank
 * @returns {number}
 */
export function usedBankSlots(bank) {
  return bank.filter((s) => s !== null).length;
}

/**
 * Get total quantity of an item in the bank.
 * @param {Array} bank
 * @param {string} itemId
 * @returns {number}
 */
export function getBankItemCount(bank, itemId) {
  const slot = bank.find((s) => s && s.id === itemId);
  return slot ? slot.qty : 0;
}
