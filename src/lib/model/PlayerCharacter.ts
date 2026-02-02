import { writable } from "svelte/store";
import { findAny } from "../compendium";
import {
  ensureAncestryBonuses,
  ensureLanguages,
} from "../services/AncestryClassEnsurer";
import { createUndoRedoStore } from "../services/PlayerHistoryTracker";
import type {
  Ancestry,
  ArmorInfo,
  Bonus,
  Class,
  DiceType,
  DiceTypeBonus,
  Gear,
  GearInfo,
  ModifyBonus,
  PlayerCharacter,
  SpellInfo,
  Stat,
  Title,
  WeaponInfo,
  Skill,
} from "../types";
import { alphabetically, clamp, compareDiceType, toInfo } from "../utils";
// import { slotsForGear } from "./Gear";

// D&D 5E Default Character
export const PlayerCharacterStore = createUndoRedoStore(
  writable<PlayerCharacter>(defaultPC()),
);
export const pc = PlayerCharacterStore;

export function defaultPC(): PlayerCharacter {
  return {
    name: "",
    ancestry: "Human", // Default generic
    class: "",
    level: 1, // 5E usually starts at 1
    title: "",
    alignment: "True Neutral",
    background: "Noble",
    deity: "",
    notes: "",
    gear: [],
    customGear: [],
    // Standard Array or Point Buy baseline
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    // Skills defaulted to not proficient (0)
    skills: {
      Acrobatics: 0,
      "Animal Handling": 0,
      Arcana: 0,
      Athletics: 0,
      Deception: 0,
      History: 0,
      Insight: 0,
      Intimidation: 0,
      Investigation: 0,
      Medicine: 0,
      Nature: 0,
      Perception: 0,
      Performance: 0,
      Persuasion: 0,
      Religion: 0,
      "Sleight of Hand": 0,
      Stealth: 0,
      Survival: 0,
    },
    savingThrows: {
      STR: false,
      DEX: false,
      CON: false,
      INT: false,
      WIS: false,
      CHA: false,
    },
    proficiencyBonus: 2,
    passivePerception: 10,
    speed: 30,
    bonuses: [],
    customBonuses: [],
    customTalents: [],
    maxHitPoints: 10,
    hitPoints: 10,
    tempHitPoints: 0,
    hitDice: {},
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    exhaustion: 0,
    armorClass: 10,
    carryingCapacity: 150, // STR 10 * 15
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    languages: ["Common"],
    customLanguages: [],
    xp: 0,
    spells: [],
    customSpells: [],
    spellSlots: {},
  };
}

export function ensurePlayerCharacterIntegrity(pc: Partial<PlayerCharacter> | null | undefined): PlayerCharacter {
  const def = defaultPC();
  if (!pc) return def;

  // Deep merge for critical nested objects to avoid undefined errors
  return {
    ...def,
    ...pc,
    stats: { ...def.stats, ...(pc.stats || {}) },
    skills: { ...def.skills, ...(pc.skills || {}) },
    savingThrows: { ...def.savingThrows, ...(pc.savingThrows || {}) },
    currency: { ...def.currency, ...(pc.currency || {}) },
    hitDice: { ...def.hitDice, ...(pc.hitDice || {}) },
    deathSaves: { ...def.deathSaves, ...(pc.deathSaves || {}) },

    // Arrays: Fallback to empty if undefined, but keep existing arrays
    gear: Array.isArray(pc.gear) ? pc.gear : [],
    customGear: Array.isArray(pc.customGear) ? pc.customGear : [],
    spells: Array.isArray(pc.spells) ? pc.spells : [],
    customSpells: Array.isArray(pc.customSpells) ? pc.customSpells : [],
    bonuses: Array.isArray(pc.bonuses) ? pc.bonuses : [],
    customBonuses: Array.isArray(pc.customBonuses) ? pc.customBonuses : [],
    customTalents: Array.isArray(pc.customTalents) ? pc.customTalents : [],
    conditions: Array.isArray(pc.conditions) ? pc.conditions : [],
    languages: Array.isArray(pc.languages) ? pc.languages : [],
    customLanguages: Array.isArray(pc.customLanguages) ? pc.customLanguages : [],

    // Primitives that might be missing in old saves
    proficiencyBonus: pc.proficiencyBonus ?? def.proficiencyBonus,
    armorClass: pc.armorClass ?? def.armorClass,
    maxHitPoints: pc.maxHitPoints ?? def.maxHitPoints,
    hitPoints: pc.hitPoints ?? def.hitPoints,
  };
}

