<script setup lang="ts">
// Language switcher. switchLocalePath() returns the URL of the CURRENT page in
// the target locale, so the user stays on the same tool when switching.
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { t } = useI18n()
</script>

<template>
  <div
    class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700"
    role="group"
    :aria-label="t('switcher.label')"
  >
    <NuxtLink
      v-for="l in locales"
      :key="l.code"
      :to="switchLocalePath(l.code)"
      class="rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors"
      :class="
        l.code === locale
          ? 'bg-accent text-white'
          : 'text-ink-500 hover:text-accent dark:text-ink-400'
      "
      :aria-current="l.code === locale ? 'true' : undefined"
      :title="l.name"
    >{{ l.code }}</NuxtLink>
  </div>
</template>
