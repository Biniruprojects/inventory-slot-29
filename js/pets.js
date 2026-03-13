/**
 * Pets — Rare drops from adventures and skilling.
 *
 * Pets are NOT inventory items. They live in state.pets.owned (array of IDs).
 * Only one pet can be active at a time, providing a passive bonus.
 *
 * Drop rates are intentionally low — pets are prestige rewards.
 */

import { getState, updateState } from "./state.js";

/**
 * Pet definitions — each has a source location/skill, drop rate, and bonus.
 */
export const PETS = Object.freeze({
  rock_crab_pet: Object.freeze({
    id: "rock_crab_pet",
    name: "Rock Crab",
    from: "muddy_crossroad",
    dropRate: 1 / 500,
    bonus: Object.freeze({ type: "xp_all", amount: 0.02 }),
    icon: "assets/pet_rock_crab.svg",
  }),
  shadow_cat_pet: Object.freeze({
    id: "shadow_cat_pet",
    name: "Shadow Cat",
    from: "ashen_caves",
    dropRate: 1 / 1000,
    bonus: Object.freeze({ type: "gp", amount: 0.05 }),
    icon: "assets/pet_shadow_cat.svg",
  }),
  baby_dragon_pet: Object.freeze({
    id: "baby_dragon_pet",
    name: "Baby Dragon",
    from: "shadow_fortress",
    dropRate: 1 / 2000,
    bonus: Object.freeze({ type: "xp_combat", amount: 0.03 }),
    icon: "assets/pet_baby_dragon.svg",
  }),
  fire_beetle_pet: Object.freeze({
    id: "fire_beetle_pet",
    name: "Fire Beetle",
    from: "firemaking",
    dropRate: 1 / 750,
    bonus: Object.freeze({ type: "xp_firemaking", amount: 0.10 }),
    icon: "assets/pet_fire_beetle.svg",
  }),
});

/**
 * Roll for a pet drop from a given location or skill.
 * Checks all pets whose `from` matches the locationId.
 *
 * @param {string} locationId - The adventure location ID or skill ID.
 * @returns {string|null} Pet ID if a pet was obtained, null otherwise.
 */
export function rollForPet(locationId) {
  const state = getState();
  const owned = state.pets ? state.pets.owned : [];

  for (const [petId, pet] of Object.entries(PETS)) {
    if (pet.from !== locationId) continue;

    // Already owned — no duplicate drops
    if (owned.includes(petId)) continue;

    // RNG roll
    if (Math.random() < pet.dropRate) {
      return petId;
    }
  }

  return null;
}

/**
 * Add a pet to the player's owned collection.
 * Does nothing if the pet is already owned (no duplicates).
 *
 * @param {string} petId - The pet ID to add.
 * @returns {boolean} True if the pet was added, false if already owned or invalid.
 */
export function addPet(petId) {
  const pet = PETS[petId];
  if (!pet) return false;

  const state = getState();
  const owned = state.pets ? [...state.pets.owned] : [];
  const active = state.pets ? state.pets.active : null;

  // No duplicates
  if (owned.includes(petId)) return false;

  owned.push(petId);

  updateState({
    pets: { owned, active },
  });

  return true;
}

/**
 * Set the active pet. Only one pet can be active at a time.
 * Pass null to deactivate the current pet.
 *
 * @param {string|null} petId - Pet ID to activate, or null to deactivate.
 * @returns {boolean} True if successful, false if pet not owned or invalid.
 */
export function setActivePet(petId) {
  const state = getState();
  const owned = state.pets ? state.pets.owned : [];

  // Allow deactivation
  if (petId === null) {
    updateState({
      pets: { owned, active: null },
    });
    return true;
  }

  // Must be a valid, owned pet
  if (!PETS[petId] || !owned.includes(petId)) return false;

  updateState({
    pets: { owned, active: petId },
  });

  return true;
}

/**
 * Get the active pet's definition.
 * @param {object} state - Current game state.
 * @returns {object|null} Pet definition or null if no pet is active.
 */
export function getActivePet(state) {
  const active = state.pets ? state.pets.active : null;
  if (!active) return null;
  return PETS[active] || null;
}

/**
 * Get the active pet's bonus.
 * @param {object} state - Current game state.
 * @returns {{ type: string, amount: number }|null} Bonus or null.
 */
export function getActivePetBonus(state) {
  const pet = getActivePet(state);
  if (!pet) return null;
  return pet.bonus;
}

/**
 * Get all owned pet definitions.
 * @param {object} state - Current game state.
 * @returns {Array} Array of pet definitions.
 */
export function getOwnedPets(state) {
  const owned = state.pets ? state.pets.owned : [];
  return owned.map((id) => PETS[id]).filter(Boolean);
}

// ─── Pet Bonus Application ──────────────────────────────

const COMBAT_SKILLS = Object.freeze([
  "attack", "strength", "defence", "hitpoints", "magic", "ranged",
]);

/**
 * Apply pet bonus to an XP gain for a specific skill.
 * Returns the XP amount with the bonus added (floor-rounded).
 *
 * Prefer withPetXpBonus() for callers that don't already have the bonus object.
 *
 * @param {number} xp - Base XP amount.
 * @param {string} skill - Skill name (e.g. "attack", "firemaking").
 * @param {{ type: string, amount: number }|null} bonus - Active pet bonus.
 * @returns {number} Modified XP amount.
 */
export function applyPetXpBonus(xp, skill, bonus) {
  if (!bonus || xp <= 0) return xp;

  switch (bonus.type) {
    case "xp_all":
      return xp + Math.max(1, Math.floor(xp * bonus.amount));
    case "xp_combat":
      return COMBAT_SKILLS.includes(skill)
        ? xp + Math.max(1, Math.floor(xp * bonus.amount))
        : xp;
    case "xp_firemaking":
      return skill === "firemaking"
        ? xp + Math.max(1, Math.floor(xp * bonus.amount))
        : xp;
    default:
      return xp;
  }
}

/**
 * Apply the active pet's XP bonus to a base XP amount, reading state internally.
 * This is the single authoritative function for pet-adjusted XP.
 * All code paths that grant skill XP must go through this.
 *
 * @param {number} xp - Base XP amount.
 * @param {string} skill - Skill name (e.g. "mining", "firemaking").
 * @returns {number} XP with pet bonus applied (or unchanged if no active pet).
 */
export function withPetXpBonus(xp, skill) {
  return applyPetXpBonus(xp, skill, getActivePetBonus(getState()));
}

/**
 * Apply pet bonus to a GP gain (Shadow Cat bonus).
 *
 * @param {number} gp - Base GP amount.
 * @param {{ type: string, amount: number }|null} bonus - Active pet bonus.
 * @returns {number} Modified GP amount.
 */
export function applyPetGpBonus(gp, bonus) {
  if (!bonus || bonus.type !== "gp" || gp <= 0) return gp;
  return gp + Math.max(1, Math.floor(gp * bonus.amount));
}
