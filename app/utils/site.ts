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
