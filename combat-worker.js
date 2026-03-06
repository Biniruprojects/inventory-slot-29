/**
 * Combat Worker — offloads simulateAdventure() from the main thread.
 *
 * Receives a message: { type: "simulate", payload: { skills, monsterPool, styleId, durationMinutes, bonuses, foodItems, inventory, boosts } }
 * Posts back:         { type: "result",   payload: { result } }
 *                  or { type: "error",    payload: { message } }
 *
 * Imports the combat module dynamically (ES module worker).
 */

import { simulateAdventure } from "./js/combat.js";
import { MONSTERS, BOSSES, BOSS_ENCOUNTER_THRESHOLD } from "./js/monsters.js";

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type !== "simulate") return;

  try {
    const {
      skills, monsterPool, bossPool, locationId, styleId,
      durationMinutes, bonuses, foodItems, inventory, boosts,
      prevLocationKills,
    } = payload;

    const result = simulateAdventure(
      skills, monsterPool, styleId, durationMinutes,
      bonuses, foodItems, inventory, boosts,
    );

    // Boss encounter check
    const newLocationKills = (prevLocationKills || 0) + result.monstersKilled;
    const prevThreshold = Math.floor((prevLocationKills || 0) / BOSS_ENCOUNTER_THRESHOLD);
    const newThreshold  = Math.floor(newLocationKills / BOSS_ENCOUNTER_THRESHOLD);

    let bossResult = null;
    if (bossPool && bossPool.length > 0 && newThreshold > prevThreshold) {
      const bossSimulation = simulateAdventure(
        skills, bossPool, styleId, 5,
        bonuses, foodItems, inventory, boosts,
      );
      bossResult = {
        boss: bossPool[0].name,
        won: bossSimulation.monstersKilled > 0,
        loot: bossSimulation.loot,
        gpGained: bossSimulation.gpGained,
      };
      if (bossResult.won) {
        result.loot = [...result.loot, ...bossResult.loot];
        result.gpGained += bossResult.gpGained;
      }
    }

    self.postMessage({
      type: "result",
      payload: { result, bossResult, newLocationKills },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      payload: { message: err.message },
    });
  }
};