// 5E Proficiency Bonus: ceil(level / 4) + 1
// Level 1-4: +2, 5-8: +3, 9-12: +4, 13-16: +5, 17-20: +6
export function calculateProficiencyBonus(level: number): number {
  if (level <= 0) return 2;
  return Math.ceil(level / 4) + 1;
}

// 5E Stat Modifier: floor((score - 10) / 2)
// No hard cap at -4/+4 like ShadowDark. Example: 1 = -5, 20 = +5, 30 = +10
export function calculateModifierForPlayerStat(
  pc: PlayerCharacter,
  stat: Stat,
): number {
  const finalScore = calculateStatValueForPlayerStat(pc, stat);
  return Math.floor((finalScore - 10) / 2);
}

export function setClassForPlayer(pc: PlayerCharacter, c: Class) {
  pc.class = c;
  // TODO: Logic to set Saving Throw Proficiencies based on Class
  // TODO: Implement ensureClassBonuses for 5E specific features if needed
  // ensureClassBonuses(pc);
  // ensureClassGear(pc);
}

export function setAncestryForPlayer(pc: PlayerCharacter, a: Ancestry | "") {
  pc.ancestry = a;
  ensureAncestryBonuses(pc);
  ensureLanguages(pc);
}

// Helper to get all bonuses (Player Bonuses + Equipped Gear Bonuses)
export function getAllActiveBonuses(pc: PlayerCharacter): Bonus[] {
  const gearBonuses = (pc.gear || [])
    .filter((g) => g.equipped)
    .flatMap((g) => {
      const info = findAny(g.name);
      return info?.playerBonuses || [];
    });

  const customGearBonuses = (pc.customGear || [])
    .filter((g) => g.equipped)
    .flatMap((g) => g.playerBonuses || []);

  const bonuses = pc.bonuses || [];
  const customBonuses = pc.customBonuses || [];

  return [...bonuses, ...customBonuses, ...gearBonuses, ...customGearBonuses];
}

export function calculateStatValueForPlayerStat(
  pc: PlayerCharacter,
  stat: Stat,
): number {
  const baseStat = pc.stats[stat];
  // Add bonuses from race/feats/etc
  return baseStat + calculateBonusForPlayerStat(pc, stat);
}

function doesBonusApplyToWeapon(b: Bonus, w: WeaponInfo): boolean {
  const appliesToAllWeapons = !b.metadata;

  const appliesToWeaponType =
    b.metadata?.type === "weaponType" &&
    w.weaponType.includes(b.metadata.weaponType);

  const appliesToWeapon =
    b.metadata?.type === "weapon" && b.metadata.weapon === w.name;

  return appliesToAllWeapons || appliesToWeaponType || appliesToWeapon;
}

export function calculateDamageDiceTypeForPlayerWeapon(
  pc: PlayerCharacter,
  w: WeaponInfo,
  handedness: "oneHanded" | "twoHanded",
): DiceType {
  let result = w.damage[handedness]?.diceType ?? "d4";

  // In 5E, dice type upgrades are rare (Monk martial arts etc).
  // Keeping logic generic for now.
  const activeBonuses = getAllActiveBonuses(pc);
  const diceTypeBonuses = activeBonuses
    .filter(
      (b) =>
        b.type === "diceType" &&
        b.bonusTo === "damageRoll" &&
        doesBonusApplyToWeapon(b, w),
    )
    .map((b: DiceTypeBonus) => b.diceType)
    .sort(compareDiceType)
    .reverse();

  if (diceTypeBonuses[0] && compareDiceType(diceTypeBonuses[0], result) > 0) {
    result = diceTypeBonuses[0];
  }

  return result;
}

