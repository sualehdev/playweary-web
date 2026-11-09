/**
 * Basket as a pure reducer, so it can be tested without React.
 * `ShopProvider` wires it to React state and localStorage.
 *
 * A line is one kit in one size: the same kit in two sizes is two lines.
 * Every kit ships with all of its character's sets, so on the bench every
 * piece is always available.
 */

import { type CharacterId, ALL_SETS } from "@/content/characters";
import { productById, sizeById } from "@/content/products";

export type CartLine = { id: string; size: string; q: number };

export type ShopState = {
  cart: CartLine[];
  character: CharacterId;
  drawerOpen: boolean;
  /** False until saved state has been read, so defaults never overwrite it. */
  hydrated: boolean;
};

export type ShopAction =
  | { type: "add"; id: string; size: string; qty?: number }
  /** Set a line's quantity; zero or less removes it. */
  | { type: "qty"; id: string; size: string; q: number }
  | { type: "clear" }
  | { type: "hydrate"; state: Partial<Pick<ShopState, "cart" | "character">> }
  | { type: "character"; character: CharacterId }
  | { type: "drawer"; open: boolean };

export const MAX_QTY = 20;

export const initialShopState = (): ShopState => ({
  cart: [],
  character: "boy",
  drawerOpen: false,
  hydrated: false,
});

const clampQty = (q: number) => Math.max(0, Math.min(MAX_QTY, Math.floor(q)));
const same = (l: CartLine, id: string, size: string) => l.id === id && l.size === size;

export function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case "add": {
      if (!productById(action.id) || !sizeById(action.size)) return state;
      const qty = action.qty && action.qty > 0 ? action.qty : 1;
      const has = state.cart.some((l) => same(l, action.id, action.size));
      const cart = has
        ? state.cart.map((l) => (same(l, action.id, action.size) ? { ...l, q: clampQty(l.q + qty) } : l))
        : [...state.cart, { id: action.id, size: action.size, q: clampQty(qty) }];
      return { ...state, cart };
    }
    case "qty": {
      const q = clampQty(action.q);
      const cart =
        q === 0
          ? state.cart.filter((l) => !same(l, action.id, action.size))
          : state.cart.map((l) => (same(l, action.id, action.size) ? { ...l, q } : l));
      return { ...state, cart };
    }
    case "clear":
      return { ...state, cart: [] };
    case "hydrate": {
      // Saved baskets from an older catalogue simply drop out.
      const cart = (action.state.cart ?? state.cart)
        .filter((l) => productById(l.id) && sizeById(l.size) && Number.isInteger(l.q) && l.q > 0)
        .map((l) => ({ id: l.id, size: l.size, q: clampQty(l.q) }));
      const saved = action.state.character;
      return {
        ...state,
        cart,
        character: saved === "boy" || saved === "girl" ? saved : state.character,
        hydrated: true,
      };
    }
    case "character":
      return { ...state, character: action.character };
    case "drawer":
      return { ...state, drawerOpen: action.open };
  }
}

export const cartCount = (cart: CartLine[]) => cart.reduce((n, l) => n + l.q, 0);

export const cartTotal = (cart: CartLine[]) =>
  cart.reduce((sum, l) => sum + (productById(l.id)?.price ?? 0) * l.q, 0);

/** Set ids you can dress with: every kit includes all of its sets. */
export const ownedSets = (): Set<string> => new Set(ALL_SETS.map((s) => s.id));
