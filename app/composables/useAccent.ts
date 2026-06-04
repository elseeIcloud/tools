// User-selectable accent color. Stored in localStorage as the full preset
// object {id, accent, hover}; the pre-paint inline script in nuxt.config reads
// it and sets the CSS vars before render (no flash). SSG-safe: the CSS :root
// default applies on the server; JS only overrides after mount.
export interface Accent {
  id: string
  /** "r g b" channels for --accent */
  accent: string
  /** "r g b" channels for --accent-hover */
  hover: string
}

export const ACCENTS: Accent[] = [
  { id: 'blue', accent: '91 140 255', hover: '61 116 255' },
  { id: 'indigo', accent: '99 102 241', hover: '79 70 229' },
  { id: 'violet', accent: '139 92 246', hover: '124 58 237' },
  { id: 'cyan', accent: '6 182 212', hover: '8 145 178' },
  { id: 'emerald', accent: '16 185 129', hover: '5 150 105' },
  { id: 'amber', accent: '245 158 11', hover: '217 119 6' },
  { id: 'orange', accent: '249 115 22', hover: '234 88 12' },
  { id: 'rose', accent: '244 63 94', hover: '225 29 72' },
]

const STORAGE_KEY = 'devtools:accent'

export function useAccent() {
  const currentId = useState('accent-id', () => 'blue')
  const ready = useState('accent-ready', () => false)

  function apply(a: Accent) {
    const s = document.documentElement.style
    s.setProperty('--accent', a.accent)
    s.setProperty('--accent-hover', a.hover)
  }

  onMounted(() => {
    if (ready.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        const found = ACCENTS.find((x) => x.id === saved?.id)
        if (found) {
          currentId.value = found.id
          apply(found)
        }
      }
    } catch {
      /* ignore unavailable storage */
    }
    ready.value = true
  })

  function setAccent(id: string) {
    const a = ACCENTS.find((x) => x.id === id)
    if (!a) return
    currentId.value = id
    apply(a)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a))
    } catch {
      /* ignore */
    }
  }

  return { accents: ACCENTS, currentId, setAccent }
}
