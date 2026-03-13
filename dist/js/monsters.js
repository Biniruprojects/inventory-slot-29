/**
 * Monsters — Definitions with combat stats and loot tables.
 *
 * All copyright-safe names (no Jagex IP).
 * Loot tables use { itemId, chance, minQty, maxQty }.
 * "gp" is a pseudo-itemId for gold drops.
 */

export const MONSTERS = Object.freeze({
  giant_roach: Object.freeze({
    id: "giant_roach",
    name: "Giant Roach",
    icon: "assets/monster_roach.svg",
    hp: 8,
    attack: 3,
    defence: 2,
    maxHit: 2,
    combatLevel: 2,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "copper_ore", chance: 0.6, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "tin_ore", chance: 0.4, minQty: 1, maxQty: 2 }),
      Object.freeze({ itemId: "gp", chance: 0.8, minQty: 1, maxQty: 5 }),
    ]),
  }),

  hooded_thug: Object.freeze({
    id: "hooded_thug",
    name: "Hooded Thug",
    icon: "assets/monster_thug.svg",
    hp: 15,
    attack: 6,
    defence: 4,
    maxHit: 3,
    combatLevel: 5,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "iron_ore", chance: 0.4, minQty: 1, maxQty: 2 }),
      Object.freeze({ itemId: "copper_ore", chance: 0.5, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "tin_ore", chance: 0.3, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "gp", chance: 0.7, minQty: 5, maxQty: 25 }),
    ]),
  }),

  swamp_lurker: Object.freeze({
    id: "swamp_lurker",
    name: "Swamp Lurker",
    icon: "assets/monster_lurker.svg",
    hp: 25,
    attack: 10,
    defence: 8,
    maxHit: 5,
    combatLevel: 12,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "iron_ore", chance: 0.6, minQty: 2, maxQty: 4 }),
      Object.freeze({ itemId: "tin_ore", chance: 0.4, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "copper_bar", chance: 0.15, minQty: 1, maxQty: 1 }),
      Object.freeze({ itemId: "gp", chance: 0.75, minQty: 10, maxQty: 30 }),
    ]),
  }),

  cave_crawler: Object.freeze({
    id: "cave_crawler",
    name: "Cave Crawler",
    icon: "assets/monster_crawler.svg",
    hp: 40,
    attack: 16,
    defence: 14,
    maxHit: 7,
    combatLevel: 22,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "iron_ore", chance: 0.7, minQty: 3, maxQty: 6 }),
      Object.freeze({ itemId: "iron_bar", chance: 0.2, minQty: 1, maxQty: 2 }),
      Object.freeze({ itemId: "copper_bar", chance: 0.3, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "gp", chance: 0.8, minQty: 20, maxQty: 50 }),
    ]),
  }),

  // ── Phase 3: Dragon's Hollow monsters ──

  steel_golem: Object.freeze({
    id: "steel_golem",
    name: "Steel Golem",
    icon: "assets/monster_steel_golem.svg",
    hp: 55,
    attack: 22,
    defence: 20,
    maxHit: 9,
    combatLevel: 30,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "coal_ore", chance: 0.7, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "iron_bar", chance: 0.35, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "steel_bar", chance: 0.1, minQty: 1, maxQty: 1 }),
      Object.freeze({ itemId: "gp", chance: 0.85, minQty: 30, maxQty: 80 }),
    ]),
  }),

  dark_mage: Object.freeze({
    id: "dark_mage",
    name: "Dark Mage",
    icon: "assets/monster_dark_mage.svg",
    hp: 45,
    attack: 20,
    defence: 12,
    maxHit: 11,
    combatLevel: 28,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "fire_rune", chance: 0.6, minQty: 3, maxQty: 8 }),
      Object.freeze({ itemId: "air_rune", chance: 0.6, minQty: 3, maxQty: 8 }),
      Object.freeze({ itemId: "earth_rune", chance: 0.4, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "water_rune", chance: 0.4, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "gp", chance: 0.75, minQty: 25, maxQty: 60 }),
    ]),
  }),

  // ── Phase 3: Shadow Fortress monsters ──

  shadow_knight: Object.freeze({
    id: "shadow_knight",
    name: "Shadow Knight",
    icon: "assets/monster_shadow_knight.svg",
    hp: 80,
    attack: 30,
    defence: 28,
    maxHit: 12,
    combatLevel: 42,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "mithril_ore", chance: 0.4, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "steel_bar", chance: 0.3, minQty: 1, maxQty: 2 }),
      Object.freeze({ itemId: "iron_arrow", chance: 0.5, minQty: 5, maxQty: 15 }),
      Object.freeze({ itemId: "gp", chance: 0.85, minQty: 50, maxQty: 120 }),
    ]),
  }),

  young_dragon: Object.freeze({
    id: "young_dragon",
    name: "Young Dragon",
    icon: "assets/monster_young_dragon.svg",
    hp: 110,
    attack: 38,
    defence: 35,
    maxHit: 15,
    combatLevel: 55,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "mithril_ore", chance: 0.6, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "mithril_bar", chance: 0.15, minQty: 1, maxQty: 1 }),
      Object.freeze({ itemId: "steel_bar", chance: 0.4, minQty: 2, maxQty: 4 }),
      Object.freeze({ itemId: "fire_rune", chance: 0.7, minQty: 5, maxQty: 15 }),
      Object.freeze({ itemId: "gp", chance: 0.9, minQty: 80, maxQty: 200 }),
    ]),
  }),
});

