/**
 * Newsletter / waitlist sign-up. The seam is the same as checkout's: the form
 * validates and shows every state; sending the address somewhere is the one
 * thing to wire up. Nothing is stored or sent from here yet.
 */

export type SubscribeResult = { ok: true } | { ok: false; error: string };

/** Deliberately loose: one @, something either side, a dot in the domain. */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export async function subscribe(email: string): Promise<SubscribeResult> {
  if (!isEmail(email)) return { ok: false, error: "That does not look like an email address yet." };
  // TODO(launch): POST to the mailing-list provider here.
  return { ok: true };
}
