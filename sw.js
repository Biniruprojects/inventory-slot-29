/**
 * Service Worker — Offline caching for IS 29.
 *
 * Strategy: Cache-first for all local assets.
 * Updates when a new SW version is deployed.
 */

const CACHE_NAME = "is29-v7";

const ASSETS_TO_CACHE = [
  // ── Core ──
  "./",
  "./index.html",
  "./manifest.json",

  // ── Styles & Fonts ──
  "./css/game.css",
  "./css/fonts/PressStart2P.woff2",

  // ── JavaScript modules ──
  "./js/main.js",
  "./js/state.js",
  "./js/ui.js",
  "./js/xp.js",
  "./js/utils.js",
  "./js/inventory.js",
  "./js/equipment.js",
  "./js/alchemy.js",
  "./js/smithing.js",
  "./js/mining.js",
  "./js/fishing.js",
  "./js/cooking.js",
  "./js/woodcutting.js",
  "./js/firemaking.js",
  "./js/skill-panel.js",
  "./js/adventures.js",
  "./js/combat.js",
  "./js/monsters.js",
  "./js/quests.js",
  "./js/shop.js",
  "./js/bank.js",
  "./js/magic.js",
  "./js/ranged.js",
  "./js/potions.js",
  "./js/pets.js",
  "./js/lore.js",
  "./js/achievements.js",
  "./js/prestige.js",
  "./js/audio.js",

  // ── Assets: Icons ──
  "./assets/icon-192.svg",
  "./assets/icon-512.svg",
  "./assets/icon_info.svg",
  "./assets/icon_potion_active.svg",
  "./assets/logo_swords.svg",
  "./assets/coin_gp.svg",

  // ── Assets: Skill icons ──
  "./assets/skill_alchemy.svg",
  "./assets/skill_attack.svg",
  "./assets/skill_cooking.svg",
  "./assets/skill_defence.svg",
  "./assets/skill_firemaking.svg",
  "./assets/skill_fishing.svg",
  "./assets/skill_hitpoints.svg",
  "./assets/skill_magic.svg",
  "./assets/skill_mining.svg",
  "./assets/skill_ranged.svg",
  "./assets/skill_smithing.svg",
  "./assets/skill_strength.svg",
  "./assets/skill_woodcutting.svg",

  // ── Assets: Tab icons ──
  "./assets/tab_bank.svg",
  "./assets/tab_shop.svg",

  // ── Assets: Ores ──
  "./assets/copper_ore.svg",
  "./assets/tin_ore.svg",
  "./assets/iron_ore.svg",
  "./assets/coal_ore.svg",
  "./assets/mithril_ore.svg",

  // ── Assets: Bars ──
  "./assets/copper_bar.svg",
  "./assets/tin_bar.svg",
  "./assets/iron_bar.svg",
  "./assets/steel_bar.svg",
  "./assets/mithril_bar.svg",

  // ── Assets: Logs ──
  "./assets/normal_log.svg",
  "./assets/oak_log.svg",
  "./assets/willow_log.svg",
  "./assets/maple_log.svg",
  "./assets/yew_log.svg",

  // ── Assets: Food ──
  "./assets/food_raw_shrimp.svg",
  "./assets/food_cooked_shrimp.svg",
  "./assets/food_raw_trout.svg",
  "./assets/food_cooked_trout.svg",
  "./assets/food_raw_lobster.svg",
  "./assets/food_cooked_lobster.svg",
  "./assets/food_raw_swordfish.svg",
  "./assets/food_cooked_swordfish.svg",

  // ── Assets: Runes ──
  "./assets/rune_air.svg",
  "./assets/rune_earth.svg",
  "./assets/rune_fire.svg",
  "./assets/rune_water.svg",

  // ── Assets: Arrows ──
  "./assets/arrow_bronze.svg",
  "./assets/arrow_iron.svg",
  "./assets/arrow_steel.svg",

  // ── Assets: Equipment ──
  "./assets/eq_copper_sword.svg",
  "./assets/eq_copper_armor.svg",
  "./assets/eq_copper_shield.svg",
  "./assets/eq_tin_sword.svg",
  "./assets/eq_tin_armor.svg",
  "./assets/eq_tin_shield.svg",
  "./assets/eq_iron_sword.svg",
  "./assets/eq_iron_armor.svg",
  "./assets/eq_iron_shield.svg",
  "./assets/eq_steel_sword.svg",
  "./assets/eq_steel_armor.svg",
  "./assets/eq_steel_shield.svg",
  "./assets/eq_mithril_sword.svg",
  "./assets/eq_mithril_armor.svg",
  "./assets/eq_mithril_shield.svg",
  "./assets/eq_staff.svg",
  "./assets/eq_shortbow.svg",
  "./assets/eq_leather_armor.svg",
  "./assets/eq_wizard_robe.svg",

  // ── Assets: Potions ──
  "./assets/item_attack_potion.svg",
  "./assets/item_strength_potion.svg",
  "./assets/item_defence_potion.svg",
  "./assets/item_magic_potion.svg",
  "./assets/item_ranging_potion.svg",
  "./assets/item_super_restore.svg",

  // ── Assets: Pets ──
  "./assets/pet_rock_crab.svg",
  "./assets/pet_shadow_cat.svg",
  "./assets/pet_baby_dragon.svg",
  "./assets/pet_fire_beetle.svg",

  // ── Assets: Locations ──
  "./assets/loc_crossroad.svg",
  "./assets/loc_woods.svg",
  "./assets/loc_caves.svg",
  "./assets/loc_dragons_hollow.svg",
  "./assets/loc_shadow_fortress.svg",

  // ── Assets: Monsters ──
  "./assets/monster_roach.svg",
  "./assets/monster_thug.svg",
  "./assets/monster_lurker.svg",
  "./assets/monster_crawler.svg",
  "./assets/monster_dark_mage.svg",
  "./assets/monster_steel_golem.svg",
  "./assets/monster_shadow_knight.svg",
  "./assets/monster_young_dragon.svg",

  // ── Assets: Quests ──
  "./assets/quest_cave.svg",
  "./assets/quest_dragon.svg",
  "./assets/quest_forest.svg",
  "./assets/quest_fortress.svg",
  "./assets/quest_mage.svg",
  "./assets/quest_magic.svg",
  "./assets/quest_ranged.svg",
  "./assets/quest_shield.svg",
  "./assets/quest_steel.svg",
  "./assets/quest_sword.svg",
];

// On install, pre-cache all known assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// On activate, purge old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first, then network fallback
self.addEventListener("fetch", (event) => {
  // Only cache GET requests for local assets
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache successful responses for local assets
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
