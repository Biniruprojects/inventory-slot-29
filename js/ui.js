/**
 * UI Renderer — All DOM rendering functions.
 *
 * Each function reads state and updates the DOM.
 * No state mutation happens here — pure rendering.
 */

import { getLevel, xpForLevel, levelProgress } from "./xp.js";
import { ITEMS, usedSlots } from "./inventory.js";
import { getAvailableRecipes, RECIPES } from "./alchemy.js";
import {
  LOCATIONS, getCombatLevel, isAdventureComplete, getTimeRemaining, formatTime,
} from "./adventures.js";
import { QUESTS, getAvailableQuests, getCompletedQuests, checkQuestProgress } from "./quests.js";
import { COMBAT_STYLES, getAvailableCombatStyles } from "./combat.js";
import { getEquipmentBonuses } from "./equipment.js";
import { SHOP_STOCK, SHOPS, getSellPrice, getBuyPrice } from "./shop.js";
import { usedBankSlots, BANK_SLOTS } from "./bank.js";
import { formatNumber, MAX_SLOTS } from "./utils.js";
import { getActiveBoosts } from "./potions.js";
import { PETS, getOwnedPets, getActivePet, getActivePetBonus } from "./pets.js";
import { LORE_ENTRIES, ERAS, getLoreProgress, formatMilestone } from "./lore.js";
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS, getAchievementXpBoost } from "./achievements.js";
import { canPrestige, getPrestigeXpBonus, getPrestigeGpBonus, getPrestigeTier } from "./prestige.js";
import { playLevelUp } from "./audio.js";

// ─── Skill Metadata ───────────────────────────────────────

const SKILL_META = Object.freeze({
  attack:      { name: "Attack",      icon: "assets/skill_attack.svg" },
  strength:    { name: "Strength",    icon: "assets/skill_strength.svg" },
  defence:     { name: "Defence",     icon: "assets/skill_defence.svg" },
  hitpoints:   { name: "Hitpoints",   icon: "assets/skill_hitpoints.svg" },
  alchemy:     { name: "Alchemy",     icon: "assets/skill_alchemy.svg" },
  smithing:    { name: "Smithing",    icon: "assets/skill_smithing.svg" },
  mining:      { name: "Mining",      icon: "assets/skill_mining.svg" },
  fishing:     { name: "Fishing",     icon: "assets/skill_fishing.svg" },
  cooking:     { name: "Cooking",     icon: "assets/skill_cooking.svg" },
  woodcutting: { name: "Woodcutting", icon: "assets/skill_woodcutting.svg" },
  firemaking:  { name: "Firemaking",  icon: "assets/skill_firemaking.svg" },
  magic:       { name: "Magic",       icon: "assets/skill_magic.svg" },
  ranged:      { name: "Ranged",      icon: "assets/skill_ranged.svg" },
});

// ─── DOM References ──────────────────────────────────────

const gpDisplay      = document.getElementById("gp-display");
const combatLevelEl  = document.getElementById("combat-level");
const alchemyLevel   = document.getElementById("alchemy-level");
const xpBar          = document.getElementById("xp-bar");
const xpText         = document.getElementById("xp-text");
const recipeSelect   = document.getElementById("recipe-select");
const recipePreview  = document.getElementById("recipe-preview");
const inventoryGrid  = document.getElementById("inventory-grid");
const invCount       = document.getElementById("inv-count");
const eqWeaponIcon   = document.getElementById("eq-weapon-icon");
const eqWeaponName   = document.getElementById("eq-weapon-name");
const eqArmorIcon    = document.getElementById("eq-armor-icon");
const eqArmorName    = document.getElementById("eq-armor-name");
const eqShieldIcon   = document.getElementById("eq-shield-icon");
const eqShieldName   = document.getElementById("eq-shield-name");
const eqBonusesEl    = document.getElementById("equipment-bonuses");
const character      = document.getElementById("character");
const levelUpEl      = document.getElementById("level-up");
const levelUpText    = document.getElementById("level-up-text");
const advActive      = document.getElementById("adv-active");
const advActiveIcon  = document.getElementById("adv-active-icon");
const advActiveName  = document.getElementById("adv-active-name");
const advActiveStyle = document.getElementById("adv-active-style");
const advTimerBar    = document.getElementById("adv-timer-bar");
const advTimerText   = document.getElementById("adv-timer-text");
const btnCollect     = document.getElementById("btn-collect");
const advResult      = document.getElementById("adv-result");
const advResultTitle = document.getElementById("adv-result-title");
const advResultBody  = document.getElementById("adv-result-body");
const advLocations   = document.getElementById("adv-locations");
const locationList   = document.getElementById("location-list");
const combatStyleSelect = document.getElementById("combat-style-select");
const shopGpDisplay  = document.getElementById("shop-gp-display");
const shopStockEl    = document.getElementById("shop-stock");
const shopInventoryEl = document.getElementById("shop-inventory");
const shopSwitcherEl = document.getElementById("shop-switcher");
const shopTitleEl    = document.getElementById("shop-title");

// Active shop — UI-only, not persisted
let activeShopId = "general";
const questList          = document.getElementById("quest-list");
const questCompletedList = document.getElementById("quest-completed-list");
const skillsGrid = document.getElementById("skills-grid");
const statsBlock = document.getElementById("stats-block");

// Bank DOM
const bankGrid    = document.getElementById("bank-grid");
const bankCount   = document.getElementById("bank-count");
const bankTabBar  = document.getElementById("bank-tab-bar");

// Adventure Log DOM
const logEntries  = document.getElementById("log-entries");

// Active Boosts DOM
const activeBoostsEl = document.getElementById("active-boosts");

// Pet DOM
const petGrid     = document.getElementById("pet-grid");
const petCountEl  = document.getElementById("pet-count");

// Lore DOM
const loreEntriesEl = document.getElementById("lore-entries");
const loreProgressEl = document.getElementById("lore-progress");
const loreBadgeEl   = document.getElementById("lore-badge");

// Achievement DOM
const achievementListEl = document.getElementById("achievement-list");

// Prestige DOM
const prestigePanel = document.getElementById("prestige-panel");

// Track previously seen unlocked count for badge
let lastSeenLoreCount = 0;

// Tooltip DOM
const tooltipEl   = document.getElementById("item-tooltip");

// Tutorial DOM
const tutorialOverlay = document.getElementById("tutorial-overlay");
const btnTutorialDismiss = document.getElementById("btn-tutorial-dismiss");

// Info Modal DOM
const infoModal   = document.getElementById("info-modal");
const btnInfo     = document.getElementById("btn-info");
const btnInfoClose = document.getElementById("btn-info-close");

// ─── Level-up Queue ──────────────────────────────────────

let lastRenderedLevels = {};
const levelUpQueue = [];
let levelUpShowing = false;

// Milestone notifications share the same display queue
const milestoneQueue = [];

// ─── Tutorial & Tooltip State ────────────────────────────

let tutorialChecked = false;
let longPressTimer = null;
let tooltipVisible = false;

// ═══════════════════════════════════════════════════════════
// Public API — State Snapshot Diffing
// ═══════════════════════════════════════════════════════════

