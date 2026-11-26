"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

/** The footer link that reopens the cookie choices (also the "do not share" opt-out). */
export default function CookieSettingsLink() {
  return (
    <button type="button" className="fLinkBtn" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Cookie settings
    </button>
  );
}
