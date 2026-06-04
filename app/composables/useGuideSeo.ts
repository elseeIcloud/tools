// Centralized, locale-aware SEO for every guide page. A guide page only needs:
//   <GuidePage slug="what-is-jwt" :faq="faq"> ... </GuidePage>
// and GuidePage calls this composable — so title/meta and the JSON-LD
// (BlogPosting + BreadcrumbList + optional FAQPage) stay consistent and
// translated. Canonical + hreflang + og:locale are owned by useLocaleHead() in
// the default layout (so they are not duplicated here).

import type { FaqItem } from '~/composables/useToolSeo'

export function useGuideSeo(slug: string, opts: { faq?: FaqItem[] } = {}) {
  const guide = getGuide(slug)
  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  if (!guide) {
    useSeoMeta({ title: 'Guide not found' })
    return { guide: undefined, meta: undefined, tools: [], relatedGuides: [] }
  }

  const m = guide[locale.value as 'en' | 'ru']
  const url = SITE_URL + localePath('/guides/' + slug)
  const homeUrl = SITE_URL + localePath('/')
  const guidesUrl = SITE_URL + localePath('/guides')

  useSeoMeta({
    title: m.title,
    description: m.description,
    ogTitle: m.title,
    ogDescription: m.description,
    ogType: 'article',
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: m.title,
    twitterDescription: m.description,
    articlePublishedTime: guide.date,
    articleModifiedTime: guide.updated ?? guide.date,
  })

  const ld: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: m.h1,
      description: m.description,
      url,
      mainEntityOfPage: url,
      inLanguage: locale.value,
      datePublished: guide.date,
      dateModified: guide.updated ?? guide.date,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('tool.home'), item: homeUrl },
        { '@type': 'ListItem', position: 2, name: t('guides.heading'), item: guidesUrl },
        { '@type': 'ListItem', position: 3, name: m.h1, item: url },
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

  return {
    guide,
    meta: m,
    tools: getGuideTools(slug),
    relatedGuides: getRelatedGuides(slug),
  }
}
