/**
 * The two characters, their slots and their sets. Pure data and pure
 * functions: nothing here touches the DOM, so it is the part under test.
 */

import { type CharacterId, type SlotType, pieceArt } from "./art";

export type { CharacterId, SlotType };

export type Piece = {
  /** Unique within a character ("hair1"); use `pieceKey` for a global id. */
  id: string;
  character: CharacterId;
  type: SlotType;
  name: string;
  /** Set this piece ships in, e.g. "street". */
  set: string;
};

export type Kit = {
  id: string;
  character: CharacterId;
  name: string;
  /** Piece ids, in slot order. */
  pieces: string[];
  price: number;
  /** Starting state for the demo: a set you already have. */
  ownedAtStart: boolean;
};

export type Combo = {
  need: Partial<Record<SlotType, string>>;
  label: string;
};

export type CharacterDef = {
  id: CharacterId;
  label: string;
  /** Slots in the order they appear on the bench and in the look number. */
  slots: SlotType[];
  pieces: Piece[];
  sets: Kit[];
  combos: Combo[];
};

export const SLOT_LABEL: Record<SlotType, string> = {
  hair: "hair",
  outfit: "outfit",
  shoes: "shoes",
  bag: "bag",
};

/** Tray headings. The girl's hair slot is a hat as well as hair. */
export const TRAY_TITLE: Record<CharacterId, Record<SlotType, string>> = {
  boy: { hair: "Hair & shades", outfit: "Outfits", shoes: "Shoes", bag: "Bags" },
  girl: { hair: "Hats & hair", outfit: "Dresses & outfits", shoes: "Shoes", bag: "Handbags" },
};

const SET_PRICE = 1650; // placeholder, as in the concept

const piece = (
  character: CharacterId,
  id: string,
  set: string
): Piece => {
  const art = pieceArt(character, id);
  return { id, character, type: art.type, name: art.name, set };
};

const SET_IDS: Record<CharacterId, [string, string, string]> = {
  boy: ["street", "match", "trail"],
  girl: ["garden", "meadow", "denim"],
};
const SET_NAMES: Record<string, string> = {
  street: "Street Set",
  match: "Match Day Set",
  trail: "Trail Set",
  garden: "Garden Set",
  meadow: "Meadow Set",
  denim: "Denim Set",
};

function build(
  id: CharacterId,
  label: string,
  slots: SlotType[],
  combos: Combo[]
): CharacterDef {
  const pieces: Piece[] = [];
  const sets: Kit[] = SET_IDS[id].map((setId, i) => {
    const ids = slots.map((slot) => `${slot}${i + 1}`);
    ids.forEach((pid) => pieces.push(piece(id, pid, setId)));
    return {
      id: setId,
      character: id,
      name: SET_NAMES[setId],
      pieces: ids,
      price: SET_PRICE,
      ownedAtStart: true, // flip to false per set to bring back locked pieces and "buy to unlock"
    };
  });
  // Group by slot so racks read hair, hair, hair, outfit…
  pieces.sort((a, b) => slots.indexOf(a.type) - slots.indexOf(b.type) || a.id.localeCompare(b.id));
  return { id, label, slots, pieces, sets, combos };
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  boy: build("boy", "Boy", ["hair", "outfit", "shoes"], [
    { need: { hair: "hair2", outfit: "outfit2", shoes: "shoes2" }, label: "FULL MATCH KIT!" },
    { need: { hair: "hair3", outfit: "outfit3", shoes: "shoes3" }, label: "SCOUT, READY!" },
    { need: { hair: "hair1", outfit: "outfit1", shoes: "shoes1" }, label: "TOO COOL!" },
    { need: { outfit: "outfit2", shoes: "shoes2" }, label: "MATCH DAY" },
    { need: { outfit: "outfit3", shoes: "shoes3" }, label: "TRAIL READY" },
    { need: { outfit: "outfit1", shoes: "shoes1" }, label: "HOODIE WEATHER" },
  ]),
  girl: build("girl", "Girl", ["hair", "outfit", "bag", "shoes"], [
    { need: { hair: "hair1", outfit: "outfit1", bag: "bag1", shoes: "shoes1" }, label: "GARDEN PARTY!" },
    { need: { hair: "hair2", outfit: "outfit2", bag: "bag2", shoes: "shoes2" }, label: "MEADOW WALK!" },
    { need: { hair: "hair3", outfit: "outfit3", bag: "bag3", shoes: "shoes3" }, label: "DENIM DAY!" },
    { need: { outfit: "outfit1", shoes: "shoes1" }, label: "GARDEN GOWN" },
    { need: { outfit: "outfit2", shoes: "shoes2" }, label: "MEADOW MIX" },
    { need: { outfit: "outfit3", shoes: "shoes3" }, label: "SNEAKER DAY" },
  ]),
};

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];
export const ALL_SETS: Kit[] = CHARACTER_IDS.flatMap((c) => CHARACTERS[c].sets);

