// Shared open-state for the command palette, so the header trigger button and
// the SearchPalette component (mounted once in the layout) stay in sync.
export function useSearchPalette() {
  const open = useState('search-palette-open', () => false)
  return { open }
}
