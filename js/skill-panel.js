/**
 * Skill Panel — Generic skill switcher for the Bank tab.
 *
 * Renders a row of skill-icon buttons and swaps the active skill panel.
 * All skills follow the same contract: ACTIONS/RECIPES, getAvailableActions, canExecute, execute.
 *
 * Processing skills (Alchemy, Smithing, Cooking): input → output, recipe selector.
 * Gathering skills (Mining, Fishing): no input, action selector, produces output.
 */

import { getLevel, levelProgress, xpForLevel } from "./xp.js";
import { ITEMS } from "./inventory.js";
import { formatNumber } from "./utils.js";
import * as Alchemy from "./alchemy.js";
import * as Smithing from "./smithing.js";
import * as Mining from "./mining.js";
import * as Fishing from "./fishing.js";
import * as Cooking from "./cooking.js";
import * as Woodcutting from "./woodcutting.js";
import * as Firemaking from "./firemaking.js";

// ─── Skill Definitions ──────────────────────────────────

const SKILL_DEFS = Object.freeze([
  Object.freeze({ id: "alchemy",      name: "Alchemy",      icon: "assets/skill_alchemy.svg",      type: "processing", module: Alchemy,      stateKey: "alchemy" }),
  Object.freeze({ id: "smithing",     name: "Smithing",     icon: "assets/skill_smithing.svg",     type: "processing", module: Smithing,     stateKey: "smithing" }),
  Object.freeze({ id: "mining",       name: "Mining",       icon: "assets/skill_mining.svg",       type: "gathering",  module: Mining,       stateKey: "mining" }),
  Object.freeze({ id: "fishing",      name: "Fishing",      icon: "assets/skill_fishing.svg",      type: "gathering",  module: Fishing,      stateKey: "fishing" }),
  Object.freeze({ id: "cooking",      name: "Cooking",      icon: "assets/skill_cooking.svg",      type: "processing", module: Cooking,      stateKey: "cooking" }),
  Object.freeze({ id: "woodcutting",  name: "Woodcutting",  icon: "assets/skill_woodcutting.svg",  type: "gathering",  module: Woodcutting,  stateKey: "woodcutting" }),
  Object.freeze({ id: "firemaking",   name: "Firemaking",   icon: "assets/skill_firemaking.svg",   type: "processing", module: Firemaking,   stateKey: "firemaking" }),
]);

/** Currently active skill panel ID. */
let activeSkillId = "alchemy";

/** Currently selected action/recipe ID within the active skill. */
let selectedActionId = null;

/** Auto-skill active flag. */
let autoActive = false;

// ─── DOM References (set during init) ────────────────────

let skillSelectorEl = null;
let skillPanelBodyEl = null;

// ─── Public API ──────────────────────────────────────────

/**
 * Initialize the skill panel. Must be called once after DOM is ready.
 * @param {HTMLElement} selectorContainer - Container for skill buttons.
 * @param {HTMLElement} panelBody - Container for the active skill content.
 */
export function initSkillPanel(selectorContainer, panelBody) {
  skillSelectorEl = selectorContainer;
  skillPanelBodyEl = panelBody;

  let html = "";
  for (const def of SKILL_DEFS) {
    html += `<button class="sp-skill-btn${def.id === activeSkillId ? " active" : ""}" data-skill="${def.id}">` +
      `<img src="${def.icon}" alt="" class="sp-skill-icon">` +
      `<span>${def.name}</span></button>`;
  }
  skillSelectorEl.innerHTML = html;

  skillSelectorEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".sp-skill-btn");
    if (!btn) return;
    switchSkill(btn.dataset.skill);
  });
}

export function getActiveSkillId() {
  return activeSkillId;
}

export function getSelectedActionId() {
  return selectedActionId;
}

export function getActiveSkillDef() {
  return SKILL_DEFS.find((d) => d.id === activeSkillId);
}

export function isAutoActive() {
  return autoActive;
}

export function stopAuto() {
  autoActive = false;
}

