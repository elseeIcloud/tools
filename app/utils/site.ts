// Single source of truth for site identity.
// Used by nuxt.config (sitemap/robots/canonical base) and the SEO composable.
//
// Production origin — sitemap, robots, canonical and hreflang all derive from it.
// Swap this for your custom domain when you attach one (then commit + push).
export const SITE_URL = 'https://tools.dima-zavgorodniy1.workers.dev'
export const SITE_NAME = 'DevTools'
export const SITE_TAGLINE = 'Free, private, browser-based developer tools'
// Contact address shown on the About & Privacy pages.
export const SITE_CONTACT_EMAIL = 'dima.zavgorodniy1@gmail.com'
export const SITE_DESCRIPTION =
  'A fast, free collection of developer tools — JSON formatter, Base64, JWT decoder, cron generator and more. Everything runs in your browser; your data is never uploaded.'

// --- Search Console + Analytics (injected in nuxt.config app.head when set) ---
// Google Search Console: the token from the "HTML tag" verification method,
// i.e. the `content` value of <meta name="google-site-verification" ...>.
// Leave empty to inject nothing.
export const GOOGLE_SITE_VERIFICATION = '_leGWHotCX9VbTAkGGXycDQ8KphVlcB8JDju83SLS5Q'
// Cloudflare Web Analytics beacon token (cookieless, privacy-friendly). From
// the Cloudflare dashboard → Web Analytics → your site → JS snippet `token`.
// Leave empty to inject nothing.
export const CF_ANALYTICS_TOKEN = ''
