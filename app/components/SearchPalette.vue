<script setup lang="ts">
import type { Tool } from '~/utils/tools'
import type { Guide } from '~/utils/guides'

// Command palette: searches tools + guides, exposes quick actions, runs smart
// paste detection, and owns the global keyboard shortcuts. SSG-safe — the
// overlay renders client-only (ClientOnly + v-if) and the key listener is
// attached in onMounted.
const { open } = useSearchPalette()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { recent } = useRecent()
const { favorites } = useFavorites()
const { isDark, toggle: toggleTheme } = useTheme()
const { open: openShortcuts } = useShortcutsHelp()

const lc = computed(() => locale.value as 'en' | 'ru')
const query = ref('')
const selected = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

interface Row {
  id: string
  kind: 'tool' | 'guide' | 'action'
  icon: string
  label: string
  sub: string
  run: () => void
}

function navTo(path: string) {
  open.value = false
  navigateTo(path)
}

function toolRow(tl: Tool): Row {
  return {
    id: `t:${tl.slug}`,
    kind: 'tool',
    icon: tl.icon,
    label: tl[lc.value].name,
    sub: t(`categories.${tl.category}`),
    run: () => navTo(localePath(`/${tl.slug}`)),
  }
}

function guideRow(g: Guide): Row {
  return {
    id: `g:${g.slug}`,
    kind: 'guide',
    icon: g.icon,
    label: g[lc.value].h1,
    sub: g[lc.value].excerpt,
    run: () => navTo(localePath(`/guides/${g.slug}`)),
  }
}

function randomTool() {
  const tl = tools[Math.floor(Math.random() * tools.length)]
  navTo(localePath(`/${tl.slug}`))
}

interface ActionDef { key: string; icon: string; label: string; terms: string; run: () => void }
const actions = computed<ActionDef[]>(() => {
  const ru = lc.value === 'ru'
  return [
    { key: 'home', icon: '🏠', label: ru ? 'На главную' : 'Go to home', terms: 'home главная начало', run: () => navTo(localePath('/')) },
    { key: 'guides', icon: '📚', label: ru ? 'Открыть гайды' : 'Browse guides', terms: 'guides гайды блог articles статьи', run: () => navTo(localePath('/guides')) },
    { key: 'theme', icon: isDark.value ? '☀️' : '🌙', label: ru ? 'Переключить тему' : 'Toggle theme', terms: 'theme dark light тема тёмная светлая', run: () => { open.value = false; toggleTheme() } },
    { key: 'lang', icon: '🌐', label: ru ? 'Switch to English' : 'Переключить на русский', terms: 'language locale язык english русский ru en', run: () => navTo(switchLocalePath(ru ? 'en' : 'ru') || localePath('/')) },
    { key: 'shortcuts', icon: '⌨️', label: ru ? 'Горячие клавиши' : 'Keyboard shortcuts', terms: 'shortcuts keyboard горячие клавиши help справка', run: () => { open.value = false; openShortcuts.value = true } },
    { key: 'random', icon: '🎲', label: ru ? 'Случайный инструмент' : 'Random tool', terms: 'random surprise случайный удиви lucky', run: randomTool },
  ]
})

function actionRow(a: ActionDef): Row {
  return { id: `a:${a.key}`, kind: 'action', icon: a.icon, label: a.label, sub: '', run: a.run }
}

// prefix > substring > keyword hit.
function score(name: string, hay: string, q: string): number {
  if (!hay.includes(q)) return -1
  if (name.startsWith(q)) return 3
  if (name.includes(q)) return 2
  return 1
}

