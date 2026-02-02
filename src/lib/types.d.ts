import {
  WEAPON_TYPES,
  DICE_TYPES,
  RANGE_TYPES,
  WEAPON_PROPERTIES,
  ALIGNMENTS,
  DEITIES,
  BACKGROUNDS,
  TIME_UNITS,
  TITLES,
  CLASSES,
  ANCESTRIES,
  LANGUAGES,
  STATS,
  BONUS_TOS,
  ROLL_BONUS_TOS,
  SHIELD_PROPERTIES,
  GEAR_TYPES,
  NUMERICAL_BONUS_TOS,
  SKILLS,
  CONDITIONS,
  SIZES,
} from "./constants";

export type L10nInfo = {
  name?: string;
  desc?: string;
  aliases?: string[];
};

export type Merge<T, R> = Omit<T, keyof R> & R;

export type DiceType = (typeof DICE_TYPES)[number];
export type RangeType = (typeof RANGE_TYPES)[number];
export type TimeUnit = (typeof TIME_UNITS)[number];
export type DurationSubType = "InGame" | "RealTime";
export type DurationType = "Focus" | "Instant" | TimeUnit;
export type Roll = {
  diceType: DiceType;
  numDice: number;
};
export type Size = (typeof SIZES)[number];

///// Talent
// In 5E, Talents are Feats or Class Features
export type GenericTalent = {
  name: string;
  l10n?: L10nInfo;
  type: "generic";
  desc?: string; // Enhanced description support
};
export type BonusTalent = Merge<
  GenericTalent,
  {
    type: "bonus";
    bonuses: Bonus[];
  }
>;
export type ChooseBonusTalent = Merge<
  GenericTalent,
  {
    type: "chooseBonus";
    choices: (Bonus | Bonus[])[];
  }
>;
export type Talent = GenericTalent | BonusTalent | ChooseBonusTalent;

///// Spell
export type SpellTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Spell = {
  name: string;
  prepared?: boolean; // 5E prepared spells
  alwaysPrepared?: boolean; // Domain spells etc
  ritual?: boolean;
};
export type SpellClass = Class | "Other";
export type SpellInfo = {
  name: string;
  class: SpellClass;
  stat?: Stat;
  tier: SpellTier;
  range: string; // 5E ranges are specific (e.g. "60 feet")
  duration: string; // "1 minute", "Instantaneous"
  components?: {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
    materialDesc?: string;
  };
  ritual?: boolean;
  editable?: boolean;
  desc: string;
  l10n?: L10nInfo;
};

///// PlayerCharacter
export type Alignment = (typeof ALIGNMENTS)[number];
export type Deity = (typeof DEITIES)[number] | string; // Allow custom deities
export type Background = (typeof BACKGROUNDS)[number] | string;
export type Class = (typeof CLASSES)[number];
export type Title = (typeof TITLES)[number] | string; // Titles are less strict in 5E
export type Ancestry = (typeof ANCESTRIES)[number];
export type Language = (typeof LANGUAGES)[number] | string;
export type Stat = (typeof STATS)[number];
export type StatBlock = {
  [key in Stat]: number;
};
export type Skill = (typeof SKILLS)[number];
export type ProficiencyLevel = 0 | 1 | 2 | 0.5; // 0=None, 1=Proficient, 2=Expertise, 0.5=Jack of all trades

// Hit Dice tracking
export type HitDice = {
  [key in DiceType]?: {
    total: number;
    current: number;
  };
};

export type PlayerCharacter = {
  name: string;
  ancestry: Ancestry | "";
  subancestry?: string; // High Elf, Mountain Dwarf etc
  hasCustomAncestry?: boolean;
  class?: Class | "";
  subclass?: string; // Champion, Life Domain etc
  hasCustomClass?: boolean;
  level: number;
  title: Title;
  alignment: Alignment;
  background: Background;
  deity: Deity;

  // Stats & Skills
  stats: StatBlock;
  skills: { [key in Skill]: ProficiencyLevel };
  savingThrows: { [key in Stat]: boolean }; // Proficient in save?
  proficiencyBonus: number;
  passivePerception: number;
  speed: number; // in feet
  initiativeBonus?: number; // Misc bonus on top of DEX

  // Health
  maxHitPoints: number;
  hitPoints: number;
  tempHitPoints: number;
  hitDice: HitDice;
  deathSaves: {
    successes: number;
    failures: number;
  };
  conditions: string[]; // List of active condition names
  exhaustion: number; // 0-6 level
  armorClass: number;

  // Equipment
  gear: Gear[];
  customGear: GearInfo[];
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  carryingCapacity: number; // Calculated lbs limit

  // Magic & Features
  notes: string;
  bonuses: Bonus[];
  customBonuses: Bonus[];
  customTalents: Talent[]; // Used for Feats and Features
  languages: string[];
  customLanguages: string[];
  xp: number;

  // Spells
  spells: Spell[];
  customSpells: SpellInfo[];
  spellSlots: {
    [key in SpellTier]?: {
      max: number;
      used: number;
    };
  };
};

