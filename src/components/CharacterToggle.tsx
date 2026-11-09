"use client";

import { CHARACTERS, CHARACTER_IDS } from "@/content/characters";
import { useShop } from "@/store/ShopProvider";

/** Boy / Girl switch. The choice is shared by the bench, the shop and the album. */
export default function CharacterToggle({ label = "Who are we dressing?" }: { label?: string }) {
  const { state, setCharacter } = useShop();
  return (
    <div className="charToggle" role="group" aria-label={label}>
      {CHARACTER_IDS.map((c) => (
        <button
          key={c}
          type="button"
          className="chip"
          aria-pressed={c === state.character}
          onClick={() => c !== state.character && setCharacter(c)}
        >
          {CHARACTERS[c].label}
        </button>
      ))}
    </div>
  );
}
