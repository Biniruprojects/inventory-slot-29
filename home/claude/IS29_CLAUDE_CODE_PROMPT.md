# IS29 — Claude Code Context Prompt

Kopieer dit in Claude Code (CMD) als je start in de project folder.

---

## KORTE PROMPT (voor quick fixes/features)

```
This is Inventory Slot 29 — a fan-made OSRS-inspired idle RPG PWA (beta v0.6).
Built in vanilla ES modules, no framework. ~11,000 lines across 35+ JS files.

Architecture:
- Immutable state via updateState() + deepFreeze() in state.js
- All UI in ui.js (dirty-checked renderAll), events wired in main.js
- Skills follow a contract: ACTIONS/RECIPES, getAvailableActions, canExecute, execute
- Gathering skills (Mining, Fishing, Woodcutting, Firemaking): produce items on tickMs timer
- Processing skills (Alchemy, Smithing, Cooking): consume items to produce output
- Adventures = timed combat simulation, completeAdventure() in adventures.js
- Bank: 6 tabs × 20 slots, state.activeBankTab
- Saves: debounced 2s to localStorage + IndexedDB, saveNow() for critical moments
- Service worker: is29-v12, bump version string in sw.js on every deploy

Next task: [BESCHRIJF WAT JE WIL]
```

---

## LANGE PROMPT (voor nieuwe sessie / grote features)

```
This is Inventory Slot 29 — a fan-made OSRS-inspired idle RPG PWA (beta v0.6).
Built in vanilla ES modules, no framework, no build step. ~11,000 lines, 35+ files.

== STATE ==
- state.js: single source of truth, deepFrozen immutable object
- updateState(partial): shallow merge per top-level key, debounced save (2s)
- saveNow(): immediate flush — call after adventure complete, prestige, import
- IndexedDB primary storage, localStorage sync fallback
- Migration system in migrateState() for backward compat

== SKILLS (13 total) ==
Gathering (tick-based auto): Mining, Fishing, Woodcutting, Firemaking
Processing (recipe-based):   Alchemy, Smithing, Cooking
Combat (adventure-based):    Attack, Strength, Defence, Hitpoints, Magic, Ranged

Skill contract: ACTIONS or RECIPES array, getAvailableActions(xp), canExecute(action, inv, xp), execute(action, inv, xp)
Skill panel: skill-panel.js — generic renderer, works for all skills via SKILL_DEFS

== COMBAT ==
- Simulated in bulk when adventure completes (not real-time)
- simulateAdventure() in combat.js
- completeAdventure() in adventures.js (applies pet bonuses, clears potions, boss check)
- Boss encounter every 25 kills per location (BOSS_ENCOUNTER_THRESHOLD in monsters.js)
- 5 locations, 5 bosses (one per location)

== INVENTORY / BANK ==
- 28 inventory slots (MAX_SLOTS in utils.js)
- Bank: 120 slots, 6 tabs × 20 slots each, activeBankTab in state
- All functions return new arrays (immutable-friendly): addItem, removeItem, getItemCount

== UI ==
- renderAll(state) in ui.js: dirty-checked per section via prevState comparison
- Gather progress bar: RAF loop in main.js → updateGatherProgress() in skill-panel.js
- Equipment changes character sprite colors: char-body CSS classes (eq-copper, eq-iron etc.)
- Level-up + milestone notifications share same queue in ui.js

== SHOP ==
- 3 shops in shop.js: general, weapons, magic (SHOPS array)
- Active shop UI-only (not persisted), setActiveShop() export from ui.js
- Sell section always visible regardless of active shop

== QUESTS / MILESTONES / ACHIEVEMENTS ==
- quests.js: QUESTS object, checkQuestProgress(), objective types: monsters_killed, location_completed, skill_level, fish_caught, logs_cut, food_cooked, items_crafted
- milestones.js: SKILL_MILESTONES — every 10 levels per skill, GP + items + xpBonus
- achievements.js: tiered (easy/medium/hard/elite), permanent XP boosts

== DEPLOY ==
- No build step: serve dist/ directly
- Local: node serve.js (pure Node, no npm needed)
- SW cache version: is29-v12 in sw.js — bump on every deploy
- PWA installable via Chrome "Add to Home Screen"
- Play Store: use Bubblewrap CLI to build TWA (see PLAY_STORE_GUIDE.md)

Next task: [BESCHRIJF WAT JE WIL]
```

---

## HANDIGE LOSSE PROMPTS

**Bug fixen:**
```
Bug: [BESCHRIJF]. Kijk in [FILE] rond regel [N]. Fix zonder andere gedrag te breken.
```

**Nieuwe skill actie toevoegen:**
```
Voeg een nieuwe actie toe aan [SKILL]: id="[X]", output="[Y]", xp=[N], minLevel=[N], tickMs=[N].
Voeg ook het item toe aan ITEMS in inventory.js als het er nog niet in staat.
```

**Nieuwe quest toevoegen:**
```
Voeg een nieuwe quest toe aan quests.js. Naam: "[X]". 
Objectives: [BESCHRIJF]. Rewards: [GP, XP, ITEMS]. minCombatLevel: [N].
Volg exact hetzelfde patroon als bestaande quests.
```

**SW cache bumpen:**
```
Bump de service worker cache versie in sw.js van is29-v12 naar is29-v13.
```

---

*IS29 — Biniru Projects — v0.6.0*
