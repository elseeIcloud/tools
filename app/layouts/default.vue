<script setup lang="ts">
const { isDark, toggle } = useTheme()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const groups = toolsByCategory()

// hreflang alternates, canonical, og:locale and <html lang> for every page.
const i18nHead = useLocaleHead({ seo: true })

// Append the site name to every page title.
useHead({
  titleTemplate: (title?: string) =>
    title ? `${title} | ${SITE_NAME}` : SITE_NAME,
  htmlAttrs: computed(() => ({
    lang: i18nHead.value.htmlAttrs?.lang,
    dir: i18nHead.value.htmlAttrs?.dir,
  })),
  link: computed(() => i18nHead.value.link ?? []),
  meta: computed(() => i18nHead.value.meta ?? []),
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 border-b border-ink-200 bg-ink-50/85 backdrop-blur dark:border-ink-800 dark:bg-ink-950/85">
      <div class="container-tool flex h-14 items-center justify-between">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2 font-bold tracking-tight">
          <span class="grid h-7 w-7 place-items-center rounded-lg bg-accent font-mono text-sm text-white">&lt;/&gt;</span>
          <span>{{ SITE_NAME }}</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <LocaleSwitcher />
          <button
            type="button"
            class="btn-ghost !px-2.5"
            :aria-label="isDark ? 'Light theme' : 'Dark theme'"
            @click="toggle"
          >
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="mt-16 border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
      <div class="container-tool py-10">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="g in groups" :key="g.category">
            <h3 class="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">{{ t(`categories.${g.category}`) }}</h3>
            <ul class="space-y-2 text-sm">
              <li v-for="tool in g.items" :key="tool.slug">
                <NuxtLink :to="localePath(`/${tool.slug}`)" class="text-ink-600 hover:text-accent dark:text-ink-400">{{ tool[locale].name }}</NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-10 border-t border-ink-200 pt-6 dark:border-ink-800">
          <div class="flex flex-col items-center justify-between gap-3 text-sm text-ink-500 dark:text-ink-400 sm:flex-row">
            <p>{{ SITE_NAME }} — {{ t('footer.tagline') }}</p>
            <nav class="flex items-center gap-4">
              <NuxtLink :to="localePath('/about')" class="hover:text-accent">{{ t('footer.about') }}</NuxtLink>
              <NuxtLink :to="localePath('/privacy')" class="hover:text-accent">{{ t('footer.privacy') }}</NuxtLink>
            </nav>
          </div>
          <p class="mt-3 text-center text-xs text-ink-400 sm:text-left">{{ t('footer.privacyNote') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>
