/**
 * Main — Boot, game loop, event wiring.
 *
 * Entry point for Inventory Slot 29.
 * Initializes state, renders UI, and binds all user interactions.
 */

import { initState, getState, updateState, subscribe, isAnotherTabActive, exportSave, importSave, saveNow } from "./state.js";
import { RECIPES, canSmelt, executeSmelt } from "./alchemy.js";
import { ITEMS, addItem, removeItem, getItemCount } from "./inventory.js";
import {
  LOCATIONS, startAdventure, isAdventureComplete, completeAdventure,
  getCombatLevel, selectFoodForAdventure,
} from "./adventures.js";
import { QUESTS, checkQuestProgress } from "./quests.js";
import {
  renderAll, playSmeltAnimation, getSelectedRecipeId, updateRecipePreview,
  updateAdventureTimer, showAdventureResult, hideAdventureResult,
  clearLoreBadge, setActiveShop, queueMilestoneNotification,
} from "./ui.js";
import { getEquipmentBonuses, equipItem, unequipItem } from "./equipment.js";
import { buyItem, sellItem, getMaxSellQty } from "./shop.js";
import { depositItem, withdrawItem, withdrawAmount, depositAll } from "./bank.js";
import * as Smithing from "./smithing.js";
import * as Mining from "./mining.js";
import * as Fishing from "./fishing.js";
import * as Cooking from "./cooking.js";
import * as Woodcutting from "./woodcutting.js";
import * as Firemaking from "./firemaking.js";
import {
  initSkillPanel, renderSkillPanel, wireSkillPanelEvents,
  getActiveSkillId, getSelectedActionId, getActiveSkillDef,
  isAutoActive, stopAuto, startAuto,
  updateGatherProgress, resetGatherProgress,
} from "./skill-panel.js";
import { ARROW_TYPES } from "./ranged.js";
import { usePotion } from "./potions.js";
import { setActivePet, withPetXpBonus, rollForPet, addPet } from "./pets.js";
import { checkLoreUnlocks } from "./lore.js";
import { checkAchievementUnlocks, getAchievementReward } from "./achievements.js";
import { canPrestige, executePrestige } from "./prestige.js";
import { checkNewMilestones } from "./milestones.js";
import { playLevelUp, playSmelt, playHit, playQuestComplete, playShopBuy, playAchievement, playGather, setSoundEnabled } from "./audio.js";

// ─── DOM References ──────────────────────────────────────

const btnSmelt          = document.getElementById("btn-smelt");
const btnAuto           = document.getElementById("btn-auto");
const recipeSelect      = document.getElementById("recipe-select");
const btnCollect        = document.getElementById("btn-collect");
const btnDismissResult  = document.getElementById("btn-dismiss-result");
const locationList      = document.getElementById("location-list");
const combatStyleSelect = document.getElementById("combat-style-select");
const questListEl       = document.getElementById("quest-list");
const tabButtons        = document.querySelectorAll(".tab-btn");
const tabPanels         = document.querySelectorAll(".tab-panel");
const inventoryGrid     = document.getElementById("inventory-grid");
const equipSlotsEl      = document.getElementById("equipment-slots");
const shopStockEl       = document.getElementById("shop-stock");
const shopInventoryEl   = document.getElementById("shop-inventory");
const bankGridEl        = document.getElementById("bank-grid");
const btnDepositAll     = document.getElementById("btn-deposit-all");
const petListEl         = document.getElementById("pet-grid");
const btnExportSave     = document.getElementById("btn-export-save");
const btnImportSave     = document.getElementById("btn-import-save");
const importFileInput   = document.getElementById("import-file-input");
const btnMute           = document.getElementById("btn-mute");
const achievementListEl = document.getElementById("achievement-list");
const prestigePanel     = document.getElementById("prestige-panel");

// ─── Auto-Smelt State (Alchemy — not persisted) ─────────

let autoSmeltActive = false;
let autoSmeltTimer = null;
const AUTO_SMELT_INTERVAL = 2000;

// ─── Adventure Timer ─────────────────────────────────────

let adventureTimerInterval = null;

// ─── Gathering auto-timer ────────────────────────────────

let gatheringTimer = null;
let gatheringRaf = null;   // requestAnimationFrame handle for progress bar
let gatherTickStart = 0;   // timestamp when current tick started
let gatherTickMs = 0;      // current tick duration

