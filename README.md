# DevTools — free, private, browser-based developer tools

A static (SSG) collection of fast developer utilities. Every tool runs **100% in
the browser** — no backend, nothing uploaded — which is both a privacy feature
and the reason hosting is cheap/free and pages are instant.

## Stack

- **Nuxt 4** in SSG mode (`nuxt generate`) — Google receives fully-rendered HTML.
- **Tailwind CSS v3** (`@nuxtjs/tailwindcss`) for a small, consistent design system.
- **@nuxtjs/sitemap** + **@nuxtjs/robots** — auto-generated, i18n-aware `sitemap_index.xml` / `robots.txt`.
- **@nuxtjs/i18n** — bilingual **ru (default, no prefix)** + **en (`/en/…`)**, with hreflang, per-locale canonical and `og:locale`.
- Per-page JSON-LD (`SoftwareApplication` + `BreadcrumbList` + `FAQPage`) for rich results.
- Tool libs: `cronstrue`, `cron-parser` (cron tool only). Everything else is dependency-free.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run generate     # static build -> .output/public
npx serve .output/public   # preview the static output
```

> **macOS note:** the `dev` script is `TMPDIR=/tmp nuxt dev` on purpose. Nuxt's
> dev server (vite-node) opens a unix socket under `$TMPDIR`. The default macOS
> `/var/folders/…` path can exceed the OS unix-socket path limit (~104 bytes),
> which truncates the socket path and produces
> `connect ENOENT …/nuxt-vite-node-*.sock` → HTTP 500. Pointing `TMPDIR` at the
> short `/tmp` path avoids it. (`npm run generate` is unaffected — it doesn't use
> the socket.) On Windows, drop the `TMPDIR=/tmp ` prefix.

## Project structure (Nuxt 4 — app code lives in `app/`)

```
nuxt.config.ts            # SSG, sitemap, robots, tailwind, inline theme script
tailwind.config.js
public/favicon.svg
app/
  app.vue
  assets/css/main.css     # design system: .card .btn-primary .field .textarea-code .prose-tool ...
  layouts/default.vue     # header, footer (auto-lists tools), dark-mode toggle, titleTemplate
  composables/
    useToolSeo.ts          # title/meta/canonical + JSON-LD for every tool page
    useTheme.ts
  components/
    ToolPage.vue           # wrapper: breadcrumb, H1, FAQ accordions, "See also" — calls useToolSeo
    CopyButton.vue
    JsonTree.vue
  utils/
    site.ts                # SITE_URL / SITE_NAME — single source of truth
    tools.ts               # the tool registry (drives nav, SEO, internal links)
  pages/
    index.vue              # homepage grid by category
    <slug>.vue             # one file per tool
```

## Add a new tool (the whole flow)

1. Add an entry to `app/utils/tools.ts` with `slug`, `category` (key), `icon`,
   `related`, and **both `en` and `ru`** blocks (`name`, `title`, `description`,
   `keywords`). This alone wires navigation, the footer, SEO metadata and links.
2. Create `app/pages/<slug>.vue` using the bilingual pattern (see
   `json-formatter.vue` as the reference):

   ```vue
   <script setup lang="ts">
   import type { FaqItem } from '~/composables/useToolSeo'
   const { t, locale } = useI18n()
   const localePath = useLocalePath()
   const faqEn: FaqItem[] = [{ q: '…', a: '…' }]
   const faqRu: FaqItem[] = [{ q: '…', a: '…' }]
   const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
   // tool-specific labels: const ui = computed(() => locale.value === 'ru' ? {…} : {…})
   </script>
   <template>
     <ToolPage slug="<slug>" :faq="faq">
       <!-- tool UI: common verbs via t('common.*'); tool labels via ui.* -->
       <template #content>
         <template v-if="locale === 'ru'"> <!-- RU copy --> </template>
         <template v-else> <!-- EN copy --> </template>
       </template>
     </ToolPage>
   </template>
   ```

3. `ToolPage` handles `<title>`, meta and all JSON-LD automatically;
   `useLocaleHead()` in the layout handles canonical + hreflang.

## Localization (i18n)

- Shared UI strings live in `i18n/locales/{ru,en}.json` (`common.*`, `home.*`,
  `tool.*`, `categories.*`).
- Per-tool SEO copy is in the registry (`en`/`ru` blocks); per-tool FAQ and
  long-form content stay in the page (two arrays + two `#content` blocks).
- Inside `#content`, internal links **must** use `:to="localePath('/slug')"` so
  English pages link to `/en/…`.
- Switch the default language or add a locale in `nuxt.config.ts` → `i18n`.

### Client-side / SSG gotcha

Pages are prerendered in Node, then hydrated in the browser. Only touch
`window`/`document`/`navigator`/`localStorage` inside event handlers, `onMounted`,
or behind `if (import.meta.client)`. Anything based on the current time or
randomness must be produced client-side (init to a placeholder, fill in
`onMounted`, wrap in `<ClientOnly>`) to avoid hydration mismatches.

## Deploy — Cloudflare Pages (Git integration, auto-deploy on push)

This repo is preconfigured for Cloudflare Pages:

- `wrangler.toml` — `pages_build_output_dir = ".output/public"`
- `.node-version` — pins Node 22 for the Pages build
- `public/_headers` — long-cache headers for hashed `/_nuxt/*` assets

One-time setup:

1. **Set your real domain** in `app/utils/site.ts` (`SITE_URL`) and commit.
   Sitemap, robots, canonical and hreflang all derive from it.
2. Push this repo to GitHub (or GitLab).
3. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
   pick the repo, then set:
   - **Framework preset:** Nuxt.js (or "None")
   - **Build command:** `npm run generate`
   - **Build output directory:** `.output/public`
   - Node version is taken from `.node-version` (22).
4. Save & Deploy. Every push to the production branch now auto-builds and deploys;
   pull requests get preview deployments.

After the first deploy:

- Add your custom domain in the Pages project (**Custom domains**).
- Submit `https://yourdomain.com/sitemap_index.xml` in Google Search Console.