export function startAuto() {
  autoActive = true;
}

/**
 * Render the skill panel body for the active skill.
 * @param {object} state - Full game state.
 */
export function renderSkillPanel(state) {
  const def = SKILL_DEFS.find((d) => d.id === activeSkillId);
  if (!def || !skillPanelBodyEl) return;

  const skillXp = state.skills[def.stateKey].xp;
  const level = getLevel(skillXp);
  const progress = levelProgress(skillXp);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = level < 99 ? xpForLevel(level + 1) : skillXp;

  if (def.id === "alchemy") {
    skillPanelBodyEl.hidden = true;
    return;
  }

  skillPanelBodyEl.hidden = false;

  const actions = def.module.getAvailableActions(skillXp);
  const isGathering = def.type === "gathering";

  if (!selectedActionId || !actions.find((a) => a.id === selectedActionId)) {
    selectedActionId = actions.length > 0 ? actions[0].id : null;
  }

  let html = "";

  html += `<div class="skill-header">`;
  html += `<span class="skill-icon"><img src="${def.icon}" alt="${def.name}"></span>`;
  html += `<span class="skill-name">${def.name.toUpperCase()}</span>`;
  html += `<span class="skill-level">Lvl ${level}</span>`;
  html += `</div>`;

  html += `<div class="xp-bar-container">`;
  html += `<div class="xp-bar" style="width: ${(progress * 100).toFixed(1)}%"></div>`;
  if (level >= 99) {
    html += `<span class="xp-text">${formatNumber(skillXp)} XP (MAX)</span>`;
  } else {
    html += `<span class="xp-text">${formatNumber(skillXp - currentThreshold)} / ${formatNumber(nextThreshold - currentThreshold)} XP</span>`;
  }
  html += `</div>`;

  html += `<div class="recipe-selector">`;
  html += `<label class="recipe-label">${isGathering ? "Location:" : "Recipe:"}</label>`;
  html += `<select class="sp-action-select" id="sp-action-select">`;
  for (const action of actions) {
    const selected = action.id === selectedActionId ? " selected" : "";
    html += `<option value="${action.id}"${selected}>${action.label}</option>`;
  }
  html += `</select></div>`;

  if (!isGathering && selectedActionId) {
    const action = actions.find((a) => a.id === selectedActionId);
    if (action) {
      // Multi-input recipes (alchemy steel/mithril) vs single-input
      if (action.inputs) {
        html += `<div class="recipe-preview">`;
        for (let i = 0; i < action.inputs.length; i++) {
          const inp = action.inputs[i];
          const inputItem = ITEMS[inp.itemId];
          if (inputItem) {
            if (i > 0) html += ` + `;
            const qtyLabel = inp.qty > 1 ? `${inp.qty}× ` : "";
            html += `<img src="${inputItem.icon}" alt="${inputItem.name}"> ${qtyLabel}${inputItem.name}`;
          }
        }
        const outputItem = ITEMS[action.output];
        if (outputItem) {
          html += ` → <img src="${outputItem.icon}" alt="${outputItem.name}"> ${outputItem.name} `;
          html += `<span class="recipe-xp">+${action.xp} XP</span>`;
        }
        html += `</div>`;
      } else if (action.input && action.output) {
        const inputItem = ITEMS[action.input];
        const outputItem = ITEMS[action.output];
        if (inputItem && outputItem) {
          html += `<div class="recipe-preview">`;
          const qtyLabel = action.inputQty && action.inputQty > 1 ? `${action.inputQty}× ` : "";
          html += `<img src="${inputItem.icon}" alt="${inputItem.name}"> ${qtyLabel}${inputItem.name} → `;
          const outQtyLabel = action.outputQty && action.outputQty > 1 ? `${action.outputQty}× ` : "";
          html += `<img src="${outputItem.icon}" alt="${outputItem.name}"> ${outQtyLabel}${outputItem.name} `;
          html += `<span class="recipe-xp">+${action.xp} XP</span>`;
          html += `</div>`;
        }
      } else if (action.input && !action.output) {
        // Consume-only recipe (e.g. Firemaking: burns a log for XP, no output item)
        const inputItem = ITEMS[action.input];
        if (inputItem) {
          html += `<div class="recipe-preview">`;
          html += `<img src="${inputItem.icon}" alt="${inputItem.name}"> ${inputItem.name} `;
          html += `<span class="recipe-xp">+${action.xp} XP</span>`;
          html += `</div>`;
        }
      }
    }
  } else if (isGathering && selectedActionId) {
    const action = actions.find((a) => a.id === selectedActionId);
    if (action) {
      const outputItem = ITEMS[action.output];
      if (outputItem) {
        const tickLabel = (action.tickMs / 1000).toFixed(1) + "s";
        html += `<div class="recipe-preview">`;
        html += `<img src="${outputItem.icon}" alt="${outputItem.name}"> ${outputItem.name} `;
        html += `<span class="recipe-xp">+${action.xp} XP</span> `;
        html += `<span class="sp-tick">(${tickLabel})</span>`;
        html += `</div>`;
      }
    }
  }

  // Gather progress bar (only for gathering skills when auto is active)
  if (isGathering) {
    html += `<div class="gather-progress-wrap" id="gather-progress-wrap">`;
    html += `<div class="gather-progress-bar" id="gather-progress-bar" style="width:0%"></div>`;
    html += `</div>`;
  }

  html += `<div class="action-buttons">`;
  const actionLabels = { smithing: "SMITH", cooking: "COOK", firemaking: "BURN" };
  const actionLabel = isGathering ? "GATHER" : (actionLabels[def.id] || "CRAFT");
  html += `<button class="btn-smelt" id="sp-btn-execute">${actionLabel}</button>`;
  html += `<button class="btn-auto${autoActive ? " active" : ""}" id="sp-btn-auto">AUTO</button>`;
  html += `</div>`;

  skillPanelBodyEl.innerHTML = html;
}

