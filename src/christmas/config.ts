/**
 * Christmas layer settings. Everything festive lives in src/christmas/ so it
 * can be removed by deleting that folder and the lines tagged `XMAS`
 * (see src/app/layout.tsx and src/app/page.tsx).
 *
 * Switch it off without code: set NEXT_PUBLIC_XMAS=off and redeploy.
 * It also ends by itself on XMAS_END.
 */

/** First moment the decorations are gone (local time). */
export const XMAS_END = "2026-12-27T00:00:00";

export const KITS = {
  girl: { href: "/products/girl-shirt-kit", label: "Shop the girl kit" },
  boy: { href: "/products/boy-shirt-kit", label: "Shop the boy kit" },
} as const;

/** localStorage keys */
export const POPUP_KEY = "pw:xmas-popup";
export const BANNER_KEY = "pw:xmas-banner";

/** Pure, so it can be tested: is the Christmas layer on at `now`? */
export function isXmasActive(now: Date, flag: string | undefined = process.env.NEXT_PUBLIC_XMAS): boolean {
  if (flag === "off") return false;
  return now.getTime() < new Date(XMAS_END).getTime();
}

/** Routes with no decoration at all: keep the buying steps calm. */
export const QUIET_ROUTES = ["/checkout", "/thank-you"];
/** Routes where the gift pop-up may appear on its own. */
export const POPUP_ROUTES = (path: string) => path === "/" || path.startsWith("/products/");
