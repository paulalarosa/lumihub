import { Helmet } from 'react-helmet-async'

interface MetaTagsProps {
  title?: string
  description?: string
  image?: string
}

export function MetaTags({
  title,
  description = 'Plataforma de gestão para profissionais de beleza.',
  image = '/og-image.png',
}: MetaTagsProps) {
  const defaultTitle = 'KHAOS KONTROL | System'
  const pageTitle = title ? `${title} | KHAOS KONTROL` : defaultTitle

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />

      {}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  )
}
