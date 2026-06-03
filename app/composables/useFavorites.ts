// Favorite tools, persisted in localStorage. SSG-safe: state starts empty on
// the server AND on the first client render (so hydration matches), then the
// saved list is loaded in onMounted. Any UI that reflects favorites either
// tolerates the empty-first-render (a star flips after mount) or is wrapped in
// <ClientOnly> (e.g. the homepage "Favorites" section).
const STORAGE_KEY = 'devtools:favorites'

export function useFavorites() {
  const favorites = useState<string[]>('favorites', () => [])
  const ready = useState('favorites-ready', () => false)

  onMounted(() => {
    if (ready.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) favorites.value = JSON.parse(raw)
    } catch {
      /* ignore malformed / unavailable storage */
    }
    ready.value = true
  })

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
    } catch {
      /* ignore */
    }
  }

  function isFavorite(slug: string) {
    return favorites.value.includes(slug)
  }

  function toggle(slug: string) {
    const i = favorites.value.indexOf(slug)
    if (i >= 0) favorites.value.splice(i, 1)
    else favorites.value.push(slug)
    persist()
  }

  return { favorites, ready, isFavorite, toggle }
}