/**
 * Wire events for the dynamically rendered skill panel.
 * @param {function} onExecute
 * @param {function} onAutoToggle
 */
export function wireSkillPanelEvents(onExecute, onAutoToggle) {
  const selectEl = skillPanelBodyEl.querySelector("#sp-action-select");
  const btnExecute = skillPanelBodyEl.querySelector("#sp-btn-execute");
  const btnAuto = skillPanelBodyEl.querySelector("#sp-btn-auto");

  if (selectEl) {
    selectEl.addEventListener("change", () => {
      selectedActionId = selectEl.value;
      stopAuto();
    });
  }
  if (btnExecute) {
    btnExecute.addEventListener("click", onExecute);
  }
  if (btnAuto) {
    btnAuto.addEventListener("click", onAutoToggle);
  }
}

// ─── Private ─────────────────────────────────────────────

function switchSkill(skillId) {
  if (skillId === activeSkillId) return;
  stopAuto();
  activeSkillId = skillId;
  selectedActionId = null;

  for (const btn of skillSelectorEl.querySelectorAll(".sp-skill-btn")) {
    btn.classList.toggle("active", btn.dataset.skill === skillId);
  }

  const originalPanel = document.getElementById("skill-panel");
  if (originalPanel) {
    originalPanel.style.display = skillId === "alchemy" ? "" : "none";
  }
}

/**
 * Update the gather progress bar — called on each tick from the timer.
 * @param {number} elapsed   - ms elapsed since tick started
 * @param {number} tickMs    - total tick duration in ms
 */
export function updateGatherProgress(elapsed, tickMs) {
  const bar = document.getElementById("gather-progress-bar");
  if (!bar) return;
  const pct = Math.min(100, (elapsed / tickMs) * 100);
  bar.style.width = pct + "%";
}

/**
 * Reset the gather progress bar to 0.
 */
export function resetGatherProgress() {
  const bar = document.getElementById("gather-progress-bar");
  if (bar) bar.style.width = "0%";
}
