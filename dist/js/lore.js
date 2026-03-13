/**
 * Lore Book — Progressive history entries unlocked by gameplay milestones.
 *
 * Generic architecture: only LORE_ENTRIES changes per game variant.
 * The unlock logic, progress tracking, and milestone types are reusable
 * across IS29 (RuneScape history), D&D variant, Goa/Shpongle variant, etc.
 *
 * Milestone types:
 * - totalLevel    : sum of all skill levels
 * - skillLevel    : specific skill at a given level
 * - questComplete : specific quest completed
 * - monstersKilled: total monsters killed (stats.monstersKilled)
 * - combatLevel   : combat level reached
 * - adventuresComplete: total adventures completed (stats.adventuresCompleted)
 */

import { getLevel } from "./xp.js";
import { getCombatLevel } from "./adventures.js";

// ─── Eras (visual grouping) ──────────────────────────────

export const ERAS = Object.freeze([
  Object.freeze({ id: "origins", label: "Origins" }),
  Object.freeze({ id: "classic", label: "Classic Era" }),
  Object.freeze({ id: "rs2",     label: "RuneScape 2" }),
  Object.freeze({ id: "hd",      label: "HD Era" }),
  Object.freeze({ id: "eoc",     label: "Evolution" }),
  Object.freeze({ id: "osrs",    label: "Old School" }),
  Object.freeze({ id: "modern",  label: "Modern Era" }),
  Object.freeze({ id: "meta",    label: "Meta" }),
]);

// ─── Lore Entries ────────────────────────────────────────