export const setById = (id: string) => ALL_SETS.find((s) => s.id === id);

export const findPiece = (character: CharacterId, id: string) =>
  CHARACTERS[character].pieces.find((p) => p.id === id) as Piece;

/** Sets that start out owned, as the demo has always done. */
export const initialOwned = () => ALL_SETS.filter((s) => s.ownedAtStart).map((s) => s.id);

/* ------------------------------------------------------------------ looks -- */

export type Worn = Partial<Record<SlotType, string>>;

/** 3 pieces per slot, so a character with n slots has 3^n looks. */
export const totalLooks = (c: CharacterDef) => 3 ** c.slots.length;

/**
 * "Look 14 of 27": the position of a full outfit in the 3^n grid, reading the
 * slots as digits (first slot is the most significant). Null until every slot
 * is filled.
 */
export function lookNumber(c: CharacterDef, worn: Worn): number | null {
  let n = 0;
  for (const slot of c.slots) {
    const id = worn[slot];
    if (!id) return null;
    const idx = Number(id.replace(/\D/g, "")) - 1;
    if (!(idx >= 0 && idx < 3)) return null;
    n = n * 3 + idx;
  }
  return n + 1;
}

export const wornCount = (worn: Worn) => Object.values(worn).filter(Boolean).length;

/** The most specific combo the current outfit satisfies (list order wins). */
export const comboFor = (c: CharacterDef, worn: Worn): Combo | undefined =>
  c.combos.find((combo) =>
    Object.entries(combo.need).every(([slot, id]) => worn[slot as SlotType] === id)
  );

/** Distinct set ids an outfit draws from. */
export const setsInUse = (c: CharacterDef, worn: Worn): string[] => [
  ...new Set(
    Object.values(worn)
      .filter((id): id is string => Boolean(id))
      .map((id) => findPiece(c.id, id).set)
  ),
];

/** The hour-of-day look the page greets you with. */
export function lookForHour(hour: number): { picks: [number, number, number] | null; line: string } {
  if (hour >= 8 && hour < 15) return { picks: [2, 2, 2], line: "it is match kit weather" };
  if (hour >= 15 && hour < 19) return { picks: [1, 1, 1], line: "hoodie o’clock" };
  if (hour >= 19) return { picks: [3, 3, 3], line: "one last adventure before bed" };
  return { picks: null, line: "nobody is dressed yet" };
}

/**
 * Where a slot's drop target sits: the mean of its pieces' placements, so the
 * dashed outline lands where any piece of that kind would.
 */
export function slotAnchor(character: CharacterId, type: SlotType) {
  const ps = CHARACTERS[character].pieces.filter((p) => p.type === type).map((p) => pieceArt(character, p.id).slot);
  const mean = (k: "cx" | "cy" | "w") => ps.reduce((a, s) => a + s[k], 0) / ps.length;
  return { cx: mean("cx"), cy: mean("cy"), w: mean("w") };
}