/**
 * Previous state snapshot for reference-equality diffing.
 * Because state is deeply frozen (Object.freeze), unchanged
 * sub-objects keep the same reference — so `===` is O(1).
 * @type {object|null}
 */
let prevState = null;

export function renderAll(state) {
  const prev = prevState;
  prevState = state;

  // First render or GP/skills changed → header
  if (!prev || prev.player !== state.player || prev.skills !== state.skills) {
    renderHeader(state);
  }

  // Alchemy panel: alchemy XP or inventory changed
  if (!prev || prev.skills?.alchemy !== state.skills?.alchemy || prev.inventory !== state.inventory) {
    renderAlchemyPanel(state);
  }

  // Equipment
  if (!prev || prev.equipment !== state.equipment) {
    renderEquipment(state);
  }

  // Pets
  if (!prev || prev.pets !== state.pets) {
    renderPets(state);
  }

  // Inventory
  if (!prev || prev.inventory !== state.inventory) {
    renderInventory(state);
  }

  // Adventures — only re-render when adventure state or skills changed
  // Timer UI (countdown) is updated separately via updateAdventureTimer()
  if (!prev || prev.adventure !== state.adventure || prev.skills !== state.skills) {
    renderAdventures(state);
  }

  // Adventure log
  if (!prev || prev.adventureLog !== state.adventureLog) {
    renderAdventureLog(state);
  }

  // Quests: quests or skills changed
  if (!prev || prev.quests !== state.quests || prev.skills !== state.skills || prev.stats !== state.stats) {
    renderQuests(state);
  }

  // Skills overview
  if (!prev || prev.skills !== state.skills || prev.stats !== state.stats) {
    renderSkills(state);
  }

  // Shop: inventory or GP changed
  if (!prev || prev.inventory !== state.inventory || prev.player !== state.player) {
    renderShop(state);
  }

  // Bank
  if (!prev || prev.bank !== state.bank) {
    renderBank(state);
  }

  // Active potion boosts
  if (!prev || prev.potions !== state.potions) {
    renderActiveBoosts(state);
  }

  // Lore book
  if (!prev || prev.unlockedLore !== state.unlockedLore) {
    renderLoreBook(state);
  }

  // Achievements
  if (!prev || prev.achievements !== state.achievements || prev.stats !== state.stats || prev.skills !== state.skills) {
    renderAchievements(state);
  }

  // Prestige panel
  if (!prev || prev.prestige !== state.prestige || prev.skills !== state.skills) {
    renderPrestige(state);
  }

  // Level-up check — always (lightweight, reads from lastRenderedLevels)
  checkLevelUps(state);

  // Show tutorial on first render if not seen
  if (!tutorialChecked) {
    tutorialChecked = true;
    if (!state.tutorialSeen) {
      showTutorial();
    }
  }
}

export function updateAdventureTimer(state) {
  const adventure = state.adventure;
  if (!adventure || !adventure.active) return;

  const remaining = getTimeRemaining(adventure.active);
  const total = adventure.active.duration * 60 * 1000;
  const elapsed = total - remaining;
  const progress = total > 0 ? (elapsed / total) * 100 : 0;

  advTimerBar.style.width = `${Math.min(100, progress)}%`;
  advTimerText.textContent = formatTime(remaining);

  if (isAdventureComplete(adventure.active)) {
    btnCollect.hidden = false;
    advTimerBar.style.width = "100%";
    advTimerText.textContent = "Complete!";
  } else {
    btnCollect.hidden = true;
  }
}