/////// Bonus
export type NumericalBonusTo = (typeof NUMERICAL_BONUS_TOS)[number];
export type RollBonusTo = (typeof ROLL_BONUS_TOS)[number];
export type BonusTo = (typeof BONUS_TOS)[number];
export type BonusSourceCategory = "Ability" | "Talent" | "Feat";
export type BonusSourceType = "Ancestry" | "Class" | "Gear" | "Talent" | "Feat";
export type WeaponBonusMetaData = {
  type: "weapon";
  weapon: string;
};
export type ArmorBonusMetaData = {
  type: "armor";
  armor: string;
};
export type WeaponTypeBonusMetaData = {
  type: "weaponType";
  weaponType: WeaponType;
};
export type StatBonusMetaData = {
  type: "stat";
  stat: Stat;
};
export type SpellBonusMetaData = {
  type: "spell";
  spell: string;
};
export type BonusMetaData =
  | WeaponBonusMetaData
  | WeaponTypeBonusMetaData
  | ArmorBonusMetaData
  | StatBonusMetaData
  | SpellBonusMetaData;
export type GenericBonus = {
  name: string;
  desc: string;
  bonusSource?: BonusSourceType;
  type: "generic";
  metadata?: BonusMetaData;
  editable?: boolean;
  l10n?: L10nInfo;
};
export type ModifyBonus = Merge<
  GenericBonus,
  {
    type: "modifyAmt";
    bonusTo: BonusTo;
    bonusAmount: number;
    bonusIncreaseRatePerLevel?: number; // bonus amount increases at this rate per level (rounded down)
  }
>;
export type DiceTypeBonus = Merge<
  GenericBonus,
  {
    type: "diceType";
    bonusTo: RollBonusTo;
    diceType: DiceType;
  }
>;
export type AdvantageBonus = Merge<
  GenericBonus,
  {
    type: "advantage";
    bonusTo: RollBonusTo;
  }
>;
export type DisadvantageBonus = Merge<
  GenericBonus,
  {
    bonusTo: RollBonusTo;
    type: "disadvantage";
  }
>;
export type Bonus =
  | GenericBonus
  | ModifyBonus
  | DiceTypeBonus
  | AdvantageBonus
  | DisadvantageBonus;

///// ShadowDarklings (Legacy placeholder or repurposed)
export type SDBonus = {
  sourceType: BonusSourceType;
  sourceName: string;
  sourceCategory: BonusSourceCategory;
  gainedAtLevel: number;
  name: string;
  bonusName: string;
  bonusTo: string;
  bonusAmount: number;
};

///// Gear
export type Cost = { gp: number; sp: number; cp: number; ep: number; pp: number; }; // keeping cost structure for basic compatibility, though 5E mostly uses GP
export type Currency = keyof Cost;
export type GearProperty =
  | ShieldProperty
  | WeaponProperty
  | "Magic"
  | "Attunement"
  | "Attackable"; // attackable means it can show up in the attacks view
export type GearType = (typeof GEAR_TYPES)[number];
export type GearInfo = {
  name: string;
  properties?: GearProperty[];
  type: GearType;
  canBeEquipped: boolean;
  weight: number; // 5E uses weight in lbs
  cost: Cost; // Standardize on GP value? Keeping Cost struct for now.
  desc?: string;
  playerBonuses?: Bonus[];
  editable?: boolean;
  l10n?: L10nInfo;
  equipped?: boolean; // For custom gear instances
};
export type Gear = {
  name: string;
  quantity: number;
  equipped?: boolean;
  attuned?: boolean;
};

///// Weapon
export type WeaponType = (typeof WEAPON_TYPES)[number];
export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number];
export type WeaponInfo = Merge<
  GearInfo,
  {
    type: "Weapon";
    properties?: WeaponProperty[];
    damage: {
      oneHanded?: Roll;
      twoHanded?: Roll;
      damageType?: string; // Slashing, Piercing, etc.
    };
    range: string; // "30/120"
    weaponType: WeaponType;
  }
>;

////// Armor
export type ShieldProperty = (typeof SHIELD_PROPERTIES)[number];
export type ArmorAC = {
  base: number;
  modifier: number; // Max Dex Mod etc
  maxDex?: number; // Max Dex bonus allowed (2 for Medium, 0 for Heavy)
  stealthDisadvantage?: boolean;
  stat?: Stat;
};
export type ArmorInfo = Merge<
  GearInfo,
  {
    type: "Armor";
    properties?: ShieldProperty[];
    ac: ArmorAC;
    minStr?: number; // Str required to wear
  }
>;

type LocalSettings = {
  popoverDuration?: number;
};
