import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  jsonLd?: object;
}

const SEOHead = ({
  title = 'Lumi - Plataforma de Gestão para Profissionais de Beleza',
  description = 'Gerencie clientes, agenda, contratos e finanças em uma plataforma elegante. Economize 10+ horas por semana.',
  keywords = 'gestão para maquiadores, agenda de beleza, sistema para profissionais de beleza',
  image = 'https://lumihub.lovable.app/og-image.png',
  url = 'https://lumihub.lovable.app',
  type = 'website',
  noindex = false,
  jsonLd,
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title.length > 60 ? title.slice(0, 57) + '...' : title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Primary Meta Tags
    updateMetaTag('description', description.length > 160 ? description.slice(0, 157) + '...' : description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);

    // Twitter
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Add JSON-LD if provided
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo="dynamic"]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'dynamic');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, image, url, type, noindex, jsonLd]);

  return null;
};

export default SEOHead;
