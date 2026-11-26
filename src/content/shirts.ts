/**
 * The shirt photos shown in the gallery (public/shirts, made by `npm run shirts`
 * from the designer's PW folder). Each character has three shirts, one per variant. Sizes are the source image sizes, so the page can reserve the space.
 */

import type { CharacterId } from "./characters";

export type Shirt = {
  id: string;
  alt: string;
};

export const SHIRT_SIZE: Record<CharacterId, { w: number; h: number }> = {
  boy: { w: 1101, h: 1429 },
  girl: { w: 1402, h: 1122 },
};

export const SHIRTS: Record<CharacterId, Shirt[]> = {
  // Order matters: shirt n is the photo for variant n, i.e. the same set the variant tile shows.
  boy: [
    { id: "boy-blue", alt: "Navy Playweary long-sleeve shirt with a boy character in a blue hoodie and grey shorts" },
    { id: "boy-teal", alt: "Navy Playweary long-sleeve shirt with a boy character in a teal and lime sports kit" },
    { id: "boy-safari", alt: "Navy Playweary long-sleeve shirt with a boy character in a safari outfit" },
  ],
  girl: [
    { id: "girl-pink", alt: "Pink Playweary long-sleeve shirt with a girl character in a floral dress and sun hat" },
    { id: "girl-green", alt: "Pink Playweary long-sleeve shirt with a girl character in a green top, wide jeans and a bucket hat" },
    { id: "girl-blue", alt: "Pink Playweary long-sleeve shirt with a girl character in a blue top and denim skirt" },
  ],
};

export const shirtSrc = (id: string, w: 640 | 1100) => `/shirts/${id}-${w}.webp`;
