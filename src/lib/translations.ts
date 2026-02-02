
import {
    ALIGNMENTS,
    ANCESTRIES,
    BACKGROUNDS,
    CLASSES,
    DEITIES,
    LANGUAGES,
    STATS,
} from "./constants";
import type {
    Alignment,
    Ancestry,
    Background,
    Class,
    Deity,
    Language,
    Stat,
    Title,
    GearInfo,
    SpellInfo,
    Talent,
    Bonus
} from "./types";

export const CLASS_MAP: Record<Class, string> = {
    Barbarian: "野蠻人",
    Bard: "吟遊詩人",
    Cleric: "牧師",
    Druid: "德魯伊",
    Fighter: "戰士",
    Monk: "武僧",
    Paladin: "聖騎士",
    Ranger: "巡林客",
    Rogue: "盜賊",
    Sorcerer: "術士",
    Warlock: "邪術師",
    Wizard: "法師",
    Artificer: "奇械師",
};

export const ANCESTRY_MAP: Record<Ancestry, string> = {
    Dragonborn: "龍裔",
    Dwarf: "矮人",
    Elf: "精靈",
    Gnome: "地侏",
    "Half-Elf": "半精靈",
    "Half-Orc": "半獸人",
    Halfling: "哈比人",
    Human: "人類",
    Tiefling: "堤夫林",
};

export const ALIGNMENT_MAP: Record<Alignment, string> = {
    "Lawful Good": "守序善良",
    "Neutral Good": "中立善良",
    "Chaotic Good": "混沌善良",
    "Lawful Neutral": "守序中立",
    "True Neutral": "絕對中立",
    "Chaotic Neutral": "混沌中立",
    "Lawful Evil": "守序邪惡",
    "Neutral Evil": "中立邪惡",
    "Chaotic Evil": "混沌邪惡",
};

export const STAT_MAP: Record<Stat, string> = {
    STR: "力量",
    DEX: "敏捷",
    CON: "體質",
    INT: "智力",
    WIS: "感知",
    CHA: "魅力",
};

export const BACKGROUND_MAP: Record<Background, string> = {
    Acolyte: "侍祭",
    Charlatan: "騙子",
    Criminal: "罪犯",
    Entertainer: "藝人",
    "Folk Hero": "平民英雄",
    "Guild Artisan": "公會工匠",
    Hermit: "隱士",
    Noble: "貴族",
    Outlander: "異化者",
    Sage: "賢者",
    Sailor: "水手",
    Soldier: "士兵",
    Urchin: "流浪兒",
};

export const DEITY_MAP: Record<Deity, string> = {
    // 5E FR Deities are too many, using defaults or just passing string
    // Ideally we list them but for now fallback to string
};

export const LANGUAGE_MAP: Record<Language, string> = {
    Common: "通用語",
    Dwarvish: "矮人語",
    Elvish: "精靈語",
    Giant: "巨人語",
    Gnomish: "地侏語",
    Goblin: "哥布林語",
    Halfling: "哈比人語",
    Orc: "獸人語",
    Abyssal: "深淵語",
    Celestial: "天界語",
    Draconic: "龍語",
    "Deep Speech": "地底語",
    Infernal: "煉獄語",
    Primordial: "原初語",
    Sylvan: "森林語",
    Undercommon: "地底通用語",
};

// Helper functions
export function t_Class(c: string): string {
    if (!c) return "";
    return CLASS_MAP[c as Class] ?? c;
}

export function t_Ancestry(a: string): string {
    if (!a) return "";
    return ANCESTRY_MAP[a as Ancestry] ?? a;
}

export function t_Alignment(a: string): string {
    if (!a) return "";
    return ALIGNMENT_MAP[a as Alignment] ?? a;
}

export function t_Stat(s: string): string {
    if (!s) return "";
    return STAT_MAP[s as Stat] ?? s;
}

export function t_Background(b: string): string {
    if (!b) return "";
    return BACKGROUND_MAP[b as Background] ?? b;
}

export function t_Deity(d: string): string {
    if (!d) return "";
    return DEITY_MAP[d as Deity] ?? d;
}

export function t_Language(l: string): string {
    if (!l) return "";
    return LANGUAGE_MAP[l as Language] ?? l;
}

export function t_Title(t: string, c?: Class, a?: Alignment): string {
    return t;
}

export function t_Gear(g: GearInfo): string {
    return g.l10n?.name ?? g.name;
}

export function t_Spell(s: SpellInfo): string {
    return s.l10n?.name ?? s.name;
}

export function t_Talent(t: Talent): string {
    return t.l10n?.name ?? t.name;
}

export function t_Bonus(b: Bonus): string {
    return b.l10n?.name ?? b.name;
}

export function t_BonusDesc(b: Bonus): string {
    return b.l10n?.desc ?? b.desc;
}