export function calculateBonusForPlayerStat(
  pc: PlayerCharacter,
  stat: Stat,
): number {
  const activeBonuses = getAllActiveBonuses(pc);
  return activeBonuses
    .filter(
      (b) =>
        b.type === "modifyAmt" &&
        b.bonusTo === "stat" &&
        b.metadata?.type === "stat" &&
        b.metadata.stat === stat,
    )
    .reduce((acc, b: ModifyBonus) => acc + calculateBonusAmount(pc, b), 0);
}

export function isPlayerHoldingShield(pc: PlayerCharacter): boolean {
  return Boolean(
    pc.gear
      .filter((g) => g.equipped)
      .map(toInfo<ArmorInfo>)
      .find((g) => g.type === "Armor" && g.properties?.includes("Shield")),
  );
}

// 5E Armor Class Calculation
// Light Armor: AC + Dex Mod
// Medium Armor: AC + Dex Mod (max 2)
// Heavy Armor: AC (no Dex Mod)
// Unarmored: 10 + Dex Mod (+ Con/Wis for Barbarian/Monk if implemented as bonus)
export function calculateArmorClassForPlayer(pc: PlayerCharacter) {
  let finalAC = 0;

  // Identify Armor Worn
  const equippedArmor = pc.gear
    .filter((g) => g.equipped)
    .map(toInfo<ArmorInfo>)
    .filter((g) => g.type === "Armor" && !g.properties?.includes("Shield")); // Exclude shields

  // Base AC Calculation
  const dexMod = calculateModifierForPlayerStat(pc, "DEX");

  if (equippedArmor.length > 0) {
    // Assuming single armor piece. If multiple, take the highest base or handle error.
    // 5E generally doens't allow stacking armor.
    const armor = equippedArmor[0];
    const base = armor.ac.base;

    // Check Armor Type via Max Dex
    // Logic: 
    // If maxDex is undefined => Light Armor (Full Dex)
    // If maxDex is defined (e.g. 2) => Medium Armor (limited Dex)
    // If maxDex is 0 => Heavy Armor (No Dex)
    // Note: types.d.ts defines maxDex?.

    let applicableDex = dexMod;
    if (armor.ac.maxDex !== undefined) {
      if (armor.ac.maxDex === 0) {
        applicableDex = 0; // Heavy
      } else {
        applicableDex = Math.min(dexMod, armor.ac.maxDex); // Medium
      }
    }

    finalAC = base + applicableDex;

    // Add armor magical bonus
    finalAC += armor.ac.modifier;
  } else {
    // Unarmored Defense (10 + Dex)
    // TODO: Barbarian/Monk unarmored defense logic checks could go here
    finalAC = 10 + dexMod;
  }

  // Shield Bonus
  const shields = pc.gear
    .filter((g) => g.equipped)
    .map(toInfo<ArmorInfo>)
    .filter((g) => g.type === "Armor" && g.properties?.includes("Shield"));

  for (const s of shields) {
    finalAC += s.ac.base > 0 ? s.ac.base : 2; // Default shield AC is usually +2 in 5E
    finalAC += s.ac.modifier; // Magic shield bonus
  }

  // Global AC Bonuses (Ring of Protection, Fighting Style, etc.)
  const activeBonuses = getAllActiveBonuses(pc);
  const miscBonuses = activeBonuses.reduce((acc, b) => {
    if (b.type === "modifyAmt" && b.bonusTo === "armorClass") {
      return acc + calculateBonusAmount(pc, b);
    }
    return acc;
  }, 0);

  finalAC += miscBonuses;

  // Add Manual Bonus (pc.armorClass - 10)
  // Assuming 10 is the base for everyone, any deviation in pc.armorClass is treated as a manual modifier
  if (pc.armorClass !== 10) {
    finalAC += (pc.armorClass - 10);
  }

  return finalAC;
}

import { t_Alignment } from "../translations";

export function calculateTitleForPlayer(pc: PlayerCharacter): string {
  if (pc.title) return pc.title;

  const alignment = t_Alignment(pc.alignment);
  const background = pc.background || "";
  const cls = pc.class || "";
  const level = pc.level;

  // Format: "Chaotic Good Noble Fighter (Lv. 3)"
  const parts = [alignment, background, cls].filter(p => p).join(" ");
  return `${parts} (Lv. ${level})`;
}

