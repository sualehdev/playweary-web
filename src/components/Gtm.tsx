import Script from "next/script";

/**
 * Google Tag Manager. Renders nothing unless NEXT_PUBLIC_GTM_ID is set, so dev
 * and preview builds stay untracked. Ad, analytics and Meta tags are added
 * inside the GTM container, not in code.
 *
 * Consent defaults to denied before the container loads. A saved choice (see
 * lib/consent) is applied straight away, and the cookie banner sends the
 * `consent update` when the shopper chooses.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GtmHead() {
  if (!GTM_ID) return null;
  const init = `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{var c=JSON.parse(localStorage.getItem('pw:consent')||'null');if(c&&c.v===1){var a=c.analytics?'granted':'denied',m=c.marketing?'granted':'denied';gtag('consent','update',{analytics_storage:a,ad_storage:m,ad_user_data:m,ad_personalization:m});}}catch(e){}
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`;
  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: init }} />
      <Script id="gtm-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />
    </>
  );
}

export function GtmNoscript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
