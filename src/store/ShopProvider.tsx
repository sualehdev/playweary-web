"use client";

/**
 * The basket, which character is selected, and the drawer.
 *
 * Server and first client render both start from the default state, so
 * hydration always matches; the saved state is read in an effect and merged in
 * with one `hydrate` action. localStorage may be unavailable (private mode,
 * blocked storage) — every access is wrapped and the page simply starts empty.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { CharacterId } from "@/content/characters";
import { initialShopState, ownedSets, shopReducer, type ShopState } from "./shop";

const KEY = "playweary:shop:v1";

type Api = {
  state: ShopState;
  isOwned: (setId: string) => boolean;
  add: (id: string, size: string, qty?: number) => void;
  setQty: (id: string, size: string, q: number) => void;
  clear: () => void;
  setCharacter: (c: CharacterId) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const ShopContext = createContext<Api | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(shopReducer, undefined, initialShopState);

  useEffect(() => {
    let saved = {};
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* unreadable or blocked: start from the defaults */
    }
    dispatch({ type: "hydrate", state: saved });
  }, []);

  useEffect(() => {
    // Do not overwrite what is saved with the defaults before it has been read.
    if (!state.hydrated) return;
    try {
      const { cart, character } = state;
      localStorage.setItem(KEY, JSON.stringify({ cart, character }));
    } catch {
      /* nothing to keep it in: the basket still works for this visit */
    }
  }, [state.hydrated, state.cart, state.character]); // eslint-disable-line react-hooks/exhaustive-deps

  const setQty = useCallback((id: string, size: string, q: number) => dispatch({ type: "qty", id, size, q }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const add = useCallback((id: string, size: string, qty?: number) => dispatch({ type: "add", id, size, qty }), []);
  const setCharacter = useCallback((character: CharacterId) => dispatch({ type: "character", character }), []);
  const openDrawer = useCallback(() => dispatch({ type: "drawer", open: true }), []);
  const closeDrawer = useCallback(() => dispatch({ type: "drawer", open: false }), []);

  const owned = useMemo(() => ownedSets(), []);
  const api = useMemo<Api>(
    () => ({
      state,
      isOwned: (setId) => owned.has(setId),
      add,
      setQty,
      clear,
      setCharacter,
      openDrawer,
      closeDrawer,
    }),
    [state, owned, add, setQty, clear, setCharacter, openDrawer, closeDrawer]
  );

  return <ShopContext.Provider value={api}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