// 5E Spell Save DC = 8 + Proficiency + Stat Mod
// 5E Spell Attack Mod = Proficiency + Stat Mod
export function calculateSpellAttackModifier(
  pc: PlayerCharacter,
  spellClass: Class = "Wizard", // Default to Int based if unknown
): number {
  const prof = calculateProficiencyBonus(pc.level);
  let stat: Stat = "INT";

  if (["Cleric", "Druid", "Ranger"].includes(pc.class || "")) stat = "WIS";
  if (["Bard", "Paladin", "Sorcerer", "Warlock"].includes(pc.class || "")) stat = "CHA";

  const mod = calculateModifierForPlayerStat(pc, stat);
  return prof + mod;
}

export function calculateSpellSaveDC(pc: PlayerCharacter): number {
  return 8 + calculateSpellAttackModifier(pc);
}

// Legacy function signature support, roughly maps to Attack Mod
export function calculateSpellCastingModifierForPlayer(
  pc: PlayerCharacter,
  spell: SpellInfo,
): number {
  return calculateSpellAttackModifier(pc);
}

export function calculateDamageBonusForPlayerWeapon(
  pc: PlayerCharacter,
  w: WeaponInfo,
): number {
  // 5E: Damage Bonus = Stat Mod (usually) + Magic Bonus + Rage etc.
  // Prof bonus is NOT added to damage (usually).

  let result = 0;

  // Stat Mod
  const strMod = calculateModifierForPlayerStat(pc, "STR");
  const dexMod = calculateModifierForPlayerStat(pc, "DEX");

  if (w.properties?.includes("Finesse") || (w.weaponType && w.weaponType.includes("Ranged"))) {
    // Finesse can use Str or Dex. Logic usually picks higher.
    // Ranged uses Dex (unless Thrown).
    if (w.weaponType.includes("Ranged") && !w.properties?.includes("Thrown")) {
      result += dexMod;
    } else if (w.properties?.includes("Finesse")) {
      result += Math.max(strMod, dexMod);
    } else {
      result += strMod;
    }
  } else {
    // Default Melee = Str
    result += strMod;
  }

  // Magic Bonus from Weapon
  // Assuming weapon generic bonuses stored in playerBonuses or similar?
  // 5E Magic weapons usually have +1/+2/+3 added to hit and damage.
  // We need to check if 'g.playerBonuses' contains damage mods.

  // Global Bonuses (Dueling Fighting Style etc)
  const bonuses = pc.bonuses
    .filter((b) => b.type === "modifyAmt" && b.bonusTo === "damageRoll")
    .reduce((acc: number, b: ModifyBonus) => {
      if (doesBonusApplyToWeapon(b, w)) {
        acc += calculateBonusAmount(pc, b);
      }
      return acc;
    }, 0);
  result += bonuses;

  return result;
}

// 5E Attack Roll = d20 + Stat Mod + Proficiency (if proficient)
export function calculateAttackBonusForPlayerWeapon(
  pc: PlayerCharacter,
  w: WeaponInfo,
): number {
  let result = 0;

  // 1. Stat Mod
  const strMod = calculateModifierForPlayerStat(pc, "STR");
  const dexMod = calculateModifierForPlayerStat(pc, "DEX");

  if (w.properties?.includes("Finesse")) {
    result += Math.max(strMod, dexMod);
  } else if (w.weaponType.includes("Ranged") && !w.properties?.includes("Thrown")) {
    result += dexMod;
  } else {
    result += strMod;
  }

  // 2. Proficiency Bonus
  // In 5E, you are proficient if your class grants it.
  // For now, assuming PROFIENT with all weapons if martial/simple matches class.
  // Simplified: Always add proficiency for now, or check generic "Proficient".
  const profBonus = calculateProficiencyBonus(pc.level);
  result += profBonus;

  // 3. Item/Global Bonuses (+1 Weapon, etc)
  const bonuses = pc.bonuses
    .filter((b) => b.type === "modifyAmt" && b.bonusTo === "attackRoll")
    .reduce((acc: number, b: ModifyBonus) => {
      if (doesBonusApplyToWeapon(b, w)) {
        acc += calculateBonusAmount(pc, b);
      }
      return acc;
    }, 0);
  result += bonuses;

  return result;
}

