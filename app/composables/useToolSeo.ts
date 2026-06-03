// Centralized, locale-aware SEO for every tool page. A page only needs:
//   <ToolPage slug="json-formatter" :faq="faq"> ... </ToolPage>
// and ToolPage calls this composable — so title/meta and the JSON-LD
// structured data (SoftwareApplication + BreadcrumbList + FAQPage) are always
// consistent and translated. Canonical + hreflang + og:locale are owned by
// useLocaleHead() in the default layout (so they are not duplicated here).
//
// Each locale is a separate route (/slug for ru, /en/slug for en), so switching
// language navigates and re-runs setup — reading locale.value once is correct.

export interface FaqItem {
  q: string
  a: string
}

export function useToolSeo(slug: string, opts: { faq?: FaqItem[] } = {}) {
  const tool = getTool(slug)
  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  if (!tool) {
    useSeoMeta({ title: 'Tool not found' })
    return { tool: undefined, meta: undefined, related: [] as typeof tool[] }
  }

  const m = tool[locale.value as 'en' | 'ru']
  const url = SITE_URL + localePath('/' + slug)
  const homeUrl = SITE_URL + localePath('/')

  useSeoMeta({
    title: m.title,
    description: m.description,
    ogTitle: m.title,
    ogDescription: m.description,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: m.title,
    twitterDescription: m.description,
  })

  const ld: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: m.name,
      description: m.description,
      url,
      inLanguage: locale.value,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('tool.home'), item: homeUrl },
        { '@type': 'ListItem', position: 2, name: m.name, item: url },
      ],
    },
  ]

  if (opts.faq?.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale.value,
      mainEntity: opts.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  useHead({
    meta: [{ name: 'keywords', content: m.keywords.join(', ') }],
    script: ld.map((node) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(node),
    })),
  })

  return { tool, meta: m, related: getRelated(slug) }
}