export const LORE_ENTRIES = Object.freeze([
  // ─── Origins ──────────────────────────────────────────
  Object.freeze({
    id: "the_first_steps",
    era: "origins",
    title: "The First Steps",
    year: "",
    text: "Before there were kingdoms or quests, there was only the void. Then something stirred \u2014 a single consciousness, fumbling through darkness, learning to walk before it could run. The world wasn't created in a grand explosion. It was compiled, one line at a time, by hands that didn't yet know what they were building. Every great journey starts the same way: confused and underdressed.",
    milestone: Object.freeze({ type: "totalLevel", value: 10 }),
  }),
  Object.freeze({
    id: "devious_mud",
    era: "origins",
    title: "DeviousMUD",
    year: "1998",
    text: "In 1998, a teenager named Andrew Gower wrote a text-based multiplayer game called DeviousMUD from his parents' house in Nottingham. Built in Java, it featured a medieval fantasy world where players could fight monsters, train skills, and trade items. It was rough, experimental, and never officially released \u2014 but the ideas that powered it would change online gaming forever.",
    milestone: Object.freeze({ type: "totalLevel", value: 15 }),
  }),
  Object.freeze({
    id: "the_first_rune",
    era: "origins",
    title: "The First Rune",
    year: "",
    text: "Deep in the mines, a miner's pickaxe struck something that wasn't rock. A symbol, ancient and glowing, carved into the stone itself. When they traced its outline, the wall exploded outward in a shower of light and dust. The miner survived, barely. The rune did not survive at all \u2014 it shattered into pure energy that seeped into the earth. They say every ore vein still hums with that first accidental magic.",
    milestone: Object.freeze({ type: "skillLevel", value: 15, skill: "mining" }),
  }),
  Object.freeze({
    id: "rs_classic",
    era: "origins",
    title: "RuneScape Classic",
    year: "2001",
    text: "On January 4, 2001, Andrew and his brother Paul launched RuneScape from their parents' kitchen. It ran in a web browser \u2014 no download needed. Within months, hundreds of thousands of players were exploring Gielinor, training skills, and dying in the Wilderness. It was ugly, slow, and utterly magical. The game proved that you didn't need a massive budget to create a world people wanted to live in.",
    milestone: Object.freeze({ type: "totalLevel", value: 25 }),
  }),

  // ─── Classic Era ──────────────────────────────────────
  Object.freeze({
    id: "the_age_of_roaches",
    era: "classic",
    title: "The Age of Roaches",
    year: "",
    text: "Before the great wars, before the dragon hunts, there was a humbler enemy. Giant roaches. They infested every crossroad, every cave entrance, every abandoned building. New adventurers cut their teeth on these chitinous nightmares, learning the rhythm of combat: click, wait, click again. Veterans look back on the Age of Roaches with a mix of nostalgia and disgust. Mostly disgust.",
    milestone: Object.freeze({ type: "combatLevel", value: 10 }),
  }),
  Object.freeze({
    id: "jagex_founded",
    era: "classic",
    title: "Jagex Founded",
    year: "2001",
    text: "To support their growing game, the Gower brothers founded Jagex \u2014 \"Just About the Game Experience.\" The name reflected their philosophy: gameplay first, everything else second. No pay-to-win, no corporate interference. From a small office in Cambridge, they built one of the most passionate gaming communities in history.",
    milestone: Object.freeze({ type: "totalLevel", value: 50 }),
  }),
  Object.freeze({
    id: "the_great_smelting",
    era: "classic",
    title: "The Great Smelting",
    year: "",
    text: "When someone discovered that two ores could become one bar, it changed everything. The furnaces burned day and night. Smoke choked the sky above every town. Economists called it an industrial revolution. Environmentalists called it a disaster. The smelters called it Tuesday. Within a generation, bronze gave way to iron, iron to steel, and the old ways were forgotten \u2014 along with everyone's lungs.",
    milestone: Object.freeze({ type: "totalLevel", value: 50 }),
  }),
  Object.freeze({
    id: "tales_from_the_dock",
    era: "classic",
    title: "Tales from the Dock",
    year: "",
    text: "Fishermen are liars. This is a universal truth that transcends all worlds. At the docks, old men claimed to have caught fish the size of wagons. They spoke of the Great Lobster that could only be hooked during a lunar eclipse, and of the Trout of Destiny that granted wishes. None of these stories were true. But the fish were real, the XP was real, and sometimes that's all that matters.",
    milestone: Object.freeze({ type: "skillLevel", value: 20, skill: "fishing" }),
  }),
  Object.freeze({
    id: "economy",
    era: "classic",
    title: "A Real Economy",
    year: "2002",
    text: "RuneScape accidentally created one of the most realistic virtual economies ever seen. Items had real supply and demand. Players became merchants, flipping items for profit. Some became virtual millionaires. Economists would later study it as a model for understanding real-world markets. The famous \"party hat\" items \u2014 given away free during a 2001 Christmas event \u2014 would eventually become worth billions of in-game gold.",
    milestone: Object.freeze({ type: "skillLevel", value: 20, skill: "mining" }),
  }),
  Object.freeze({
    id: "blood_and_iron",
    era: "classic",
    title: "Blood and Iron",
    year: "",
    text: "Every adventurer remembers their first real fight. Not the tutorial, not the training dummy \u2014 the first time something hit back and meant it. Your heart pounds. Your hands shake. The monster falls, and you stand there, breathing hard, inventory full of worthless drops. But something has changed. You are no longer a bystander in this world. You are a participant.",
    milestone: Object.freeze({ type: "questComplete", quest: "first_blood" }),
  }),

  // ─── RuneScape 2 ──────────────────────────────────────
  Object.freeze({
    id: "the_first_lunar_spell",
    era: "rs2",
    title: "The First Lunar Spell",
    year: "",
    text: "The wizards claimed they could reach the moon. Everyone laughed. Then one night, a beam of silver light shot from the top of the mage tower and didn't come back down. The next morning, the head wizard was found on the roof, grinning ear to ear, holding a rock that glowed faintly blue. \"I didn't reach the moon,\" he admitted. \"But the moon reached back.\" The Lunar spellbook was born.",
    milestone: Object.freeze({ type: "totalLevel", value: 100 }),
  }),
  Object.freeze({
    id: "rs2_launch",
    era: "rs2",
    title: "RuneScape 2",
    year: "2004",
    text: "On March 29, 2004, Jagex released RuneScape 2 \u2014 a complete engine rewrite with 3D graphics, a new combat system, and a redesigned world. It was controversial. Classic players mourned the old version. But RS2 attracted millions of new players and cemented RuneScape as one of the biggest MMOs in the world, peaking at over 200 million accounts.",
    milestone: Object.freeze({ type: "totalLevel", value: 120 }),
  }),
  Object.freeze({
    id: "the_monster_census",
    era: "rs2",
    title: "The Monster Census",
    year: "",
    text: "One day, a bureaucrat decided to count every monster in the realm. He was found three months later in the Ashen Caves, surrounded by tally marks scratched into the walls. His final count: 14,726 roaches, 8,432 thugs, 2,891 lurkers, and one very confused dragon that kept moving between rooms. The census was deemed \"inconclusive\" and never repeated. The bureaucrat became an adventurer. He said it was less stressful.",
    milestone: Object.freeze({ type: "monstersKilled", value: 100 }),
  }),
  Object.freeze({
    id: "quests_storytelling",
    era: "rs2",
    title: "Quests as Storytelling",
    year: "2005",
    text: "While other MMOs gave you \"kill 10 boars\" quests, RuneScape told stories. One Small Favour was an absurd chain of escalating requests. Monkey Madness turned you into a primate. Underground Pass was genuinely terrifying. Each quest was hand-crafted, often hilarious, and always memorable. RuneScape proved that quests could be the best part of an MMO.",
    milestone: Object.freeze({ type: "questComplete", quest: "dragon_slayer" }),
  }),
  Object.freeze({
    id: "grand_exchange",
    era: "rs2",
    title: "The Grand Exchange",
    year: "2007",
    text: "On November 26, 2007, the Grand Exchange opened in Varrock \u2014 an automated trading post where players could set buy and sell orders. It replaced hours of standing in Falador Park shouting \"Selling lobbies 200 ea!\" The GE made trading efficient but killed something beautiful: the chaos of player-to-player commerce. It remains one of the most debated additions in the game's history.",
    milestone: Object.freeze({ type: "skillLevel", value: 30, skill: "smithing" }),
  }),

  // ─── HD Era ───────────────────────────────────────────
  Object.freeze({
    id: "the_fall_of_old_town",
    era: "hd",
    title: "The Fall of Old Town",
    year: "",
    text: "Old Town Square was once the beating heart of civilization. Then the bankstanders arrived. They stood there for hours. Days. Weeks. They didn't fight, didn't trade, didn't quest. They just... stood. And chatted. The merchants left. The guards gave up. The square became a monument to the strange human need to exist in a space without actually doing anything in it. Some say Old Town never fell. It just got very, very still.",
    milestone: Object.freeze({ type: "combatLevel", value: 20 }),
  }),
  Object.freeze({
    id: "hd_update",
    era: "hd",
    title: "The HD Update",
    year: "2008",
    text: "In July 2008, RuneScape received a massive graphical overhaul. The blocky, beloved world suddenly looked... modern. Textures were sharper, lighting was dynamic, water actually looked like water. Some loved it. Others felt the charm was lost. It was the first sign that RuneScape's community would always be deeply split between those who wanted progress and those who wanted to preserve what they loved.",
    milestone: Object.freeze({ type: "totalLevel", value: 200 }),
  }),
  Object.freeze({
    id: "deep_rock_discoveries",
    era: "hd",
    title: "Deep Rock Discoveries",
    year: "",
    text: "The deeper you mine, the stranger things get. Past the iron veins, past the coal seams, past the mithril deposits that hum with quiet energy. Down there, in the places where no light reaches, miners found things that shouldn't exist. Crystals that sang. Stones that remembered. Ores that seemed to grow back overnight, as if the mountain itself was alive and generous. Or hungry. Nobody could agree on which.",
    milestone: Object.freeze({ type: "skillLevel", value: 30, skill: "mining" }),
  }),
  Object.freeze({
    id: "dungeoneering",
    era: "hd",
    title: "Dungeoneering",
    year: "2010",
    text: "Was it a skill or a minigame? Dungeoneering asked players to descend through randomly generated floors of a massive dungeon, fighting bosses and solving puzzles. It gave some of the game's best rewards (the chaotic weapons) but the debate raged for years. The community never quite agreed on what Dungeoneering was \u2014 but they kept playing it anyway.",
    milestone: Object.freeze({ type: "combatLevel", value: 30 }),
  }),

  // ─── Evolution ────────────────────────────────────────
  Object.freeze({
    id: "the_great_disconnection",
    era: "eoc",
    title: "The Great Disconnection",
    year: "",
    text: "It came without warning. One moment the world was alive with commerce and combat; the next, silence. The Great Disconnection lasted only minutes in real time, but in the realm, it felt like an age. Players froze mid-swing. Trades hung in limbo. When the world came back online, nothing was quite where it had been. Some called it a server crash. The lore masters called it the Plague of Lag. The veterans just called it \"Tuesday afternoon.\"",
    milestone: Object.freeze({ type: "totalLevel", value: 200 }),
  }),
  Object.freeze({
    id: "eoc",
    era: "eoc",
    title: "Evolution of Combat",
    year: "2012",
    text: "On November 20, 2012, Jagex released the Evolution of Combat \u2014 replacing the simple click-and-wait system with abilities, action bars, and cooldowns. It was designed to modernize RS for a new generation. Instead, it split the community in half. Veterans felt betrayed. The backlash was so severe that it led directly to the most important vote in RuneScape history.",
    milestone: Object.freeze({ type: "totalLevel", value: 300 }),
  }),
  Object.freeze({
    id: "the_dragon_myth",
    era: "eoc",
    title: "The Dragon Myth",
    year: "",
    text: "Were they really dragons? The scholars debated endlessly. The creatures in Dragon's Hollow breathed fire, had scales, and could fly \u2014 but they were small, almost cute, and seemed more confused than aggressive. \"Young dragons,\" the adventurers called them. \"Overgrown lizards,\" the scholars countered. The debate ended when one ate a scholar. \"Definitely dragons,\" the surviving scholars agreed.",
    milestone: Object.freeze({ type: "questComplete", quest: "dragon_slayer" }),
  }),

  // ─── Old School ───────────────────────────────────────
  Object.freeze({
    id: "osrs_launch",
    era: "osrs",
    title: "Old School RuneScape",
    year: "2013",
    text: "In February 2013, Jagex held a poll: would players pay to bring back the 2007 version of RuneScape? Over 500,000 people voted yes. On February 22, Old School RuneScape launched \u2014 a preserved snapshot of the game as it was in August 2007. What started as a nostalgia trip became a thriving game in its own right, eventually surpassing the main game in player count.",
    milestone: Object.freeze({ type: "totalLevel", value: 400 }),
  }),
  Object.freeze({
    id: "the_cold_spell_war",
    era: "osrs",
    title: "The Cold Spell War",
    year: "",
    text: "The mages of the East Tower and the mages of the West Tower didn't fight with swords. They fought with passive aggression. Competing spell research. Mutually exclusive rune suppliers. Carefully worded insults disguised as academic papers. For decades, the two towers refused to share discoveries, each convinced the other was developing a weapon of mass teleportation. Neither was. They were both just making slightly better fire spells.",
    milestone: Object.freeze({ type: "combatLevel", value: 40 }),
  }),
  Object.freeze({
    id: "a_veterans_journal",
    era: "osrs",
    title: "A Veteran's Journal",
    year: "",
    text: "\"Day 1: Killed a roach. Day 50: Still killing roaches, but bigger ones now. Day 200: I have seen things. The depths of caves that echo with forgotten names. The heat of dragon fire on my shield. I have lost friends to the Wilderness and found new ones at the furnace. Day 500: They ask why I keep going. I don't know how to stop. The adventure is not something I do. It's something I am.\"",
    milestone: Object.freeze({ type: "adventuresComplete", value: 50 }),
  }),
  Object.freeze({
    id: "mobile_launch",
    era: "osrs",
    title: "Mobile Launch",
    year: "2018",
    text: "On October 30, 2018, Old School RuneScape launched on mobile devices. The full game \u2014 not a simplified version, the actual game \u2014 running on phones and tablets. It topped the App Store charts immediately. Players could now AFK woodcutting on the bus, fish during lunch breaks, and do Slayer tasks in bed. RuneScape was everywhere.",
    milestone: Object.freeze({ type: "totalLevel", value: 500 }),
  }),

  // ─── Modern Era ───────────────────────────────────────
  Object.freeze({
    id: "the_age_of_prestige",
    era: "modern",
    title: "The Age of Prestige",
    year: "",
    text: "When the strongest warriors had conquered every dungeon and the wisest mages had learned every spell, a question arose: what next? The answer came from an unlikely source \u2014 a retired adventurer who voluntarily gave up everything and started over. \"The journey,\" she said, \"was always the point.\" Others followed. They called it Prestige. It was madness. It was brilliant. It was the only way to keep the flame alive.",
    milestone: Object.freeze({ type: "totalLevel", value: 400 }),
  }),
  Object.freeze({
    id: "twenty_years",
    era: "modern",
    title: "20+ Years Later",
    year: "2024",
    text: "More than two decades after launch, RuneScape still lives. OSRS receives weekly updates voted on by players. RS3 continues to evolve with new quests and skills. The Gower brothers have moved on, but their creation endures. Few games survive five years. RuneScape has survived twenty, driven by a community that refuses to let it die.",
    milestone: Object.freeze({ type: "totalLevel", value: 750 }),
  }),

  // ─── Meta ─────────────────────────────────────────────
  Object.freeze({
    id: "the_community",
    era: "meta",
    title: "The Community",
    year: "",
    text: "What makes RuneScape special isn't the graphics, the combat, or even the quests. It's the people. The merchants who built empires from nothing. The pures who pushed the combat system to its limits. The skillers who spent years reaching 99 in every skill. The friends who met in-game and stayed friends for decades. RuneScape's greatest achievement was never technical \u2014 it was creating a world where millions of strangers became a community.",
    milestone: Object.freeze({ type: "totalLevel", value: 1000 }),
  }),
]);