// 5E Encumbrance: Carrying Capacity = STR * 15 lbs
export function calculateCarryingCapacity(pc: PlayerCharacter): number {
  const str = calculateStatValueForPlayerStat(pc, "STR");
  return str * 15;
}

// Legacy function mapping
export function calculateGearSlotsForPlayer(pc: PlayerCharacter) {
  return calculateCarryingCapacity(pc);
}

// 5E Total Weight
export function calculateTotalWeight(pc: PlayerCharacter): number {
  return pc.gear.reduce((acc, g) => {
    const info = findAny(g.name);
    return acc + (info?.weight || 0) * g.quantity;
  }, 0);
}

// Legacy function mapping, simplified to avoid errors elsewhere
export function calculateFreeSlotsForPlayer(pc: PlayerCharacter): number {
  const capacity = calculateCarryingCapacity(pc);
  const current = calculateTotalWeight(pc);
  return Math.max(0, capacity - current);
}

// 5E Level Up XP Table
const XP_TABLE = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];

export function levelUpPlayer(pc: PlayerCharacter) {
  if (pc.level >= 20) return;
  const nextLevelXp = XP_TABLE[pc.level];

  if (pc.xp >= nextLevelXp) {
    pc.level += 1;
    // HP Increase logic would go here (Roll Hit Die + Con Mod)
  }
}

export function playerHasSpell(pc: PlayerCharacter, spell: SpellInfo) {
  return pc.spells.findIndex((s) => s.name === spell.name) > -1;
}

export function playerCanLearnSpell(pc: PlayerCharacter, spell: SpellInfo) {
  // 5E learning rules are complex (Class list, etc.)
  // Simplified check:
  return true;
}

export function learnSpellForPlayer(pc: PlayerCharacter, spell: SpellInfo) {
  if (playerHasSpell(pc, spell)) return;
  pc.spells.push({ name: spell.name });
}

export function unlearnSpellForPlayer(pc: PlayerCharacter, spell: SpellInfo) {
  pc.spells = pc.spells.filter((s) => s.name !== spell.name);
}

export function addBonusToPlayer(pc: PlayerCharacter, b: Bonus) {
  pc.bonuses.push(b);
}

export function deleteBonusForPlayer(pc: PlayerCharacter, theBonus: Bonus) {
  pc.bonuses = pc.bonuses.filter((b) => b.name !== theBonus.name);
}

export function calculateTotalHitPointsForPlayer(pc: PlayerCharacter): number {
  const baseMaxHP = pc.maxHitPoints;
  const activeBonuses = getAllActiveBonuses(pc);
  const bonuses = activeBonuses
    .filter((b) => {
      return b.type === "modifyAmt" && b.bonusTo === "hp";
    })
    .reduce((acc, b: ModifyBonus) => {
      return acc + calculateBonusAmount(pc, b);
    }, 0);
  return baseMaxHP + bonuses;
}

export function calculateBonusAmount(
  pc: PlayerCharacter,
  b: ModifyBonus,
): number {
  let result = b.bonusAmount;

  if (b.bonusTo !== "stat" && b.metadata?.type === "stat") {
    result = Math.max(
      result,
      calculateModifierForPlayerStat(pc, b.metadata.stat),
    );
  }
  const levelRateBonus = Math.floor(
    pc.level * (b.bonusIncreaseRatePerLevel ?? 0),
  );
  return result + levelRateBonus;
}

export function deleteCustomPlayerSpell(pc: PlayerCharacter, spell: SpellInfo) {
  pc.spells = pc.spells.filter((s) => s.name !== spell.name);
  // Cleanup bonuses
  pc.bonuses = pc.bonuses.filter((b) => {
    if (b.metadata?.type === "spell" && b.metadata.spell === spell.name)
      return false;
    return true;
  });
  pc.customSpells = pc.customSpells.filter((s) => s.name !== spell.name);
}

function isArmorShield(g: GearInfo): boolean {
  return g.type === "Armor" && Boolean(g.properties?.includes("Shield"));
}

function isWearableArmor(g: GearInfo): boolean {
  return g.type === "Armor" && !g.properties?.includes("Shield");
}

