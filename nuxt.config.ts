// https://nuxt.com/docs/api/configuration/nuxt-config
import { SITE_URL, SITE_NAME } from './app/utils/site'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@nuxtjs/robots'],

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
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Apply saved/preferred theme before paint to avoid a flash of light mode.
      script: [
        {
          innerHTML:
            "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()",
          tagPosition: 'head',
        },
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
