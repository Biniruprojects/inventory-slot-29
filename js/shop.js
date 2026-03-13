/**
 * Shop System — Buy/sell items for GP.
 *
 * Three shops: General Store, Weapon Shop, Magic Shop.
 * Sell = 50% of buy price. Items not in any shop sell for 1 GP.
 * Supports bulk buy/sell (1, 5, 10, All).
 */

import { ITEMS, addItem, removeItem, isFull, getItemCount } from "./inventory.js";

/** Shop definitions */
export const SHOPS = Object.freeze([
  Object.freeze({
    id: "general",
    name: "General Store",
    icon: "🛒",
    stock: Object.freeze([
      Object.freeze({ itemId: "copper_ore",       buyPrice: 50,   sellPrice: 25 }),
      Object.freeze({ itemId: "tin_ore",           buyPrice: 60,   sellPrice: 30 }),
      Object.freeze({ itemId: "iron_ore",          buyPrice: 120,  sellPrice: 60 }),
      Object.freeze({ itemId: "coal_ore",          buyPrice: 200,  sellPrice: 100 }),
      Object.freeze({ itemId: "cooked_shrimp",     buyPrice: 80,   sellPrice: 40 }),
      Object.freeze({ itemId: "cooked_trout",      buyPrice: 200,  sellPrice: 100 }),
      Object.freeze({ itemId: "cooked_lobster",    buyPrice: 400,  sellPrice: 200 }),
      Object.freeze({ itemId: "cooked_swordfish",  buyPrice: 600,  sellPrice: 300 }),
      Object.freeze({ itemId: "attack_potion",     buyPrice: 500,  sellPrice: 250 }),
      Object.freeze({ itemId: "strength_potion",   buyPrice: 500,  sellPrice: 250 }),
      Object.freeze({ itemId: "defence_potion",    buyPrice: 500,  sellPrice: 250 }),
      Object.freeze({ itemId: "super_restore",     buyPrice: 1000, sellPrice: 500 }),
    ]),
  }),
  Object.freeze({
    id: "weapons",
    name: "Weapon Shop",
    icon: "⚔",
    stock: Object.freeze([
      Object.freeze({ itemId: "copper_sword",      buyPrice: 120,  sellPrice: 60 }),
      Object.freeze({ itemId: "copper_armor",      buyPrice: 200,  sellPrice: 100 }),
      Object.freeze({ itemId: "copper_shield",     buyPrice: 100,  sellPrice: 50 }),
      Object.freeze({ itemId: "tin_sword",         buyPrice: 250,  sellPrice: 125 }),
      Object.freeze({ itemId: "tin_armor",         buyPrice: 400,  sellPrice: 200 }),
      Object.freeze({ itemId: "tin_shield",        buyPrice: 200,  sellPrice: 100 }),
      Object.freeze({ itemId: "iron_sword",        buyPrice: 600,  sellPrice: 300 }),
      Object.freeze({ itemId: "iron_armor",        buyPrice: 900,  sellPrice: 450 }),
      Object.freeze({ itemId: "iron_shield",       buyPrice: 500,  sellPrice: 250 }),
      Object.freeze({ itemId: "short_bow",         buyPrice: 300,  sellPrice: 150 }),
      Object.freeze({ itemId: "leather_armor",     buyPrice: 400,  sellPrice: 200 }),
      Object.freeze({ itemId: "bronze_arrow",      buyPrice: 15,   sellPrice: 7 }),
      Object.freeze({ itemId: "iron_arrow",        buyPrice: 40,   sellPrice: 20 }),
    ]),
  }),
  Object.freeze({
    id: "magic",
    name: "Magic Shop",
    icon: "✦",
    stock: Object.freeze([
      Object.freeze({ itemId: "air_rune",          buyPrice: 20,   sellPrice: 10 }),
      Object.freeze({ itemId: "fire_rune",         buyPrice: 25,   sellPrice: 12 }),
      Object.freeze({ itemId: "earth_rune",        buyPrice: 25,   sellPrice: 12 }),
      Object.freeze({ itemId: "water_rune",        buyPrice: 25,   sellPrice: 12 }),
      Object.freeze({ itemId: "apprentice_staff",  buyPrice: 500,  sellPrice: 250 }),
      Object.freeze({ itemId: "wizard_robe",       buyPrice: 600,  sellPrice: 300 }),
      Object.freeze({ itemId: "magic_potion",      buyPrice: 600,  sellPrice: 300 }),
      Object.freeze({ itemId: "ranging_potion",    buyPrice: 600,  sellPrice: 300 }),
    ]),
  }),
]);

/** Flat price map across all shops for sell lookups */
const PRICE_MAP = Object.freeze(
  Object.fromEntries(
    SHOPS.flatMap((s) => s.stock).map((e) => [e.itemId, e])
  )
);

/** Legacy export — all stock flat (used by sell price lookup) */
export const SHOP_STOCK = Object.freeze(SHOPS.flatMap((s) => s.stock));

/**
 * Get the sell price for any item.
 * Shop items use their defined sell price; others sell for 1 GP.
 * @param {string} itemId
 * @returns {number}
 */
export function getSellPrice(itemId) {
  const entry = PRICE_MAP[itemId];
  return entry ? entry.sellPrice : 1;
}

/**
 * Get the buy price for a shop item.
 * @param {string} itemId
 * @returns {number|null} Buy price, or null if not in shop.
 */
export function getBuyPrice(itemId) {
  const entry = PRICE_MAP[itemId];
  return entry ? entry.buyPrice : null;
}

/**
 * Buy items from the shop.
 * @param {string} itemId - Item to buy.
 * @param {number} qty - Quantity to buy.
 * @param {Array} inventory - Current inventory.
 * @param {number} gp - Current GP.
 * @returns {{ inventory: Array, gp: number } | null}
 */
export function buyItem(itemId, qty, inventory, gp) {
  const price = getBuyPrice(itemId);
  if (price === null) return null;

  const totalCost = price * qty;
  if (gp < totalCost) return null;

  const itemDef = ITEMS[itemId];
  if (!itemDef) return null;

  if (itemDef.stackable) {
    const hasStack = inventory.some((s) => s && s.id === itemId);
    if (!hasStack && isFull(inventory)) return null;
  } else {
    const emptySlots = inventory.filter((s) => s === null).length;
    if (emptySlots < qty) return null;
  }

  const newInventory = addItem(inventory, itemId, qty);
  if (!newInventory) return null;

  return { inventory: newInventory, gp: gp - totalCost };
}

/**
 * Sell items to the shop.
 * @param {string} itemId - Item to sell.
 * @param {number} qty - Quantity to sell.
 * @param {Array} inventory - Current inventory.
 * @param {number} gp - Current GP.
 * @returns {{ inventory: Array, gp: number } | null}
 */
export function sellItem(itemId, qty, inventory, gp) {
  const sellPrice = getSellPrice(itemId);
  const totalValue = sellPrice * qty;

  const newInventory = removeItem(inventory, itemId, qty);
  if (!newInventory) return null;

  return { inventory: newInventory, gp: gp + totalValue };
}

/**
 * Calculate the max qty a player can buy of an item.
 * @param {string} itemId
 * @param {number} gp
 * @returns {number}
 */
export function getMaxBuyQty(itemId, gp) {
  const price = getBuyPrice(itemId);
  if (!price) return 0;
  return Math.floor(gp / price);
}

/**
 * Calculate the max qty a player can sell of an item.
 * @param {string} itemId
 * @param {Array} inventory
 * @returns {number}
 */
export function getMaxSellQty(itemId, inventory) {
  return getItemCount(inventory, itemId);
}