/**
 * Get a monster by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getMonster(id) {
  return MONSTERS[id];
}

/**
 * Boss definitions — 1 per location, triggered after BOSS_ENCOUNTER_THRESHOLD kills.
 * Bosses have higher HP, stats, and unique loot.
 */
export const BOSS_ENCOUNTER_THRESHOLD = 25; // kills per location before boss appears

export const BOSSES = Object.freeze({
  muddy_crossroad: Object.freeze({
    id: "boss_roach_queen",
    name: "Roach Queen",
    icon: "assets/monster_roach.svg",
    isBoss: true,
    hp: 40,
    attack: 10,
    defence: 8,
    maxHit: 6,
    combatLevel: 8,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "copper_bar", chance: 0.8, minQty: 2, maxQty: 4 }),
      Object.freeze({ itemId: "tin_bar",    chance: 0.6, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "gp",         chance: 1.0, minQty: 30, maxQty: 80 }),
    ]),
  }),

  bone_woods: Object.freeze({
    id: "boss_shadow_brute",
    name: "Shadow Brute",
    icon: "assets/monster_thug.svg",
    isBoss: true,
    hp: 80,
    attack: 18,
    defence: 15,
    maxHit: 10,
    combatLevel: 18,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "iron_ore",  chance: 0.9, minQty: 5, maxQty: 10 }),
      Object.freeze({ itemId: "iron_bar",  chance: 0.4, minQty: 1, maxQty: 3 }),
      Object.freeze({ itemId: "tin_bar",   chance: 0.5, minQty: 2, maxQty: 5 }),
      Object.freeze({ itemId: "gp",        chance: 1.0, minQty: 60, maxQty: 150 }),
    ]),
  }),

  ashen_caves: Object.freeze({
    id: "boss_hollow_king",
    name: "The Hollow King",
    icon: "assets/monster_crawler.svg",
    isBoss: true,
    hp: 140,
    attack: 28,
    defence: 25,
    maxHit: 14,
    combatLevel: 32,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "iron_bar",   chance: 0.9, minQty: 3, maxQty: 6 }),
      Object.freeze({ itemId: "steel_bar",  chance: 0.3, minQty: 1, maxQty: 2 }),
      Object.freeze({ itemId: "air_rune",   chance: 0.6, minQty: 5, maxQty: 15 }),
      Object.freeze({ itemId: "fire_rune",  chance: 0.6, minQty: 5, maxQty: 15 }),
      Object.freeze({ itemId: "gp",         chance: 1.0, minQty: 120, maxQty: 280 }),
    ]),
  }),

  dragons_hollow: Object.freeze({
    id: "boss_iron_drake",
    name: "Iron Drake",
    icon: "assets/monster_steel_golem.svg",
    isBoss: true,
    hp: 200,
    attack: 38,
    defence: 35,
    maxHit: 18,
    combatLevel: 48,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "steel_bar",   chance: 0.9, minQty: 3, maxQty: 5 }),
      Object.freeze({ itemId: "mithril_ore", chance: 0.5, minQty: 2, maxQty: 4 }),
      Object.freeze({ itemId: "fire_rune",   chance: 0.7, minQty: 8, maxQty: 20 }),
      Object.freeze({ itemId: "steel_arrow", chance: 0.5, minQty: 10, maxQty: 25 }),
      Object.freeze({ itemId: "gp",          chance: 1.0, minQty: 200, maxQty: 450 }),
    ]),
  }),

  shadow_fortress: Object.freeze({
    id: "boss_void_archon",
    name: "Void Archon",
    icon: "assets/monster_shadow_knight.svg",
    isBoss: true,
    hp: 300,
    attack: 52,
    defence: 48,
    maxHit: 24,
    combatLevel: 70,
    lootTable: Object.freeze([
      Object.freeze({ itemId: "mithril_bar",  chance: 0.9, minQty: 2, maxQty: 4 }),
      Object.freeze({ itemId: "mithril_ore",  chance: 0.8, minQty: 4, maxQty: 8 }),
      Object.freeze({ itemId: "fire_rune",    chance: 0.8, minQty: 10, maxQty: 25 }),
      Object.freeze({ itemId: "steel_arrow",  chance: 0.6, minQty: 15, maxQty: 30 }),
      Object.freeze({ itemId: "gp",           chance: 1.0, minQty: 400, maxQty: 900 }),
    ]),
  }),
});