// ─── Boot ────────────────────────────────────────────────

function boot() {
  const state = initState();
  if (!state) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
        font-family:monospace;color:#c8aa6e;background:#1a1a2e;text-align:center;padding:2rem;">
        <div>
          <h2>Already Running</h2>
          <p>Inventory Slot 29 is open in another tab.</p>
          <p style="opacity:0.6">Close the other tab first, then refresh this one.</p>
        </div>
      </div>`;
    return;
  }

  // Initialize sound state
  setSoundEnabled(state.settings?.soundEnabled !== false);
  updateMuteButton(state);

  // Initialize skill panel
  const selectorEl = document.getElementById("skill-selector");
  const panelBodyEl = document.getElementById("skill-panel-body");
  initSkillPanel(selectorEl, panelBodyEl);

  // Subscribe UI renderer to state changes
  subscribe((state) => {
    renderAll(state);
    renderAndWireSkillPanel(state);

    // Check for newly unlocked lore entries
    const newLore = checkLoreUnlocks(state);
    if (newLore.length > 0) {
      updateState({
        unlockedLore: [...state.unlockedLore, ...newLore],
      });
    }

    // Check for newly unlocked achievements
    const newAch = checkAchievementUnlocks(state);
    if (newAch.length > 0) {
      playAchievement();
      let gpBonus = 0;
      for (const achId of newAch) {
        gpBonus += getAchievementReward(achId);
      }
      updateState({
        achievements: [...(state.achievements || []), ...newAch],
        player: gpBonus > 0 ? { gp: state.player.gp + gpBonus } : undefined,
        stats: gpBonus > 0 ? { totalGpEarned: (state.stats.totalGpEarned || 0) + gpBonus } : undefined,
      });
    }
  });

  // Initial render
  const initialState = getState();
  renderAll(initialState);
  renderAndWireSkillPanel(initialState);

  // Initial lore check (catches milestones from migrated saves)
  const initialLore = checkLoreUnlocks(initialState);
  if (initialLore.length > 0) {
    updateState({ unlockedLore: [...initialState.unlockedLore, ...initialLore] });
  }

  // Initial achievement check
  const initialAch = checkAchievementUnlocks(getState());
  if (initialAch.length > 0) {
    let gpBonus = 0;
    for (const achId of initialAch) {
      gpBonus += getAchievementReward(achId);
    }
    const s = getState();
    updateState({
      achievements: [...(s.achievements || []), ...initialAch],
      player: gpBonus > 0 ? { gp: s.player.gp + gpBonus } : undefined,
      stats: gpBonus > 0 ? { totalGpEarned: (s.stats.totalGpEarned || 0) + gpBonus } : undefined,
    });
  }

  // ── Tab switching ──
  for (const btn of tabButtons) {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  }

  // ── Alchemy ──
  btnSmelt.addEventListener("click", handleSmelt);
  btnAuto.addEventListener("click", handleAutoToggle);
  recipeSelect.addEventListener("change", handleRecipeChange);

  // ── Adventures ──
  locationList.addEventListener("click", handleLocationClick);
  btnCollect.addEventListener("click", handleCollectLoot);
  btnDismissResult.addEventListener("click", handleDismissResult);

  // ── Quests ──
  questListEl.addEventListener("click", handleQuestClick);

  // ── Achievements ──
  if (achievementListEl) {
    achievementListEl.addEventListener("click", handleAchievementClick);
  }

  // ── Inventory equip (click equippable items) ──
  inventoryGrid.addEventListener("click", handleInventoryClick);

  // ── Equipment unequip ──
  equipSlotsEl.addEventListener("click", handleEquipmentClick);

  // ── Shop ──
  shopStockEl.addEventListener("click", handleShopBuy);
  shopInventoryEl.addEventListener("click", handleShopSell);

  // ── Shop switcher ──
  const shopSwitcherEl = document.getElementById("shop-switcher");
  if (shopSwitcherEl) {
    shopSwitcherEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".shop-switch-btn");
      if (!btn) return;
      setActiveShop(btn.dataset.shop);
      renderAll(getState());
    });
  }

  // ── Bank ──
  if (bankGridEl) {
    bankGridEl.addEventListener("click", handleBankWithdraw);
  }
  if (btnDepositAll) {
    btnDepositAll.addEventListener("click", handleDepositAll);
  }

  // ── Bank tabs ──
  const bankTabBarEl = document.getElementById("bank-tab-bar");
  if (bankTabBarEl) {
    bankTabBarEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".bank-tab-btn");
      if (!btn) return;
      const tabIdx = parseInt(btn.dataset.bankTab, 10);
      if (!isNaN(tabIdx)) {
        updateState({ activeBankTab: tabIdx });
      }
    });
  }

  // ── Pets ──
  if (petListEl) {
    petListEl.addEventListener("click", handlePetSelect);
  }

  // ── Save Export/Import ──
  if (btnExportSave) {
    btnExportSave.addEventListener("click", () => exportSave());
  }
  if (btnImportSave && importFileInput) {
    btnImportSave.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", handleImportSave);
  }

  // ── Mute toggle ──
  if (btnMute) {
    btnMute.addEventListener("click", handleMuteToggle);
  }

  // ── Prestige ──
  if (prestigePanel) {
    prestigePanel.addEventListener("click", handlePrestigeClick);
  }

  // ── Tutorial dismissed event (fired by ui.js) ──
  document.addEventListener("tutorial-dismissed", () => {
    updateState({ tutorialSeen: true });
  });

  // ── Button state tracking ──
  subscribe(updateSmeltButton);
  updateSmeltButton(getState());

  // ── Offline adventure check ──
  checkOfflineAdventure();

  // ── Start adventure timer if one is active ──
  startAdventureTimer();

  // ── Register service worker ──
  registerServiceWorker();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // SW registration failed — game still works without it
    });
  }
}

// ═══════════════════════════════════════════════════════════
// Skill Panel Bridge
// ═══════════════════════════════════════════════════════════

function renderAndWireSkillPanel(state) {
  renderSkillPanel(state);

  if (getActiveSkillId() !== "alchemy") {
    wireSkillPanelEvents(handleSkillExecute, handleSkillAutoToggle);
  }
}

// ═══════════════════════════════════════════════════════════
// Tab Switching
// ═══════════════════════════════════════════════════════════

function switchTab(tabId) {
  for (const btn of tabButtons) {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  }
  for (const panel of tabPanels) {
    panel.classList.toggle("active", panel.id === tabId);
  }

  // Clear lore notification badge when viewing lore tab
  if (tabId === "tab-lore") {
    clearLoreBadge(getState());
  }
}

// ═══════════════════════════════════════════════════════════
// Alchemy — Smelt & Auto-Smelt
// ═══════════════════════════════════════════════════════════

function handleSmelt() {
  const recipeId = getSelectedRecipeId();
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return;

  const state = getState();
  const result = executeSmelt(recipe, state.inventory, state.skills.alchemy.xp);
  if (!result) return;

  playSmeltAnimation();
  playSmelt();

  const xpGained = withPetXpBonus(result.xpGained, "alchemy");

  updateState({
    inventory: result.inventory,
    skills: {
      alchemy: { xp: state.skills.alchemy.xp + xpGained },
    },
    stats: {
      totalXpGained: state.stats.totalXpGained + xpGained,
      totalItemsCrafted: state.stats.totalItemsCrafted + 1,
    },
  });
}

function handleAutoToggle() {
  autoSmeltActive = !autoSmeltActive;
  btnAuto.classList.toggle("active", autoSmeltActive);

  if (autoSmeltActive) {
    startAutoSmelt();
  } else {
    stopAutoSmelt();
  }
}

function startAutoSmelt() {
  stopAutoSmelt();

  autoSmeltTimer = setInterval(() => {
    const recipeId = getSelectedRecipeId();
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) {
      stopAutoSmelt();
      return;
    }

    const state = getState();
    const check = canSmelt(recipe, state.inventory, state.skills.alchemy.xp);
    if (!check.canSmelt) {
      stopAutoSmelt();
      return;
    }

    handleSmelt();
  }, AUTO_SMELT_INTERVAL);
}

function stopAutoSmelt() {
  autoSmeltActive = false;
  btnAuto.classList.remove("active");

  if (autoSmeltTimer) {
    clearInterval(autoSmeltTimer);
    autoSmeltTimer = null;
  }
}

function handleRecipeChange() {
  updateRecipePreview();
  updateSmeltButton(getState());

  if (autoSmeltActive) {
    stopAutoSmelt();
  }
}

function updateSmeltButton(state) {
  const recipeId = getSelectedRecipeId();
  const recipe = RECIPES.find((r) => r.id === recipeId);

  if (!recipe) {
    btnSmelt.disabled = true;
    return;
  }

  const check = canSmelt(recipe, state.inventory, state.skills.alchemy.xp);
  btnSmelt.disabled = !check.canSmelt;
}

// ═══════════════════════════════════════════════════════════
// Generic Skill Execute (Smithing, Mining, Fishing, Cooking)
// ═══════════════════════════════════════════════════════════

function handleSkillExecute() {
  const def = getActiveSkillDef();
  if (!def || def.id === "alchemy") return;

  const actionId = getSelectedActionId();
  if (!actionId) return;

  const mod = def.module;
  const actions = mod.RECIPES || mod.ACTIONS;
  const action = actions.find((a) => a.id === actionId);
  if (!action) return;

  const state = getState();
  const skillXp = state.skills[def.stateKey].xp;

  const check = mod.canExecute(action, state.inventory, skillXp);
  if (!check.can) return;

  const result = mod.execute(action, state.inventory, skillXp);
  if (!result) return;

  playSmeltAnimation();
  playGather();

  const xpGained = withPetXpBonus(result.xpGained, def.stateKey);

  // Roll for skill-sourced pet drops (e.g. Fire Beetle from firemaking)
  const petDrop = rollForPet(def.stateKey);
  if (petDrop) {
    addPet(petDrop);
  }

  // Track skill-specific stats
  const extraStats = {};
  if (def.stateKey === "fishing") {
    extraStats.totalFishCaught = (state.stats.totalFishCaught || 0) + 1;
  } else if (def.stateKey === "woodcutting") {
    extraStats.totalLogsCut = (state.stats.totalLogsCut || 0) + 1;
  } else if (def.stateKey === "firemaking") {
    extraStats.totalLogsBurned = (state.stats.totalLogsBurned || 0) + 1;
  } else if (def.stateKey === "cooking") {
    extraStats.totalFoodCooked = (state.stats.totalFoodCooked || 0) + 1;
  }

  const newXp = skillXp + xpGained;

  // Check milestones
  const newMilestones = checkNewMilestones(def.stateKey, skillXp, newXp, state.milestones || {});
  let milestoneGp = 0;
  let milestoneItems = [];
  const claimedKeys = {};
  for (const m of newMilestones) {
    claimedKeys[m.key] = true;
    milestoneGp += m.gp || 0;
    if (m.items) milestoneItems = milestoneItems.concat(m.items);
    queueMilestoneNotification(m);
  }

  // Apply milestone item rewards to inventory
  let newInventory = result.inventory;
  for (const drop of milestoneItems) {
    const updated = addItem(newInventory, drop.itemId, drop.qty);
    if (updated) newInventory = updated;
  }

  updateState({
    inventory: newInventory,
    skills: {
      [def.stateKey]: { xp: newXp },
    },
    stats: {
      totalXpGained: state.stats.totalXpGained + xpGained,
      totalItemsCrafted: state.stats.totalItemsCrafted + 1,
      ...extraStats,
    },
    ...(Object.keys(claimedKeys).length > 0 ? { milestones: claimedKeys } : {}),
    ...(milestoneGp > 0 ? { player: { gp: state.player.gp + milestoneGp } } : {}),
  });
}

function handleSkillAutoToggle() {
  const def = getActiveSkillDef();
  if (!def || def.id === "alchemy") return;

  if (isAutoActive()) {
    stopAuto();
    stopGatheringTimer();
    return;
  }

  startAuto();

  const isGathering = def.type === "gathering";
  const actionId = getSelectedActionId();
  const mod = def.module;
  const actions = mod.RECIPES || mod.ACTIONS;
  const action = actions.find((a) => a.id === actionId);
  const interval = (isGathering && action) ? action.tickMs : AUTO_SMELT_INTERVAL;

  startGatheringTimer(interval, () => {
    const currentDef = getActiveSkillDef();
    if (!currentDef || currentDef.id === "alchemy") {
      stopGatheringTimer();
      return;
    }
    const currentActionId = getSelectedActionId();
    if (!currentActionId) {
      stopGatheringTimer();
      return;
    }

    const currentMod = currentDef.module;
    const currentActions = currentMod.RECIPES || currentMod.ACTIONS;
    const currentAction = currentActions.find((a) => a.id === currentActionId);
    if (!currentAction) {
      stopGatheringTimer();
      return;
    }

    const state = getState();
    const skillXp = state.skills[currentDef.stateKey].xp;
    const check = currentMod.canExecute(currentAction, state.inventory, skillXp);
    if (!check.can) {
      stopGatheringTimer();
      return;
    }

    handleSkillExecute();
  });
}

function startGatheringTimer(interval, callback) {
  stopGatheringTimer();
  gatherTickMs = interval;
  gatherTickStart = performance.now();

  // RAF loop for smooth progress bar
  function rafLoop(now) {
    updateGatherProgress(now - gatherTickStart, gatherTickMs);
    gatheringRaf = requestAnimationFrame(rafLoop);
  }
  gatheringRaf = requestAnimationFrame(rafLoop);

  gatheringTimer = setInterval(() => {
    gatherTickStart = performance.now();
    resetGatherProgress();
    callback();
  }, interval);
}

function stopGatheringTimer() {
  stopAuto();
  if (gatheringTimer) {
    clearInterval(gatheringTimer);
    gatheringTimer = null;
  }
  if (gatheringRaf) {
    cancelAnimationFrame(gatheringRaf);
    gatheringRaf = null;
  }
  resetGatherProgress();
}

// ═══════════════════════════════════════════════════════════
// Inventory — Equip on click
// ═══════════════════════════════════════════════════════════

function handleInventoryClick(e) {
  // Handle potion use — clicking "Use" button on a potion slot
  const potionBtn = e.target.closest(".inv-slot-use");
  if (potionBtn) {
    const potionId = potionBtn.dataset.item;
    if (potionId) {
      usePotion(potionId);
    }
    return;
  }

  // Handle deposit — clicking "Dep" button while bank tab is active
  const depositBtn = e.target.closest(".inv-slot-deposit");
  if (depositBtn) {
    const itemId = depositBtn.dataset.item;
    if (!itemId) return;

    const state = getState();
    const slot = state.inventory.find((s) => s && s.id === itemId);
    if (!slot) return;

    const result = depositItem(state.inventory, state.bank, itemId, slot.qty);
    if (!result) return;

    updateState({
      inventory: result.inventory,
      bank: result.bank,
    });
    return;
  }

  // Handle equipment — clicking an equippable slot
  const slotEl = e.target.closest(".inv-slot.equippable");
  if (!slotEl) return;

  const itemId = slotEl.dataset.item;
  if (!itemId) return;

  const state = getState();
  const result = equipItem(state.inventory, state.equipment, itemId);
  if (!result) return;

  updateState({
    inventory: result.inventory,
    equipment: result.equipment,
  });
}

// ═══════════════════════════════════════════════════════════
// Equipment — Unequip on click
// ═══════════════════════════════════════════════════════════

function handleEquipmentClick(e) {
  const slotEl = e.target.closest(".eq-slot.filled");
  if (!slotEl) return;

  const slotName = slotEl.dataset.slot;
  if (!slotName) return;

  const state = getState();
  const result = unequipItem(state.inventory, state.equipment, slotName);
  if (!result) return;

  updateState({
    inventory: result.inventory,
    equipment: result.equipment,
  });
}

// ═══════════════════════════════════════════════════════════
// Shop — Buy & Sell (with bulk support)
// ═══════════════════════════════════════════════════════════

function handleShopBuy(e) {
  const btn = e.target.closest(".btn-buy");
  if (!btn || btn.disabled) return;

  const itemId = btn.dataset.item;
  const qty = parseInt(btn.dataset.qty, 10) || 1;
  if (!itemId) return;

  const state = getState();
  const result = buyItem(itemId, qty, state.inventory, state.player.gp);
  if (!result) return;

  playShopBuy();

  updateState({
    inventory: result.inventory,
    player: { gp: result.gp },
  });
}

function handleShopSell(e) {
  const btn = e.target.closest(".btn-sell");
  if (!btn) return;

  const itemId = btn.dataset.item;
  const qtyStr = btn.dataset.qty;
  if (!itemId) return;

  const state = getState();
  const qty = qtyStr === "all" ? getMaxSellQty(itemId, state.inventory) : parseInt(qtyStr, 10) || 1;
  if (qty <= 0) return;

  const result = sellItem(itemId, qty, state.inventory, state.player.gp);
  if (!result) return;

  const gpGained = result.gp - state.player.gp;

  playShopBuy();

  updateState({
    inventory: result.inventory,
    player: { gp: result.gp },
    stats: {
      totalGpEarned: (state.stats.totalGpEarned || 0) + gpGained,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// Bank — Deposit & Withdraw
// ═══════════════════════════════════════════════════════════

function handleBankWithdraw(e) {
  // Handle qty buttons (1/5/10/All)
  const qtyBtn = e.target.closest(".bank-qty-btn");
  if (qtyBtn) {
    const slotIndex = parseInt(qtyBtn.dataset.slot, 10);
    const qtyStr = qtyBtn.dataset.qty;
    if (isNaN(slotIndex)) return;

    const state = getState();
    const bankSlot = state.bank[slotIndex];
    if (!bankSlot) return;

    const qty = qtyStr === "all" ? bankSlot.qty : parseInt(qtyStr, 10) || 1;
    const result = withdrawAmount(state.inventory, state.bank, slotIndex, qty);
    if (!result) return;

    updateState({
      inventory: result.inventory,
      bank: result.bank,
    });
    return;
  }

  // Fallback: clicking the bank slot itself withdraws 1
  const slotEl = e.target.closest(".bank-slot.filled");
  if (!slotEl) return;

  const itemId = slotEl.dataset.item;
  if (!itemId) return;

  const state = getState();
  const result = withdrawItem(state.inventory, state.bank, itemId, 1);
  if (!result) return;

  updateState({
    inventory: result.inventory,
    bank: result.bank,
  });
}

function handleDepositAll() {
  const state = getState();
  const result = depositAll(state.inventory, state.bank);

  updateState({
    inventory: result.inventory,
    bank: result.bank,
  });
}

// ═══════════════════════════════════════════════════════════
// Adventures
// ═══════════════════════════════════════════════════════════

function handleLocationClick(e) {
  const btn = e.target.closest(".btn-duration");
  if (!btn) return;

  const locationId = btn.dataset.location;
  const duration = parseInt(btn.dataset.duration, 10);
  const styleId = combatStyleSelect.value;

  const adventure = startAdventure(locationId, duration, styleId);

  updateState({
    adventure: { active: adventure, lastResult: null },
  });

  startAdventureTimer();
}

function startAdventureTimer() {
  stopAdventureTimer();

  const state = getState();
  if (!state.adventure.active) return;

  adventureTimerInterval = setInterval(() => {
    updateAdventureTimer(getState());
  }, 1000);
}

function stopAdventureTimer() {
  if (adventureTimerInterval) {
    clearInterval(adventureTimerInterval);
    adventureTimerInterval = null;
  }
}

/**
 * Collect loot from a completed adventure.
 * Simulates fights with equipment bonuses, food, and ammo consumption.
 */
function handleCollectLoot() {
  const state = getState();
  const adventure = state.adventure.active;
  if (!adventure || !isAdventureComplete(adventure)) return;

  stopAdventureTimer();

  const bonuses = getEquipmentBonuses(state.equipment);
  const foodItems = selectFoodForAdventure(state.inventory);

  // Pass inventory for ammo calculation and full state for potion boosts
  const result = completeAdventure(adventure, state.skills, bonuses, foodItems, state.inventory, state);
  if (!result) return;

  playHit();
  showAdventureResult(result);

  // Apply XP gains
  const skillUpdates = {};
  for (const [skill, amount] of Object.entries(result.totalXpGains)) {
    const current = state.skills[skill] ? state.skills[skill].xp : 0;
    skillUpdates[skill] = { xp: current + amount };
  }

  // Apply loot to inventory
  let newInventory = state.inventory;

  // Remove consumed food
  const foodConsumed = {};
  for (let i = 0; i < result.foodConsumed; i++) {
    const food = foodItems[i];
    foodConsumed[food.id] = (foodConsumed[food.id] || 0) + 1;
  }
  for (const [foodId, qty] of Object.entries(foodConsumed)) {
    const updated = removeItem(newInventory, foodId, qty);
    if (updated) newInventory = updated;
  }

  // Remove consumed ammo (runes + arrows)
  if (result.ammoConsumed) {
    for (const [runeId, qty] of Object.entries(result.ammoConsumed.runesUsed)) {
      if (qty > 0) {
        const updated = removeItem(newInventory, runeId, qty);
        if (updated) newInventory = updated;
      }
    }
    if (result.ammoConsumed.arrowsUsed > 0) {
      // Remove consumed arrows — best arrow type first (matches combat selection)
      let arrowsLeft = result.ammoConsumed.arrowsUsed;
      const arrowIds = ARROW_TYPES.map((a) => a.id).reverse(); // best first
      for (const arrowId of arrowIds) {
        if (arrowsLeft <= 0) break;
        const count = getItemCount(newInventory, arrowId);
        if (count > 0) {
          const toRemove = Math.min(arrowsLeft, count);
          const updated = removeItem(newInventory, arrowId, toRemove);
          if (updated) {
            newInventory = updated;
            arrowsLeft -= toRemove;
          }
        }
      }
    }
  }

  // Add item loot
  for (const drop of result.loot) {
    const updated = addItem(newInventory, drop.itemId, drop.qty);
    if (updated) newInventory = updated;
  }

  // Update quest progress
  const questUpdates = { ...state.quests };
  const locationId = adventure.locationId;

  for (const quest of Object.values(QUESTS)) {
    for (const obj of quest.objectives) {
      if (obj.type === "location_completed" && obj.target === locationId) {
        if (!questUpdates[quest.id]) questUpdates[quest.id] = {};
        questUpdates[quest.id] = {
          ...questUpdates[quest.id],
          [`loc_${locationId}`]: true,
        };
      }
    }
  }

  // Add to adventure log (keep last 20)
  const logEntry = {
    location: result.location,
    monstersKilled: result.monstersKilled,
    gpGained: result.gpGained || 0,
    time: Date.now(),
  };
  const newLog = [logEntry, ...state.adventureLog].slice(0, 20);

  const gpGained = result.gpGained || 0;

  // Merge locationKills from result
  const newLocationKills = { ...(state.stats.locationKills || {}), ...(result.locationKills || {}) };

  // Track boss kills
  const newBossKills = { ...(state.stats.bossKills || {}) };
  if (result.bossResult && result.bossResult.won) {
    const bossId = result.bossResult.boss;
    newBossKills[bossId] = (newBossKills[bossId] || 0) + 1;
  }

  updateState({
    player: { gp: state.player.gp + gpGained },
    skills: Object.keys(skillUpdates).length > 0 ? skillUpdates : undefined,
    inventory: newInventory,
    adventure: { active: null, lastResult: result },
    stats: {
      monstersKilled: state.stats.monstersKilled + result.monstersKilled,
      adventuresCompleted: state.stats.adventuresCompleted + 1,
      totalXpGained: state.stats.totalXpGained +
        Object.values(result.totalXpGains).reduce((sum, v) => sum + v, 0),
      totalGpEarned: (state.stats.totalGpEarned || 0) + gpGained,
      locationKills: newLocationKills,
      bossKills: newBossKills,
    },
    quests: questUpdates,
    adventureLog: newLog,
  });
  saveNow(); // Adventure complete is critical — persist immediately
}

function handleDismissResult() {
  hideAdventureResult();
  renderAll(getState());
}

function checkOfflineAdventure() {
  const state = getState();
  if (state.adventure.active && isAdventureComplete(state.adventure.active)) {
    switchTab("tab-adventures");
  }
}

// ═══════════════════════════════════════════════════════════
// Quests
// ═══════════════════════════════════════════════════════════

function handleQuestClick(e) {
  const btn = e.target.closest(".btn-claim");
  if (!btn) return;

  const questId = btn.dataset.quest;
  const quest = QUESTS[questId];
  if (!quest) return;

  const state = getState();
  const progress = checkQuestProgress(quest, state.stats, state.quests[questId] || {}, state);
  if (!progress.allDone) return;

  playQuestComplete();

  const gpGain = quest.rewards.gp || 0;

  const skillUpdates = {};
  if (quest.rewards.xp) {
    for (const [skill, amount] of Object.entries(quest.rewards.xp)) {
      const current = state.skills[skill] ? state.skills[skill].xp : 0;
      skillUpdates[skill] = { xp: current + withPetXpBonus(amount, skill) };
    }
  }

  if (quest.rewards.unlocks) {
    for (const skillId of quest.rewards.unlocks) {
      if (state.skills[skillId]) {
        skillUpdates[skillId] = {
          ...(skillUpdates[skillId] || {}),
          xp: skillUpdates[skillId]
            ? skillUpdates[skillId].xp
            : state.skills[skillId].xp,
          unlocked: true,
        };
      }
    }
  }

  let newInventory = state.inventory;
  if (quest.rewards.items) {
    for (const item of quest.rewards.items) {
      const updated = addItem(newInventory, item.itemId, item.qty);
      if (updated) newInventory = updated;
    }
  }

  const questUpdates = { ...state.quests };
  questUpdates[questId] = { ...(questUpdates[questId] || {}), completed: true };

  updateState({
    player: { gp: state.player.gp + gpGain },
    skills: Object.keys(skillUpdates).length > 0 ? skillUpdates : undefined,
    inventory: newInventory,
    quests: questUpdates,
    stats: {
      questsCompleted: state.stats.questsCompleted + 1,
      totalGpEarned: (state.stats.totalGpEarned || 0) + gpGain,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// Achievements — handled automatically but UI click = no-op
// ═══════════════════════════════════════════════════════════

function handleAchievementClick() {
  // Achievements auto-unlock; no manual claim needed
}

// ═══════════════════════════════════════════════════════════
// Pets — Select active pet
// ═══════════════════════════════════════════════════════════

function handlePetSelect(e) {
  const petEl = e.target.closest("[data-pet]");
  if (!petEl) return;

  const petId = petEl.dataset.pet;
  if (!petId) return;

  const state = getState();
  const currentActive = state.pets ? state.pets.active : null;

  // Toggle: clicking the active pet deactivates it
  if (currentActive === petId) {
    setActivePet(null);
  } else {
    setActivePet(petId);
  }
}

// ═══════════════════════════════════════════════════════════
// Save Export/Import
// ═══════════════════════════════════════════════════════════

function handleImportSave(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Reset input so same file can be re-selected
  e.target.value = "";

  if (!confirm("This will overwrite your current save. Continue?")) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = importSave(event.target.result);
    if (result.ok) {
      // Force full re-render
      renderAll(getState());
    } else {
      alert("Import failed: " + result.error);
    }
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════
// Mute Toggle
// ═══════════════════════════════════════════════════════════

function handleMuteToggle() {
  const state = getState();
  const newEnabled = !(state.settings?.soundEnabled !== false);
  setSoundEnabled(newEnabled);
  updateState({
    settings: { soundEnabled: newEnabled },
  });
  updateMuteButton(getState());
}

function updateMuteButton(state) {
  if (!btnMute) return;
  const enabled = state.settings?.soundEnabled !== false;
  btnMute.textContent = enabled ? "\u{1F50A}" : "\u{1F507}";
  btnMute.classList.toggle("muted", !enabled);
}

// ═══════════════════════════════════════════════════════════
// Prestige
// ═══════════════════════════════════════════════════════════

function handlePrestigeClick(e) {
  const btn = e.target.closest(".btn-prestige");
  if (!btn) return;

  const state = getState();
  if (!canPrestige(state)) return;

  const confirmMsg = [
    "PRESTIGE — Are you sure?",
    "",
    "You will LOSE:",
    "- All skill levels (reset to default)",
    "- Inventory (except starter ores)",
    "- Equipment",
    "- Quest progress",
    "- Active potions & adventure",
    "",
    "You will KEEP:",
    "- 50% of your GP",
    "- Bank (full)",
    "- Pets (full)",
    "- Achievements",
    "- Lore entries",
    "",
    "You will GAIN:",
    "- Permanent XP & GP bonuses",
    "- Prestige star rank",
  ].join("\n");

  if (!confirm(confirmMsg)) return;

  const prestigeUpdate = executePrestige(state);
  if (!prestigeUpdate) return;

  updateState(prestigeUpdate);
  saveNow(); // Prestige is irreversible — persist immediately
}

// (Tutorial and Info modal are wired by ui.js — no duplicate wiring needed here.
//  Tutorial dismiss fires "tutorial-dismissed" custom event, caught in boot().)

// ─── Flush on tab close / hide ───────────────────────────

// Save immediately when the tab is closed or navigated away.
// visibilitychange catches mobile background → foreground switches too.
window.addEventListener("beforeunload", () => saveNow());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveNow();
});

// ─── Start ───────────────────────────────────────────────

boot();
