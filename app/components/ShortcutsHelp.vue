<script setup lang="ts">
// Keyboard-shortcuts reference modal. OS-aware (⌘ vs Ctrl). Opened by "?" or
// the footer link; SSG-safe — overlay is ClientOnly + v-if and the global key
// listener is attached in onMounted.
const { open } = useShortcutsHelp()
const { t } = useI18n()
const { modKey } = usePlatform()

interface Row {
  label: string
  // Each row lists one or more key combos; combos are alternatives ("or"),
  // keys within a combo are shown as adjacent caps.
  combos: string[][]
}

const sections = computed<{ title: string; rows: Row[] }[]>(() => [
  {
    title: t('shortcuts.search'),
    rows: [
      { label: t('shortcuts.openSearch'), combos: [[modKey.value, 'K'], ['/']] },
    ],
  },
  {
    title: t('shortcuts.inPalette'),
    rows: [
      { label: t('shortcuts.navigate'), combos: [['↑', '↓']] },
      { label: t('shortcuts.openSelected'), combos: [['↵']] },
      { label: t('shortcuts.close'), combos: [['Esc']] },
    ],
  },
  {
    title: t('shortcuts.general'),
    rows: [
      { label: t('shortcuts.showHelp'), combos: [['?']] },
    ],
  },
])

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null
  if (!node) return false
  const tag = node.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === '?' && !isTypingTarget(e.target)) {
    e.preventDefault()
    open.value = !open.value
    return
  }
  if (open.value && e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-75 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open"
          class="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
        >
          <div class="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" @click="open = false" />
          <div
            role="dialog"
            aria-modal="true"
            :aria-label="t('shortcuts.title')"
            class="relative w-full max-w-md overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900"
          >
            <div class="flex items-center justify-between border-b border-ink-200 px-5 py-3.5 dark:border-ink-800">
              <h2 class="flex items-center gap-2 font-semibold">
                <span aria-hidden="true">⌨️</span> {{ t('shortcuts.title') }}
              </h2>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                :aria-label="t('shortcuts.close')"
                @click="open = false"
              >✕</button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto px-5 py-4">
              <div v-for="(sec, si) in sections" :key="si" :class="si > 0 ? 'mt-5' : ''">
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">{{ sec.title }}</p>
                <ul class="space-y-2">
                  <li v-for="(row, ri) in sec.rows" :key="ri" class="flex items-center justify-between gap-4">
                    <span class="text-sm text-ink-700 dark:text-ink-200">{{ row.label }}</span>
                    <span class="flex items-center gap-1.5">
                      <template v-for="(combo, ci) in row.combos" :key="ci">
                        <span v-if="ci > 0" class="text-xs text-ink-400">{{ t('shortcuts.or') }}</span>
                        <span class="flex items-center gap-0.5">
                          <kbd
                            v-for="(k, ki) in combo"
                            :key="ki"
                            class="min-w-[1.6rem] rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-center text-xs font-medium text-ink-600 shadow-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
                          >{{ k }}</kbd>
                        </span>
                      </template>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
