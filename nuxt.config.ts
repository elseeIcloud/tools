// https://nuxt.com/docs/api/configuration/nuxt-config
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, GOOGLE_SITE_VERIFICATION, CF_ANALYTICS_TOKEN } from './app/utils/site'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@nuxtjs/robots', '@vite-pwa/nuxt'],

  // Installable PWA + offline. autoUpdate keeps the SW fresh on each deploy;
  // navigations use NetworkFirst so online users always get the latest HTML and
  // offline falls back to previously visited pages (tools run client-side).
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'DevTools — Free, private developer tools',
      short_name: 'DevTools',
      description: SITE_DESCRIPTION,
      lang: 'ru',
      theme_color: '#0b1020',
      background_color: '#0b1020',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,svg,woff2,ico}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages', expiration: { maxEntries: 120 } },
        },
        {
          urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'assets', expiration: { maxEntries: 200 } },
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  // IMPORTANT: change SITE_URL in app/utils/site.ts to your real production
  // domain before deploy. Sitemap, robots.txt and canonical URLs derive from it.
  site: {
    url: SITE_URL,
    name: SITE_NAME,
  },

  // Static generation (SSG). crawlLinks discovers every tool page linked
  // from the homepage, so Google receives fully-rendered HTML.
  // `preset: 'static'` is explicit so Cloudflare's build env does NOT auto-switch
  // Nitro to the SSR `cloudflare-module` preset — we deploy pure static assets.
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/', '/en'],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0b1020' },
        // Default social-share preview image (absolute URL). Per-page og:title /
        // og:description are set by the SEO composables; this supplies the image.
        { property: 'og:image', content: `${SITE_URL}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: SITE_NAME },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${SITE_URL}/og.png` },
        // Google Search Console ownership verification (only when configured).
        ...(GOOGLE_SITE_VERIFICATION
          ? [{ name: 'google-site-verification', content: GOOGLE_SITE_VERIFICATION }]
          : []),
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        // Ensure the manifest link is in the prerendered HTML (the PWA module's
        // own injection runs client-side only, so it would be missing on SSG).
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      // Apply saved/preferred theme before paint to avoid a flash of light mode.
      script: [
        {
          innerHTML:
            "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()",
          tagPosition: 'head',
        },
        // Cloudflare Web Analytics beacon — cookieless, loaded only when a token
        // is set. Tool data still never leaves the browser; this only records
        // aggregate page views.
        ...(CF_ANALYTICS_TOKEN
          ? [{
              src: 'https://static.cloudflareinsights.com/beacon.min.js',
              defer: true,
              'data-cf-beacon': JSON.stringify({ token: CF_ANALYTICS_TOKEN }),
              tagPosition: 'bodyClose' as const,
            }]
          : []),
      ],
    },
  },

  sitemap: {
    // exclude nothing for now; all prerendered routes are indexable
  },

  robots: {
    // allow all crawlers; the module appends the Sitemap reference automatically
    allow: ['/'],
  },

  // Russian is the default (served at the root with no prefix); English lives
  // under /en. @nuxtjs/sitemap auto-detects this and emits hreflang alternates.
  i18n: {
    // Absolute base for hreflang + canonical SEO tags (useLocaleHead).
    baseUrl: SITE_URL,
    strategy: 'prefix_except_default',
    defaultLocale: 'ru',
    locales: [
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    langDir: 'locales',
    detectBrowserLanguage: false,
    bundle: { optimizeTranslationDirective: false },
  },
})
