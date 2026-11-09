/** Site-wide identity. Set NEXT_PUBLIC_SITE_URL in production to override the fallback. */

export const SITE_NAME = "Playweary";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playweary.com";
