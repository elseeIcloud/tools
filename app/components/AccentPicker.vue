<script setup lang="ts">
// Accent color picker: a header button (a dot in the current accent) opening a
// small swatch popover. The dot reads the CSS var so it is correct on SSR; the
// popover is client-only and closed by default.
const { accents, currentId, setAccent } = useAccent()
const { t } = useI18n()
const open = ref(false)

function pick(id: string) {
  setAccent(id)
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="btn-ghost !px-2.5"
      :aria-label="t('accent.label')"
      :title="t('accent.label')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="block h-4 w-4 rounded-full ring-1 ring-black/10" style="background: rgb(var(--accent))" aria-hidden="true" />
    </button>

    <ClientOnly>
      <div v-if="open">
        <div class="fixed inset-0 z-40" @click="open = false" />
        <div
          class="absolute right-0 z-50 mt-2 rounded-xl border border-ink-200 bg-white p-2 shadow-2xl dark:border-ink-700 dark:bg-ink-900"
          role="menu"
        >
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="a in accents"
              :key="a.id"
              type="button"
              role="menuitemradio"
              :aria-checked="currentId === a.id"
              :aria-label="a.id"
              :title="a.id"
              class="grid h-8 w-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-white transition-transform hover:scale-110 dark:ring-offset-ink-900"
              :class="currentId === a.id ? 'ring-ink-400 dark:ring-ink-300' : 'ring-transparent'"
              :style="{ background: `rgb(${a.accent})` }"
              @click="pick(a.id)"
            >
              <span v-if="currentId === a.id" class="text-xs font-bold text-white" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