// ─── Milestone Evaluation ────────────────────────────────

/**
 * Calculate the total level (sum of all skill levels).
 * @param {object} skills - Player skills from state.
 * @returns {number}
 */
function getTotalLevel(skills) {
  let total = 0;
  for (const data of Object.values(skills)) {
    if (data && typeof data.xp === "number" && data.unlocked !== false) {
      total += getLevel(data.xp);
    }
  }
  return total;
}

/**
 * Check if a single milestone is met.
 * @param {object} milestone - The milestone definition.
 * @param {object} state - Full game state.
 * @returns {boolean}
 */
function isMilestoneMet(milestone, state) {
  switch (milestone.type) {
    case "totalLevel":
      return getTotalLevel(state.skills) >= milestone.value;

    case "skillLevel": {
      const skill = state.skills[milestone.skill];
      if (!skill || skill.unlocked === false) return false;
      return getLevel(skill.xp) >= milestone.value;
    }

    case "combatLevel":
      return getCombatLevel(state.skills) >= milestone.value;

    case "questComplete":
      return !!(state.quests[milestone.quest] && state.quests[milestone.quest].completed);

    case "monstersKilled":
      return (state.stats.monstersKilled || 0) >= milestone.value;

    case "adventuresComplete":
      return (state.stats.adventuresCompleted || 0) >= milestone.value;

    default:
      return false;
  }
}

