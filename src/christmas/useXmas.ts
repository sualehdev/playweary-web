"use client";

import { useSyncExternalStore } from "react";
import { isXmasActive } from "./config";

const noop = () => () => {};

/** True in the browser while the Christmas layer is on. False on the server, so hydration matches. */
export function useXmasActive() {
  return useSyncExternalStore(noop, () => isXmasActive(new Date()), () => false);
}