export function canPlayerAffordGear(pc: PlayerCharacter, g: GearInfo) {
  // Simplified currency check (all converted to CP for comparison)
  // 1 GP = 10 SP = 100 CP
  const costCP = g.cost.gp * 100 + g.cost.sp * 10 + g.cost.cp;

  // 5E typically uses GP/SP/CP. PP/EP exist but less common.
  // Assuming PC currency structure: 
  const pcCP = (pc.currency?.gp || 0) * 100 +
    (pc.currency?.sp || 0) * 10 +
    (pc.currency?.cp || 0);

  return pcCP >= costCP;
}

export function canPlayerEquipGear(pc: PlayerCharacter, gear: Gear) {
  if (gear.equipped) return false;
  // 5E equipping rules are generally:
  // - Armor takes time (Action/Minutes), usually disallowed in combat for heavy.
  // - Shields take 1 Action to don/doff.
  // - Weapons are free interaction.

  // For this function, just check logic "Can it be equipped?"
  const g = findAny(gear.name);
  if (!g || !g.canBeEquipped) return false;

  if (isWearableArmor(g)) {
    // Cannot wear multiple armors
    const equippedArmor = pc.gear
      .filter((a) => a.equipped)
      .map((a) => findAny(a.name))
      .filter(isWearableArmor);
    return equippedArmor.length === 0;
  }

  // Hand logic
  const freeHands = calculateFreeHands(pc);
  if (freeHands <= 0) return false;
  if (freeHands == 2) return true;

  // 1 hand free
  if (g.type === "Weapon") {
    const w = g as WeaponInfo;
    return !w.properties?.includes("Two-Handed");
  } else if (isArmorShield(g)) {
    return freeHands >= 1;
  }

  return true;
}

export function calculateFreeHands(pc: PlayerCharacter): number {
  let freeHands = 2;

  const equippedWeapons = pc.gear
    .filter((w) => w.equipped)
    .map((w) => findAny(w.name))
    .filter((w) => w.type === "Weapon")
    .map((w) => w as WeaponInfo);

  // Minus hands for weapons
  freeHands -= equippedWeapons.reduce((acc, w) => {
    // Two-Handed property
    const isTwoHanded = w.properties?.includes("Two-Handed");
    return acc + (isTwoHanded ? 2 : 1);
  }, 0);

  // Minus hands for shields
  const equippedShields = pc.gear
    .filter((g) => g.equipped)
    .map((g) => findAny(g.name))
    .filter((g) => g.type === "Armor" && g.properties?.includes("Shield"));

  freeHands -= equippedShields.length;

  return freeHands;
}

export function calculatePassivePerception(pc: PlayerCharacter): number {
  const wisMod = calculateModifierForPlayerStat(pc, "WIS");
  const profBonus = pc.skills["Perception"] ? calculateProficiencyBonus(pc.level) * pc.skills["Perception"] : 0;
  // Proficiency Level logic: 0=None, 1=Prof, 2=Expert.
  // If skill value is multiplier (0, 1, 2)
  return 10 + wisMod + profBonus;
}

// Helper to calculate Skill Check Bonus
export function calculateSkillBonus(pc: PlayerCharacter, skill: Skill): number {
  // Find stat for skill
  let stat: Stat = "WIS"; // Default fallback

  // Map skills to stats
  switch (skill) {
    case "Athletics": stat = "STR"; break;
    case "Acrobatics":
    case "Sleight of Hand":
    case "Stealth": stat = "DEX"; break;
    case "Arcana":
    case "History":
    case "Investigation":
    case "Nature":
    case "Religion": stat = "INT"; break;
    case "Animal Handling":
    case "Insight":
    case "Medicine":
    case "Perception":
    case "Survival": stat = "WIS"; break;
    case "Deception":
    case "Intimidation":
    case "Performance":
    case "Persuasion": stat = "CHA"; break;
  }

  const statMod = calculateModifierForPlayerStat(pc, stat);
  const profLevel = pc.skills[skill] || 0;
  const profBonus = Math.floor(calculateProficiencyBonus(pc.level) * profLevel);
  // e.g. Level 1 (PB +2) * Expertise (2) = +4

  return statMod + profBonus;
}