const rows = computed<Row[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    // Empty state: recent → favorites → popular tools.
    const slugs = [...new Set([...recent.value, ...favorites.value, ...POPULAR_SLUGS])]
    return slugs.map((s) => getTool(s)).filter((tl): tl is Tool => !!tl).slice(0, 7).map(toolRow)
  }
  const toolHits = tools
    .map((tl) => ({ tl, s: score(tl[lc.value].name.toLowerCase(), [tl[lc.value].name, tl.slug, ...tl[lc.value].keywords].join(' ').toLowerCase(), q) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((r) => toolRow(r.tl))
  const guideHits = guides
    .map((g) => ({ g, s: score(g[lc.value].h1.toLowerCase(), [g[lc.value].h1, g.slug, g[lc.value].excerpt, ...g[lc.value].keywords].join(' ').toLowerCase(), q) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((r) => guideRow(r.g))
  const actionHits = actions.value.filter((a) => a.label.toLowerCase().includes(q) || a.terms.includes(q)).map(actionRow)
  return [...toolHits, ...guideHits, ...actionHits]
})

// Smart paste: recognise the query as a JWT/JSON/URL/color/etc.
const detections = computed(() =>
  detectInput(query.value)
    .map((d) => ({ ...d, tool: getTool(d.slug) }))
    .filter((d): d is { kind: string; slug: string; tool: Tool } => !!d.tool),
)

// Section heading shown before the first row of each kind.
function groupHeading(i: number): string {
  const row = rows.value[i]
  if (i > 0 && rows.value[i - 1].kind === row.kind) return ''
  if (!query.value.trim() && row.kind === 'tool') return recent.value.length ? t('search.recent') : t('search.popular')
  if (row.kind === 'guide') return t('search.guidesGroup')
  if (row.kind === 'action') return t('search.actionsGroup')
  return t('search.toolsGroup')
}

watch(rows, () => {
  selected.value = 0
})

watch(open, async (v) => {
  if (!v) return
  query.value = ''
  selected.value = 0
  await nextTick()
  inputEl.value?.focus()
})

function go(slug: string) {
  navTo(localePath(`/${slug}`))
}

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null
  if (!node) return false
  const tag = node.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable
}

function onKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
    return
  }
  if (e.key === '/' && !open.value && !mod && !isTypingTarget(e.target)) {
    e.preventDefault()
    open.value = true
    return
  }
  if (!open.value) return
  const len = rows.value.length
  if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selected.value = len ? (selected.value + 1) % len : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selected.value = len ? (selected.value - 1 + len) % len : 0
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (rows.value.length) rows.value[selected.value]?.run()
    else if (detections.value.length) go(detections.value[0].slug)
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
          class="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
        >
          <div
            class="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            @click="open = false"
          />
          <div
            role="dialog"
            aria-modal="true"
            class="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900"
          >
            <!-- Search input -->
            <div class="flex items-center gap-2 border-b border-ink-200 px-4 dark:border-ink-800">
              <span class="text-ink-400" aria-hidden="true">🔎</span>
              <input
                ref="inputEl"
                v-model="query"
                type="text"
                :placeholder="t('search.placeholder')"
                class="h-12 w-full bg-transparent text-base outline-none placeholder:text-ink-400"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
              />
              <kbd class="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-400 dark:border-ink-700">esc</kbd>
            </div>

            <!-- Results -->
            <div class="max-h-[52vh] overflow-y-auto p-2">
              <!-- Smart paste: detected content type -->
              <template v-if="detections.length">
                <p class="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-accent">{{ t('detect.heading') }}</p>
                <ul class="mb-1 space-y-0.5">
                  <li v-for="d in detections" :key="d.slug">
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-100/70 dark:hover:bg-ink-800/60"
                      @click="go(d.slug)"
                    >
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-sm text-accent" aria-hidden="true">{{ d.tool.icon }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-medium">{{ t(`detect.${d.kind}`) }}</span>
                        <span class="block truncate text-xs text-ink-400">{{ d.tool[lc].name }}</span>
                      </span>
                      <span class="text-ink-300 dark:text-ink-600" aria-hidden="true">↵</span>
                    </button>
                  </li>
                </ul>
              </template>

              <ul v-if="rows.length" class="space-y-0.5">
                <template v-for="(row, i) in rows" :key="row.id">
                  <li
                    v-if="groupHeading(i)"
                    role="presentation"
                    class="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-400"
                  >
                    {{ groupHeading(i) }}
                  </li>
                  <li>
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left"
                      :class="i === selected ? 'bg-accent/10' : 'hover:bg-ink-100/70 dark:hover:bg-ink-800/60'"
                      @click="row.run()"
                      @mousemove="selected = i"
                    >
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-sm text-accent" aria-hidden="true">{{ row.icon }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-medium" :class="i === selected ? 'text-accent' : ''">{{ row.label }}</span>
                        <span v-if="row.sub" class="block truncate text-xs text-ink-400">{{ row.sub }}</span>
                      </span>
                      <span v-if="i === selected" class="text-ink-300 dark:text-ink-600" aria-hidden="true">↵</span>
                    </button>
                  </li>
                </template>
              </ul>
              <p v-else-if="!detections.length" class="px-2.5 py-6 text-center text-sm text-ink-400">{{ t('search.noResults') }}</p>
            </div>

            <!-- Hints -->
            <div class="flex items-center gap-4 border-t border-ink-200 px-4 py-2 text-[11px] text-ink-400 dark:border-ink-800">
              <span class="flex items-center gap-1"><kbd class="rounded bg-ink-100 px-1.5 py-0.5 dark:bg-ink-800">↑↓</kbd>{{ t('search.hintNav') }}</span>
              <span class="flex items-center gap-1"><kbd class="rounded bg-ink-100 px-1.5 py-0.5 dark:bg-ink-800">↵</kbd>{{ t('search.hintOpen') }}</span>
              <span class="flex items-center gap-1"><kbd class="rounded bg-ink-100 px-1.5 py-0.5 dark:bg-ink-800">esc</kbd>{{ t('search.hintClose') }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
