import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

export const SEO = ({
  title = 'Khaos Kontrol - CRM para Maquiadoras',
  description = 'Sistema completo de gestão para profissionais de maquiagem. Agenda, contratos, clientes e IA em um só lugar.',
  image = 'https://khaoskontrol.com.br/og-image.png',
  url = 'https://khaoskontrol.com.br',
  type = 'website',
}: SEOProps) => {
  const fullTitle = title.includes('Khaos Kontrol')
    ? title
    : `${title} | Khaos Kontrol`

  return (
    <Helmet>
      {}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content="Khaos Kontrol" />

      {}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Portuguese" />
      <meta name="author" content="Khaos Kontrol" />
      <link rel="canonical" href={url} />
    </Helmet>
  )
}