export function showAdventureResult(result) {
  advActive.hidden = true;
  advLocations.hidden = true;
  advResult.hidden = false;

  advResultTitle.textContent = result.fled ? "You fled!" : "Adventure Complete!";

  let html = "";

  // Boss encounter notification
  if (result.bossResult) {
    const bossWon = result.bossResult.won;
    html += `<div class="boss-encounter-notification ${bossWon ? "boss-won" : "boss-fled"}">`;
    html += `<div class="boss-encounter-label">⚔ BOSS ENCOUNTER</div>`;
    html += `<div class="boss-encounter-name">${result.bossResult.boss}</div>`;
    html += `<div class="boss-encounter-result">${bossWon ? "✓ Defeated!" : "✗ Escaped..."}</div>`;
    html += `</div>`;

  // Pet drop notification (special golden celebration)
  if (result.petDrop) {
    const pet = PETS[result.petDrop];
    if (pet) {
      html += `<div class="pet-drop-notification">`;
      html += `<div class="pet-drop-title">NEW PET!</div>`;
      html += `<img src="${pet.icon}" alt="${pet.name}" class="pet-drop-icon">`;
      html += `<div class="pet-drop-name">${pet.name}</div>`;
      html += `</div>`;
    }
  }

  html += `<div class="adv-result-stat">Monsters killed: ${result.monstersKilled}</div>`;

  if (result.gpGained > 0) {
    html += `<div class="adv-result-stat adv-gp-gained">` +
      `<img src="assets/coin_gp.svg" alt="" class="adv-xp-icon"> +${formatNumber(result.gpGained)} GP</div>`;
  }

  if (result.foodConsumed > 0) {
    html += `<div class="adv-result-stat">Food consumed: ${result.foodConsumed}</div>`;
  }

  // Ammo consumed
  if (result.ammoConsumed) {
    const runes = result.ammoConsumed.runesUsed;
    if (runes && Object.keys(runes).length > 0) {
      const runeStr = Object.entries(runes).map(([id, qty]) => {
        const def = ITEMS[id];
        return def ? `${qty}× ${def.name}` : `${qty}× ${id}`;
      }).join(", ");
      html += `<div class="adv-result-stat">Runes used: ${runeStr}</div>`;
    }
    if (result.ammoConsumed.arrowsUsed > 0) {
      html += `<div class="adv-result-stat">Arrows used: ${result.ammoConsumed.arrowsUsed}</div>`;
    }
  }

  if (Object.keys(result.totalXpGains).length > 0) {
    html += `<div class="adv-result-xp">`;
    for (const [skill, amount] of Object.entries(result.totalXpGains)) {
      const meta = SKILL_META[skill];
      if (meta) {
        html += `<span class="adv-xp-entry">` +
          `<img src="${meta.icon}" alt="" class="adv-xp-icon"> +${formatNumber(amount)} XP</span>`;
      }
    }
    html += `</div>`;
  }

  if (result.loot.length > 0) {
    html += `<div class="adv-result-loot">`;
    html += `<div class="adv-result-loot-title">Loot:</div>`;
    for (const drop of result.loot) {
      const item = ITEMS[drop.itemId];
      if (item) {
        html += `<div class="adv-loot-entry">` +
          `<img src="${item.icon}" alt="" class="adv-loot-icon"> ${item.name} x${drop.qty}</div>`;
      }
    }
    html += `</div>`;
  }

  advResultBody.innerHTML = html;
}

export function hideAdventureResult() {
  advResult.hidden = true;
}

export function updateRecipePreview() {
  const recipeId = recipeSelect.value;
  const recipe = RECIPES.find((r) => r.id === recipeId);

  if (!recipe) {
    recipePreview.innerHTML = "";
    return;
  }

  // Support multi-input recipes
  if (recipe.inputs) {
    let html = "";
    for (let i = 0; i < recipe.inputs.length; i++) {
      const inp = recipe.inputs[i];
      const inputItem = ITEMS[inp.itemId];
      if (inputItem) {
        if (i > 0) html += ` + `;
        const qtyLabel = inp.qty > 1 ? `${inp.qty}× ` : "";
        html += `<img src="${inputItem.icon}" alt="${inputItem.name}"> ${qtyLabel}${inputItem.name}`;
      }
    }
    const outputItem = ITEMS[recipe.output];
    if (outputItem) {
      html += ` \u2192 <img src="${outputItem.icon}" alt="${outputItem.name}"> ${outputItem.name} `;
      html += `<span class="recipe-xp">+${recipe.xp} XP</span>`;
    }
    recipePreview.innerHTML = html;
  } else {
    const inputItem = ITEMS[recipe.input];
    const outputItem = ITEMS[recipe.output];
    recipePreview.innerHTML =
      `<img src="${inputItem.icon}" alt="${inputItem.name}"> ${inputItem.name} \u2192 ` +
      `<img src="${outputItem.icon}" alt="${outputItem.name}"> ${outputItem.name} ` +
      `<span class="recipe-xp">+${recipe.xp} XP</span>`;
  }
}

export function playSmeltAnimation() {
  character.classList.remove("smelting");
  void character.offsetWidth;
  character.classList.add("smelting");
}

export function getSelectedRecipeId() {
  return recipeSelect.value;
}

// ═══════════════════════════════════════════════════════════
// Private Renderers
// ═══════════════════════════════════════════════════════════

function renderHeader(state) {
  const cb = getCombatLevel(state.skills);
  combatLevelEl.textContent = `CB: ${cb}`;
  gpDisplay.innerHTML =
    `<img src="assets/coin_gp.svg" alt="" class="gp-icon"> ${formatNumber(state.player.gp)}`;
}

function renderAlchemyPanel(state) {
  const xp = state.skills.alchemy.xp;
  const level = getLevel(xp);
  const progress = levelProgress(xp);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = level < 99 ? xpForLevel(level + 1) : xp;

  alchemyLevel.textContent = `Lvl ${level}`;
  xpBar.style.width = `${(progress * 100).toFixed(1)}%`;

  if (level >= 99) {
    xpText.textContent = `${formatNumber(xp)} XP (MAX)`;
  } else {
    xpText.textContent =
      `${formatNumber(xp - currentThreshold)} / ${formatNumber(nextThreshold - currentThreshold)} XP`;
  }

  updateRecipeOptions(xp);
}

function checkLevelUps(state) {
  for (const [skillId, skillData] of Object.entries(state.skills)) {
    const level = getLevel(skillData.xp);

    if (
      lastRenderedLevels[skillId] !== undefined &&
      lastRenderedLevels[skillId] > 0 &&
      level > lastRenderedLevels[skillId]
    ) {
      const meta = SKILL_META[skillId];
      // Queue all level-ups between old and new level
      for (let l = lastRenderedLevels[skillId] + 1; l <= level; l++) {
        levelUpQueue.push({ name: meta ? meta.name : skillId, level: l });
      }
    }

    lastRenderedLevels[skillId] = level;
  }

  processLevelUpQueue();
}

export function queueMilestoneNotification(milestone) {
  milestoneQueue.push(milestone);
  processMilestoneQueue();
}

function processMilestoneQueue() {
  if (levelUpShowing || milestoneQueue.length === 0) return;
  const m = milestoneQueue.shift();
  levelUpShowing = true;
  const gpStr = m.gp ? ` +${formatNumber(m.gp)}GP` : "";
  levelUpText.textContent = `MILESTONE! ${m.label}${gpStr}`;
  levelUpEl.hidden = false;
  playLevelUp();
  levelUpEl.style.animation = "none";
  void levelUpEl.offsetWidth;
  levelUpEl.style.animation = "";
  setTimeout(() => {
    levelUpEl.hidden = true;
    levelUpShowing = false;
    processMilestoneQueue();
    processLevelUpQueue();
  }, 2800);
}

function processLevelUpQueue() {
  if (levelUpShowing || levelUpQueue.length === 0) return;

  const next = levelUpQueue.shift();
  levelUpShowing = true;
  levelUpText.textContent = `LEVEL UP! ${next.name} ${next.level}`;
  levelUpEl.hidden = false;
  playLevelUp();

  // Re-trigger animation
  levelUpEl.style.animation = "none";
  void levelUpEl.offsetWidth;
  levelUpEl.style.animation = "";

  setTimeout(() => {
    levelUpEl.hidden = true;
    levelUpShowing = false;
    processMilestoneQueue();
    processLevelUpQueue();
  }, 2500);
}

function updateRecipeOptions(xp) {
  const available = getAvailableRecipes(xp);
  const currentValue = recipeSelect.value;

  if (recipeSelect.children.length !== available.length) {
    recipeSelect.innerHTML = "";
    for (const recipe of available) {
      const opt = document.createElement("option");
      opt.value = recipe.id;
      opt.textContent = recipe.label;
      recipeSelect.appendChild(opt);
    }
  }

  if (available.some((r) => r.id === currentValue)) {
    recipeSelect.value = currentValue;
  }

  updateRecipePreview();
}

function renderEquipment(state) {
  const eq = state.equipment;

  renderEquipSlot(eqWeaponIcon, eqWeaponName, eq.weapon);
  renderEquipSlot(eqArmorIcon, eqArmorName, eq.armor);
  renderEquipSlot(eqShieldIcon, eqShieldName, eq.shield);

  const bonuses = getEquipmentBonuses(eq);
  let html = "";
  if (bonuses.attackBonus > 0)    html += `<span class="eq-bonus">Atk: +${bonuses.attackBonus}</span>`;
  if (bonuses.strengthBonus > 0)  html += `<span class="eq-bonus">Str: +${bonuses.strengthBonus}</span>`;
  if (bonuses.defenceBonus > 0)   html += `<span class="eq-bonus">Def: +${bonuses.defenceBonus}</span>`;
  if (bonuses.magicBonus > 0)     html += `<span class="eq-bonus">Mag: +${bonuses.magicBonus}</span>`;
  if (bonuses.rangedBonus > 0)    html += `<span class="eq-bonus">Rng: +${bonuses.rangedBonus}</span>`;
  if (!html) html = `<span class="eq-bonus eq-none">No bonuses</span>`;
  eqBonusesEl.innerHTML = html;

  // Update character sprite to reflect equipped items
  updateCharacterSprite(eq);
}

function getEquipTier(itemId) {
  if (!itemId) return null;
  if (itemId.startsWith("copper"))  return "eq-copper";
  if (itemId.startsWith("tin"))     return "eq-tin";
  if (itemId.startsWith("iron"))    return "eq-iron";
  if (itemId.startsWith("steel"))   return "eq-steel";
  if (itemId.startsWith("mithril")) return "eq-mithril";
  if (itemId.includes("wizard") || itemId.includes("magic") || itemId.includes("staff")) return "eq-magic";
  if (itemId.includes("leather"))   return "eq-leather";
  return null;
}

function updateCharacterSprite(eq) {
  if (!character) return;

  // Update body color based on armor tier
  const charBody = character.querySelector(".char-body");
  if (charBody) {
    charBody.className = "char-body";
    const armorTier = getEquipTier(eq.armor);
    if (armorTier) charBody.classList.add(armorTier);
  }

  // Weapon indicator
  let weaponEl = character.querySelector(".char-weapon");
  if (eq.weapon) {
    if (!weaponEl) {
      weaponEl = document.createElement("div");
      weaponEl.className = "char-weapon";
      charBody && charBody.appendChild(weaponEl);
    }
    weaponEl.className = "char-weapon";
    if (eq.weapon.includes("staff")) weaponEl.classList.add("eq-staff");
    else if (eq.weapon.includes("bow")) weaponEl.classList.add("eq-bow");
  } else if (weaponEl) {
    weaponEl.remove();
  }

  // Shield indicator
  let shieldEl = character.querySelector(".char-shield");
  if (eq.shield) {
    if (!shieldEl) {
      shieldEl = document.createElement("div");
      shieldEl.className = "char-shield";
      charBody && charBody.appendChild(shieldEl);
    }
    shieldEl.className = "char-shield";
    const shieldTier = getEquipTier(eq.shield);
    if (shieldTier) shieldEl.classList.add(shieldTier);
  } else if (shieldEl) {
    shieldEl.remove();
  }
}

function renderEquipSlot(iconEl, nameEl, itemId) {
  if (itemId) {
    const def = ITEMS[itemId];
    if (def) {
      iconEl.innerHTML = `<img src="${def.icon}" alt="${def.name}" class="eq-item-img">`;
      nameEl.textContent = def.name;
      iconEl.parentElement.classList.add("filled");
    }
  } else {
    iconEl.innerHTML = "";
    nameEl.textContent = "Empty";
    iconEl.parentElement.classList.remove("filled");
  }
}

function renderInventory(state) {
  const inv = state.inventory;
  const bankTabActive = document.getElementById("tab-bank").classList.contains("active");
  const isPotion = (id) => {
    const def = ITEMS[id];
    return def && def.category === "potion";
  };

  let html = "";
  for (let i = 0; i < MAX_SLOTS; i++) {
    const slot = inv[i];
    if (slot) {
      const itemDef = ITEMS[slot.id];
      const iconSrc = itemDef ? itemDef.icon : "";
      const isEquippable = itemDef && itemDef.equipSlot;
      const potionItem = isPotion(slot.id);
      const qtyLabel = (!itemDef || itemDef.stackable) ? formatNumber(slot.qty) : "";

      // Build tooltip with stats
      let tooltip = slot.name;
      if (itemDef) {
        if (itemDef.healAmount) tooltip += ` (Heals ${itemDef.healAmount} HP)`;
        if (itemDef.attackBonus) tooltip += ` | Atk +${itemDef.attackBonus}`;
        if (itemDef.strengthBonus) tooltip += ` | Str +${itemDef.strengthBonus}`;
        if (itemDef.defenceBonus) tooltip += ` | Def +${itemDef.defenceBonus}`;
        if (itemDef.magicBonus) tooltip += ` | Mag +${itemDef.magicBonus}`;
        if (itemDef.rangedBonus) tooltip += ` | Rng +${itemDef.rangedBonus}`;
      }

      html +=
        `<div class="inv-slot filled${isEquippable ? " equippable" : ""}" data-slot="${i}" data-item="${slot.id}">` +
        `<span class="inv-slot-icon"><img src="${iconSrc}" alt="${slot.name}"></span>` +
        (qtyLabel ? `<span class="inv-slot-qty">${qtyLabel}</span>` : "") +
        `<span class="inv-slot-name">${tooltip}</span>`;

      // Deposit button when bank tab is active
      if (bankTabActive) {
        html += `<button class="inv-slot-deposit" data-action="deposit" data-slot="${i}" data-item="${slot.id}">Dep</button>`;
      }

      // Use button for potions
      if (potionItem) {
        html += `<button class="inv-slot-use" data-action="use-potion" data-item="${slot.id}">Use</button>`;
      }

      html += `</div>`;
    } else {
      html += `<div class="inv-slot" data-slot="${i}"></div>`;
    }
  }

  inventoryGrid.innerHTML = html;
  invCount.textContent = `${usedSlots(inv)} / ${MAX_SLOTS}`;
}

function renderAdventures(state) {
  if (!advResult.hidden) return;

  const adventure = state.adventure;
  updateCombatStyleSelector(state);

  if (adventure.active) {
    advActive.hidden = false;
    advLocations.hidden = true;

    const loc = LOCATIONS[adventure.active.locationId];
    if (loc) {
      advActiveIcon.src = loc.icon;
      advActiveName.textContent = loc.name;
      const style = COMBAT_STYLES[adventure.active.style];
      advActiveStyle.textContent = style ? style.label : "";
    }

    updateAdventureTimer(state);
  } else {
    advActive.hidden = true;
    advLocations.hidden = false;
    renderLocationList(state);
  }
}

function updateCombatStyleSelector(state) {
  const available = getAvailableCombatStyles(state.skills);
  const currentValue = combatStyleSelect.value;

  if (combatStyleSelect.children.length !== available.length) {
    combatStyleSelect.innerHTML = "";
    for (const style of available) {
      const opt = document.createElement("option");
      opt.value = style.id;
      opt.textContent = style.label;
      combatStyleSelect.appendChild(opt);
    }
  }

  if (available.some((s) => s.id === currentValue)) {
    combatStyleSelect.value = currentValue;
  }
}

function renderLocationList(state) {
  const combatLevel = getCombatLevel(state.skills);
  const allLocations = Object.values(LOCATIONS);

  let html = "";
  for (const loc of allLocations) {
    const locked = combatLevel < loc.minCombatLevel;

    html += `<div class="adv-loc-card${locked ? " locked" : ""}">`;
    html += `<div class="adv-loc-header">`;
    html += `<img src="${loc.icon}" alt="" class="adv-loc-icon">`;
    html += `<div class="adv-loc-info">`;
    html += `<div class="adv-loc-name">${loc.name}</div>`;
    html += `<div class="adv-loc-desc">${loc.description}</div>`;
    html += `<div class="adv-loc-req">CB Req: ${loc.minCombatLevel}</div>`;
    html += `</div></div>`;

    if (locked) {
      html += `<div class="adv-loc-locked">Requires Combat Level ${loc.minCombatLevel}</div>`;
    } else {
      html += `<div class="adv-duration-btns">`;
      for (const dur of loc.durations) {
        const label = dur >= 60 ? `${dur / 60}h` : `${dur}m`;
        html += `<button class="btn-duration" data-location="${loc.id}" data-duration="${dur}">${label}</button>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
  }

  locationList.innerHTML = html;
}

// ─── Shop ─────────────────────────────────────────────────

// ─── Shop ─────────────────────────────────────────────────

export function setActiveShop(shopId) {
  activeShopId = shopId;
  if (shopSwitcherEl) {
    shopSwitcherEl.querySelectorAll(".shop-switch-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.shop === shopId);
    });
  }
}

function renderShop(state) {
  shopGpDisplay.innerHTML =
    `<img src="assets/coin_gp.svg" alt="" class="gp-icon"> ${formatNumber(state.player.gp)} GP`;

  const shop = SHOPS.find((s) => s.id === activeShopId) || SHOPS[0];
  if (shopTitleEl) shopTitleEl.textContent = shop.name;

  let html = "";
  for (const entry of shop.stock) {
    const def = ITEMS[entry.itemId];
    if (!def) continue;

    const canAfford = state.player.gp >= entry.buyPrice;
    html += `<div class="shop-item${canAfford ? "" : " cant-afford"}">`;
    html += `<div class="shop-item-icon"><img src="${def.icon}" alt="${def.name}"></div>`;
    html += `<div class="shop-item-info">`;
    html += `<div class="shop-item-name">${def.name}</div>`;
    html += `<div class="shop-item-price"><img src="assets/coin_gp.svg" alt="" class="shop-gp-icon"> ${formatNumber(entry.buyPrice)}</div>`;
    html += `</div>`;
    html += `<div class="shop-btns">`;
    html += `<button class="btn-buy" data-item="${entry.itemId}" data-qty="1"${canAfford ? "" : " disabled"}>1</button>`;
    html += `<button class="btn-buy" data-item="${entry.itemId}" data-qty="5"${state.player.gp >= entry.buyPrice * 5 ? "" : " disabled"}>5</button>`;
    html += `<button class="btn-buy" data-item="${entry.itemId}" data-qty="10"${state.player.gp >= entry.buyPrice * 10 ? "" : " disabled"}>10</button>`;
    html += `</div>`;
    html += `</div>`;
  }
  shopStockEl.innerHTML = html;

  // Sell inventory — always visible regardless of active shop
  let sellHtml = "";
  const inv = state.inventory;
  const sellItems = new Map();
  for (const slot of inv) {
    if (!slot) continue;
    const def = ITEMS[slot.id];
    if (!def) continue;
    if (sellItems.has(slot.id)) {
      sellItems.get(slot.id).totalQty += slot.qty;
    } else {
      sellItems.set(slot.id, { id: slot.id, def, totalQty: slot.qty });
    }
  }

  for (const [itemId, info] of sellItems) {
    const sellPrice = getSellPrice(itemId);
    const qtyLabel = info.def.stackable ? ` x${formatNumber(info.totalQty)}` : (info.totalQty > 1 ? ` x${info.totalQty}` : "");

    sellHtml += `<div class="shop-item sellable">`;
    sellHtml += `<div class="shop-item-icon"><img src="${info.def.icon}" alt="${info.def.name}"></div>`;
    sellHtml += `<div class="shop-item-info">`;
    sellHtml += `<div class="shop-item-name">${info.def.name}${qtyLabel}</div>`;
    sellHtml += `<div class="shop-item-price shop-sell-price"><img src="assets/coin_gp.svg" alt="" class="shop-gp-icon"> ${formatNumber(sellPrice)} ea</div>`;
    sellHtml += `</div>`;
    sellHtml += `<div class="shop-btns">`;
    sellHtml += `<button class="btn-sell" data-item="${itemId}" data-qty="1">1</button>`;
    if (info.totalQty >= 5)  sellHtml += `<button class="btn-sell" data-item="${itemId}" data-qty="5">5</button>`;
    if (info.totalQty >= 10) sellHtml += `<button class="btn-sell" data-item="${itemId}" data-qty="10">10</button>`;
    if (info.totalQty > 1)   sellHtml += `<button class="btn-sell" data-item="${itemId}" data-qty="all">All</button>`;
    sellHtml += `</div>`;
    sellHtml += `</div>`;
  }
  if (!sellHtml) sellHtml = `<div class="shop-empty">No items to sell</div>`;
  shopInventoryEl.innerHTML = sellHtml;
}

// ─── Quests ───────────────────────────────────────────────

function renderQuests(state) {
  const combatLevel = getCombatLevel(state.skills);
  const available = getAvailableQuests(state.quests, combatLevel);
  const completed = getCompletedQuests(state.quests);

  let html = "";

  if (available.length === 0 && completed.length === 0) {
    html = `<div class="quest-empty">No quests available yet. Increase your combat level!</div>`;
  }

  for (const quest of available) {
    const progress = checkQuestProgress(quest, state.stats, state.quests[quest.id] || {}, state);

    html += `<div class="quest-card" data-quest="${quest.id}">`;
    html += `<div class="quest-header">`;
    html += `<img src="${quest.icon}" alt="" class="quest-icon">`;
    html += `<div class="quest-info">`;
    html += `<div class="quest-name">${quest.name}</div>`;
    html += `<div class="quest-desc">${quest.description}</div>`;
    html += `</div></div>`;

    html += `<div class="quest-objectives">`;
    for (const obj of progress.objectives) {
      const pct = obj.target > 0 ? (obj.current / obj.target) * 100 : 0;
      html += `<div class="quest-objective">`;
      html += `<div class="quest-obj-label">${obj.label}</div>`;
      html += `<div class="quest-progress-bar-container">`;
      html += `<div class="quest-progress-bar" style="width: ${pct}%"></div>`;
      html += `<span class="quest-progress-text">${obj.current} / ${obj.target}</span>`;
      html += `</div></div>`;
    }
    html += `</div>`;

    html += `<div class="quest-rewards">`;
    if (quest.rewards.gp) {
      html += `<span class="quest-reward-gp">` +
        `<img src="assets/coin_gp.svg" alt="" class="quest-reward-icon"> ${formatNumber(quest.rewards.gp)} gp</span>`;
    }
    if (quest.rewards.xp) {
      for (const [skill, amount] of Object.entries(quest.rewards.xp)) {
        const meta = SKILL_META[skill];
        if (meta) {
          html += `<span class="quest-reward-xp">` +
            `<img src="${meta.icon}" alt="" class="quest-reward-icon"> +${amount} XP</span>`;
        }
      }
    }
    if (quest.rewards.unlocks) {
      for (const unlockId of quest.rewards.unlocks) {
        const meta = SKILL_META[unlockId];
        if (meta) {
          html += `<span class="quest-reward-unlock">Unlocks ${meta.name}</span>`;
        }
      }
    }
    html += `</div>`;

    if (progress.allDone) {
      html += `<button class="btn-claim" data-quest="${quest.id}">CLAIM REWARD</button>`;
    }

    html += `</div>`;
  }

  questList.innerHTML = html;

  let completedHtml = "";
  if (completed.length > 0) {
    completedHtml += `<h3 class="section-title completed-title">Completed</h3>`;
    for (const quest of completed) {
      completedHtml += `<div class="quest-card completed">`;
      completedHtml += `<div class="quest-header">`;
      completedHtml += `<img src="${quest.icon}" alt="" class="quest-icon">`;
      completedHtml += `<div class="quest-info">`;
      completedHtml += `<div class="quest-name">${quest.name}</div>`;
      completedHtml += `<div class="quest-desc quest-done">Complete</div>`;
      completedHtml += `</div></div></div>`;
    }
  }
  questCompletedList.innerHTML = completedHtml;
}

// ─── Skills ───────────────────────────────────────────────

function renderSkills(state) {
  const skillOrder = [
    "attack", "strength", "defence", "hitpoints",
    "alchemy", "smithing", "mining", "fishing", "cooking",
    "woodcutting", "firemaking",
    "magic", "ranged",
  ];

  let html = "";
  for (const skillId of skillOrder) {
    const skillData = state.skills[skillId];
    const meta = SKILL_META[skillId];
    if (!skillData || !meta) continue;

    const level = getLevel(skillData.xp);
    const progress = levelProgress(skillData.xp);
    const locked = skillData.unlocked === false;

    html += `<div class="skill-tile${locked ? " locked" : ""}">`;
    html += `<img src="${meta.icon}" alt="" class="skill-tile-icon">`;
    html += `<div class="skill-tile-info">`;
    html += `<div class="skill-tile-name">${meta.name}</div>`;

    if (locked) {
      html += `<div class="skill-tile-level">Locked</div>`;
    } else {
      html += `<div class="skill-tile-level">Lvl ${level}</div>`;
      html += `<div class="skill-tile-xp-bar">` +
        `<div class="skill-tile-xp-fill" style="width: ${(progress * 100).toFixed(1)}%"></div></div>`;
    }

    html += `</div></div>`;
  }

  skillsGrid.innerHTML = html;

  const s = state.stats;
  const prestige = state.prestige || { level: 0 };
  const tier = getPrestigeTier(prestige.level);
  const xpBoost = getPrestigeXpBonus(prestige.level);
  const gpBoost = getPrestigeGpBonus(prestige.level);
  const achBoost = getAchievementXpBoost(state.achievements || []);

  let statsHtml =
    `<div class="stat-row"><span>Combat Level</span><span>${getCombatLevel(state.skills)}</span></div>` +
    `<div class="stat-row"><span>Monsters Killed</span><span>${formatNumber(s.monstersKilled)}</span></div>` +
    `<div class="stat-row"><span>Adventures</span><span>${formatNumber(s.adventuresCompleted)}</span></div>` +
    `<div class="stat-row"><span>Quests Done</span><span>${formatNumber(s.questsCompleted)}</span></div>` +
    `<div class="stat-row"><span>Items Crafted</span><span>${formatNumber(s.totalItemsCrafted)}</span></div>` +
    `<div class="stat-row"><span>GP Earned</span><span>${formatNumber(s.totalGpEarned || 0)}</span></div>`;

  if (prestige.level > 0) {
    statsHtml += `<div class="stat-row prestige-row"><span>Prestige</span><span>${tier.star} Lvl ${prestige.level}</span></div>`;
    if (xpBoost > 0) {
      statsHtml += `<div class="stat-row"><span>Prestige XP Bonus</span><span>+${(xpBoost * 100).toFixed(1)}%</span></div>`;
    }
    if (gpBoost > 0) {
      statsHtml += `<div class="stat-row"><span>Prestige GP Bonus</span><span>+${(gpBoost * 100).toFixed(1)}%</span></div>`;
    }
  }
  if (achBoost > 0) {
    statsHtml += `<div class="stat-row"><span>Achievement XP Bonus</span><span>+${(achBoost * 100).toFixed(0)}%</span></div>`;
  }

  statsBlock.innerHTML = statsHtml;
}

// ─── Bank ─────────────────────────────────────────────────

export const BANK_TAB_SIZE = 20; // slots per tab

function renderBank(state) {
  if (!bankGrid) return;

  const bank = state.bank;
  const activeTab = state.activeBankTab || 0;
  const start = activeTab * BANK_TAB_SIZE;
  const end = start + BANK_TAB_SIZE;
  let html = "";

  for (let i = start; i < end; i++) {
    const slot = bank[i];
    if (slot) {
      const itemDef = ITEMS[slot.id];
      const iconSrc = itemDef ? itemDef.icon : "";
      html +=
        `<div class="bank-slot filled" data-slot="${i}" data-item="${slot.id}">` +
        `<span class="bank-slot-icon"><img src="${iconSrc}" alt="${slot.name}"></span>` +
        `<span class="bank-slot-qty">${formatNumber(slot.qty)}</span>` +
        `<span class="bank-slot-name">${slot.name}</span>` +
        `<span class="bank-qty-btns">` +
        `<button class="bank-qty-btn" data-action="withdraw" data-slot="${i}" data-qty="1">1</button>` +
        `<button class="bank-qty-btn" data-action="withdraw" data-slot="${i}" data-qty="5">5</button>` +
        `<button class="bank-qty-btn" data-action="withdraw" data-slot="${i}" data-qty="10">10</button>` +
        `<button class="bank-qty-btn" data-action="withdraw" data-slot="${i}" data-qty="all">All</button>` +
        `</span>` +
        `</div>`;
    } else {
      html += `<div class="bank-slot" data-slot="${i}"></div>`;
    }
  }

  bankGrid.innerHTML = html;

  if (bankCount) {
    bankCount.textContent = `${usedBankSlots(bank)} / ${BANK_SLOTS}`;
  }

  // Update tab bar — set active + tab icons (first item in each tab range)
  if (bankTabBar) {
    const tabBtns = bankTabBar.querySelectorAll(".bank-tab-btn");
    tabBtns.forEach((btn, tabIdx) => {
      btn.classList.toggle("active", tabIdx === activeTab);
      // Find first filled slot in this tab's range
      const tabStart = tabIdx * BANK_TAB_SIZE;
      const tabEnd = tabStart + BANK_TAB_SIZE;
      let iconHtml = `<span style="font-size:9px">${tabIdx + 1}</span>`;
      for (let s = tabStart; s < tabEnd; s++) {
        const slot = bank[s];
        if (slot) {
          const def = ITEMS[slot.id];
          if (def) {
            iconHtml = `<img class="bank-tab-icon" src="${def.icon}" alt="${def.name}"><span style="font-size:6px">${tabIdx + 1}</span>`;
          }
          break;
        }
      }
      btn.innerHTML = iconHtml;
    });
  }
}

// ─── Adventure Log ─────────────────────────────────────────

function renderAdventureLog(state) {
  if (!logEntries) return;

  const log = state.adventureLog || [];
  const entries = log.slice(0, 10);

  if (entries.length === 0) {
    logEntries.innerHTML = `<div class="log-empty">No adventures yet.</div>`;
    return;
  }

  let html = "";
  for (const entry of entries) {
    const relTime = formatRelativeTime(entry.time);
    html += `<div class="log-entry">`;
    html += `<span class="log-entry-location">${entry.location || "Unknown"}</span>`;
    html += `<span class="log-entry-stats">`;
    html += `<span class="log-entry-kills">${entry.monstersKilled} kills</span>`;
    html += `<span class="log-entry-gp">+${formatNumber(entry.gpGained || 0)} gp</span>`;
    html += `<span class="log-entry-time">${relTime}</span>`;
    html += `</span>`;
    html += `</div>`;
  }

  logEntries.innerHTML = html;
}

/**
 * Format a timestamp as a relative time string.
 * @param {number} timestamp - Unix timestamp in milliseconds.
 * @returns {string} Relative time (e.g. "2m ago", "1h ago", "3d ago").
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Active Boosts ─────────────────────────────────────────

function renderActiveBoosts(state) {
  if (!activeBoostsEl) return;

  const boosts = getActiveBoosts(state);
  const boostKeys = Object.keys(boosts);

  if (boostKeys.length === 0) {
    activeBoostsEl.hidden = true;
    return;
  }

  activeBoostsEl.hidden = false;

  const skillColors = {
    attack: "boost-attack",
    strength: "boost-strength",
    defence: "boost-defence",
    magic: "boost-magic",
    ranged: "boost-ranged",
  };

  let html = "";
  for (const [skill, amount] of Object.entries(boosts)) {
    const colorClass = skillColors[skill] || "boost-attack";
    const meta = SKILL_META[skill];
    const label = meta ? meta.name : skill;
    html += `<span class="boost-pill ${colorClass}">`;
    html += `${label} +${amount}`;
    html += `</span>`;
  }

  activeBoostsEl.innerHTML = html;
}

// ─── Pets ──────────────────────────────────────────────────

function renderPets(state) {
  if (!petGrid) return;

  const ownedPets = getOwnedPets(state);
  const activePet = getActivePet(state);
  const ownedIds = ownedPets.map((p) => p.id);
  const allPets = Object.values(PETS);

  let html = "";
  for (const pet of allPets) {
    const owned = ownedIds.includes(pet.id);
    const isActive = activePet && activePet.id === pet.id;

    if (owned) {
      html += `<div class="pet-slot owned${isActive ? " active" : ""}" data-pet="${pet.id}">`;
      html += `<img src="${pet.icon}" alt="${pet.name}" class="pet-slot-icon">`;
      html += `<span class="pet-slot-name">${pet.name}</span>`;
      html += `</div>`;
    } else {
      html += `<div class="pet-slot unowned">`;
      html += `<span class="pet-slot-unknown">?</span>`;
      html += `<span class="pet-slot-name">???</span>`;
      html += `</div>`;
    }
  }

  // Active pet bonus display
  const bonus = getActivePetBonus(state);
  if (bonus) {
    const bonusLabels = {
      xp_all: "All XP",
      gp: "GP",
      xp_combat: "Combat XP",
      xp_firemaking: "Firemaking XP",
    };
    const label = bonusLabels[bonus.type] || bonus.type;
    const pct = (bonus.amount * 100).toFixed(0);
    html += `<div class="pet-bonus-display">Active: +${pct}% ${label}</div>`;
  }

  petGrid.innerHTML = html;

  if (petCountEl) {
    petCountEl.textContent = `${ownedPets.length}/${allPets.length}`;
  }
}

// ─── Lore Book ─────────────────────────────────────────────

function renderLoreBook(state) {
  if (!loreEntriesEl) return;

  const unlocked = state.unlockedLore || [];
  const progress = getLoreProgress(state);

  // Progress display
  if (loreProgressEl) {
    loreProgressEl.textContent = `${progress.unlocked} / ${progress.total} entries (${progress.percentage}%)`;
  }

  // Notification badge — show when new entries unlocked since last view
  if (loreBadgeEl) {
    const newCount = unlocked.length - lastSeenLoreCount;
    if (newCount > 0) {
      loreBadgeEl.textContent = newCount;
      loreBadgeEl.hidden = false;
    }
  }

  // Group entries by era
  let html = "";
  for (const era of ERAS) {
    const eraEntries = LORE_ENTRIES.filter((e) => e.era === era.id);
    if (eraEntries.length === 0) continue;

    html += `<div class="lore-era">`;
    html += `<div class="lore-era-header">${era.label}</div>`;

    for (const entry of eraEntries) {
      const isUnlocked = unlocked.includes(entry.id);

      if (isUnlocked) {
        html += `<div class="lore-entry unlocked">`;
        html += `<div class="lore-entry-header">`;
        html += `<span class="lore-entry-title">${entry.title}</span>`;
        if (entry.year) html += `<span class="lore-entry-year">${entry.year}</span>`;
        html += `</div>`;
        html += `<div class="lore-entry-text">${entry.text}</div>`;
        html += `</div>`;
      } else {
        html += `<div class="lore-entry locked">`;
        html += `<div class="lore-entry-header">`;
        html += `<span class="lore-entry-title">???</span>`;
        html += `</div>`;
        html += `<div class="lore-entry-hint">${formatMilestone(entry.milestone)}</div>`;
        html += `</div>`;
      }
    }

    html += `</div>`;
  }

  loreEntriesEl.innerHTML = html;
}

/**
 * Mark lore badge as seen (call when user switches to lore tab).
 */
export function clearLoreBadge(state) {
  lastSeenLoreCount = (state.unlockedLore || []).length;
  if (loreBadgeEl) loreBadgeEl.hidden = true;
}

// ─── Achievements ──────────────────────────────────────────

function renderAchievements(state) {
  if (!achievementListEl) return;

  const unlocked = state.achievements || [];
  const tierOrder = ["easy", "medium", "hard", "elite"];

  let html = "";

  for (const tierId of tierOrder) {
    const tierDef = ACHIEVEMENT_TIERS[tierId];
    const tierAchs = ACHIEVEMENTS.filter((a) => a.tier === tierId);
    if (tierAchs.length === 0) continue;

    html += `<div class="ach-tier-group">`;
    html += `<div class="ach-tier-header" style="color:${tierDef.color}">${tierDef.label}</div>`;

    for (const ach of tierAchs) {
      const isDone = unlocked.includes(ach.id);
      const prog = ach.progress(state);
      const pct = prog.target > 0 ? (prog.current / prog.target) * 100 : 0;

      html += `<div class="ach-card${isDone ? " completed" : ""}">`;
      html += `<div class="ach-header">`;
      html += `<span class="ach-name">${ach.name}</span>`;
      if (isDone) {
        html += `<span class="ach-check" style="color:${tierDef.color}">&#10003;</span>`;
      }
      html += `</div>`;
      html += `<div class="ach-desc">${ach.description}</div>`;

      if (!isDone) {
        html += `<div class="quest-progress-bar-container">`;
        html += `<div class="quest-progress-bar" style="width:${pct}%;background:${tierDef.color}"></div>`;
        html += `<span class="quest-progress-text">${formatNumber(prog.current)} / ${formatNumber(prog.target)}</span>`;
        html += `</div>`;
      }

      // Reward label
      const rewardParts = [];
      if (ach.reward.gp) rewardParts.push(`${formatNumber(ach.reward.gp)} GP`);
      if (ach.reward.xpBoost) rewardParts.push(`+${(ach.reward.xpBoost * 100).toFixed(0)}% XP`);
      if (rewardParts.length > 0) {
        html += `<div class="ach-reward">${rewardParts.join(" + ")}</div>`;
      }

      html += `</div>`;
    }

    html += `</div>`;
  }

  achievementListEl.innerHTML = html;
}

// ─── Prestige ──────────────────────────────────────────────

function renderPrestige(state) {
  if (!prestigePanel) return;

  const prestige = state.prestige || { level: 0 };

  if (canPrestige(state) || prestige.level > 0) {
    prestigePanel.hidden = false;
  } else {
    prestigePanel.hidden = true;
    return;
  }

  const tier = getPrestigeTier(prestige.level);
  let html = `<div class="prestige-section">`;

  if (prestige.level > 0) {
    html += `<div class="prestige-current">`;
    html += `<span class="prestige-stars">${tier.star}</span> `;
    html += `<span class="prestige-label">${tier.label}</span> `;
    html += `<span class="prestige-lvl">Prestige ${prestige.level}</span>`;
    html += `</div>`;
  }

  if (canPrestige(state)) {
    const nextLevel = prestige.level + 1;
    const nextXp = getPrestigeXpBonus(nextLevel);
    const nextGp = getPrestigeGpBonus(nextLevel);
    html += `<div class="prestige-available">`;
    html += `<div class="prestige-info">Next: +${(nextXp * 100).toFixed(1)}% XP`;
    if (nextGp > 0) html += `, +${(nextGp * 100).toFixed(1)}% GP`;
    html += `</div>`;
    html += `<button class="btn btn-prestige">PRESTIGE</button>`;
    html += `</div>`;
  }

  html += `</div>`;
  prestigePanel.innerHTML = html;
}

// ─── Tutorial ──────────────────────────────────────────────

function showTutorial() {
  if (!tutorialOverlay) return;
  tutorialOverlay.hidden = false;
}

function hideTutorial() {
  if (!tutorialOverlay) return;
  tutorialOverlay.hidden = true;
}

// ─── Tooltip System ────────────────────────────────────────

/**
 * Show the item tooltip near a given element.
 * @param {string} itemId - The item ID to display info for.
 * @param {HTMLElement} anchorEl - The element to position near.
 * @param {number} [touchX] - Optional touch/mouse X coordinate.
 * @param {number} [touchY] - Optional touch/mouse Y coordinate.
 */
function showTooltip(itemId, anchorEl, touchX, touchY) {
  if (!tooltipEl) return;

  const itemDef = ITEMS[itemId];
  if (!itemDef) return;

  let html = `<div class="tooltip-name">${itemDef.name}</div>`;

  // Category
  if (itemDef.category) {
    html += `<div class="tooltip-category">${itemDef.category}</div>`;
  } else if (itemDef.equipSlot) {
    html += `<div class="tooltip-category">Equipment (${itemDef.equipSlot})</div>`;
  } else if (itemDef.stackable) {
    html += `<div class="tooltip-category">Material</div>`;
  }

  // Heal amount
  if (itemDef.healAmount) {
    html += `<div class="tooltip-heal">Heals ${itemDef.healAmount} HP</div>`;
  }

  // Stats
  if (itemDef.attackBonus) html += `<div class="tooltip-stat">Attack: +${itemDef.attackBonus}</div>`;
  if (itemDef.strengthBonus) html += `<div class="tooltip-stat">Strength: +${itemDef.strengthBonus}</div>`;
  if (itemDef.defenceBonus) html += `<div class="tooltip-stat">Defence: +${itemDef.defenceBonus}</div>`;
  if (itemDef.magicBonus) html += `<div class="tooltip-stat">Magic: +${itemDef.magicBonus}</div>`;
  if (itemDef.rangedBonus) html += `<div class="tooltip-stat">Ranged: +${itemDef.rangedBonus}</div>`;

  // Sell price
  const sellPrice = getSellPrice(itemId);
  if (sellPrice > 0) {
    html += `<div class="tooltip-price">Sell: ${formatNumber(sellPrice)} gp</div>`;
  }

  tooltipEl.innerHTML = html;
  tooltipEl.hidden = false;
  tooltipVisible = true;

  // Position near the touch/click point or the anchor element
  const x = touchX !== undefined ? touchX : 0;
  const y = touchY !== undefined ? touchY : 0;

  if (x && y) {
    // Position above or below the touch point, clamped to viewport
    const tooltipRect = tooltipEl.getBoundingClientRect();
    let left = x - tooltipRect.width / 2;
    let top = y - tooltipRect.height - 12;

    // Clamp to screen
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = y + 20; // show below if no room above

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  } else {
    const rect = anchorEl.getBoundingClientRect();
    tooltipEl.style.left = `${Math.max(8, rect.left)}px`;
    tooltipEl.style.top = `${Math.max(8, rect.top - 60)}px`;
  }
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.hidden = true;
  tooltipVisible = false;
}

// ─── Long-press & Hover Tooltip Event Wiring ──────────────

function initTooltipEvents() {
  const body = document.body;

  // Long-press for mobile (touchstart/touchend)
  body.addEventListener("touchstart", (e) => {
    const slotEl = e.target.closest(".inv-slot.filled, .bank-slot.filled, .shop-item");
    if (!slotEl) return;

    const itemId = slotEl.dataset.item;
    if (!itemId) return;

    const touch = e.touches[0];
    longPressTimer = setTimeout(() => {
      showTooltip(itemId, slotEl, touch.clientX, touch.clientY);
    }, 500);
  }, { passive: true });

  body.addEventListener("touchend", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  body.addEventListener("touchmove", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  // Tap anywhere to dismiss tooltip
  body.addEventListener("touchstart", (e) => {
    if (tooltipVisible && !e.target.closest(".item-tooltip")) {
      hideTooltip();
    }
  }, { passive: true });

  // Desktop hover (mouseenter/mouseleave via delegation)
  body.addEventListener("mouseover", (e) => {
    const slotEl = e.target.closest(".inv-slot.filled, .bank-slot.filled, .shop-item");
    if (!slotEl) return;

    const itemId = slotEl.dataset.item;
    if (!itemId) return;

    const rect = slotEl.getBoundingClientRect();
    showTooltip(itemId, slotEl, rect.left + rect.width / 2, rect.top);
  });

  body.addEventListener("mouseout", (e) => {
    const slotEl = e.target.closest(".inv-slot.filled, .bank-slot.filled, .shop-item");
    if (slotEl && tooltipVisible) {
      hideTooltip();
    }
  });

  // Click anywhere on desktop to dismiss
  body.addEventListener("click", (e) => {
    if (tooltipVisible && !e.target.closest(".item-tooltip")) {
      hideTooltip();
    }
  });
}

// ─── Info Modal Wiring ─────────────────────────────────────

function initInfoModal() {
  if (btnInfo) {
    btnInfo.addEventListener("click", () => {
      if (infoModal) infoModal.hidden = false;
    });
  }
  if (btnInfoClose) {
    btnInfoClose.addEventListener("click", () => {
      if (infoModal) infoModal.hidden = true;
    });
  }
  // Click backdrop to close
  if (infoModal) {
    infoModal.addEventListener("click", (e) => {
      if (e.target === infoModal) infoModal.hidden = true;
    });
  }
}

// ─── Tutorial Wiring ───────────────────────────────────────

function initTutorial() {
  if (btnTutorialDismiss) {
    btnTutorialDismiss.addEventListener("click", () => {
      hideTutorial();
      // Notify main.js via a custom event so state can be updated
      // without importing updateState here (ui.js is pure rendering)
      document.dispatchEvent(new CustomEvent("tutorial-dismissed"));
    });
  }
  // Click backdrop to dismiss
  if (tutorialOverlay) {
    tutorialOverlay.addEventListener("click", (e) => {
      if (e.target === tutorialOverlay) {
        hideTutorial();
        document.dispatchEvent(new CustomEvent("tutorial-dismissed"));
      }
    });
  }
}

// ─── Initialize UI Event Systems ───────────────────────────

initTooltipEvents();
initInfoModal();
initTutorial();