// ─── Public API ──────────────────────────────────────────

/**
 * Check all lore entries against current state, return newly unlocked IDs.
 * @param {object} state - Full game state (must include unlockedLore array).
 * @returns {string[]} Array of newly unlocked entry IDs (empty if none).
 */
export function checkLoreUnlocks(state) {
  const already = state.unlockedLore || [];
  const newlyUnlocked = [];

  for (const entry of LORE_ENTRIES) {
    if (already.includes(entry.id)) continue;
    if (isMilestoneMet(entry.milestone, state)) {
      newlyUnlocked.push(entry.id);
    }
  }

  return newlyUnlocked;
}

/**
 * Get the lore progress as a fraction.
 * @param {object} state - Full game state.
 * @returns {{ unlocked: number, total: number, percentage: number }}
 */
export function getLoreProgress(state) {
  const unlocked = (state.unlockedLore || []).length;
  const total = LORE_ENTRIES.length;
  return {
    unlocked,
    total,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  };
}

/**
 * Format a milestone requirement as a human-readable hint.
 * @param {object} milestone - The milestone definition.
 * @returns {string}
 */
export function formatMilestone(milestone) {
  switch (milestone.type) {
    case "totalLevel":
      return `Total Level ${milestone.value}`;
    case "skillLevel":
      return `${milestone.skill.charAt(0).toUpperCase() + milestone.skill.slice(1)} Level ${milestone.value}`;
    case "combatLevel":
      return `Combat Level ${milestone.value}`;
    case "questComplete":
      return `Complete quest: ${milestone.quest.replace(/_/g, " ")}`;
    case "monstersKilled":
      return `${milestone.value} monsters killed`;
    case "adventuresComplete":
      return `${milestone.value} adventures completed`;
    default:
      return "???";
  }
}
