// Recently used tools, persisted in localStorage. Same SSG-safe pattern as
// useFavorites: state starts empty on the server and the first client render
// (so hydration matches), then the saved list loads in onMounted. A tool page
// calls record() from its own onMounted, which runs after this loader, so the
// in-memory list is already populated when the new visit is prepended.
const STORAGE_KEY = 'devtools:recent'
const MAX = 6

export function useRecent() {
  const recent = useState<string[]>('recent', () => [])
  const ready = useState('recent-ready', () => false)

  onMounted(() => {
    if (ready.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) recent.value = JSON.parse(raw)
    } catch {
      /* ignore malformed / unavailable storage */
    }
    ready.value = true
  })

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.value))
    } catch {
      /* ignore */
    }
  }

  // Move slug to the front, dedupe, cap at MAX.
  function record(slug: string) {
    recent.value = [slug, ...recent.value.filter((s) => s !== slug)].slice(0, MAX)
    persist()
  }

  return { recent, ready, record }
}
