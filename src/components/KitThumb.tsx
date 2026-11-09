import type { CharacterId } from "@/content/art";
import Figure from "./Figure";

/** A kit's picture in the cart and the order summary: the character, dressed. */
export default function KitThumb({ character }: { character: CharacterId }) {
  return (
    <span className="kitThumb" aria-hidden="true">
      <Figure character={character} set={character === "girl" ? 2 : 1} />
    </span>
  );
}
