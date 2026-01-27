import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  noindex?: boolean;
  jsonLd?: object;
  // Enhanced SEO props
  breadcrumbs?: BreadcrumbItem[];
  faq?: FAQItem[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  priceRange?: string;
  // Local business
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessHours?: string;
  // Product/Service specific
  productPrice?: number;
  productCurrency?: string;
  productAvailability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

const SITE_NAME = 'Khaos Kontrol';
const DEFAULT_IMAGE = '/og-image.png';
const BASE_URL = 'https://khaos-kontrol.system';

const SEOHead = ({
  title = 'KHAOS KONTROL | System',
  description = 'Industrial Management System for Beauty Professionals.',
  keywords = 'management, crm, beauty, industrial, system',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  noindex = false,
  jsonLd,
  breadcrumbs,
  faq,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  priceRange,
  businessName,
  businessPhone,
  businessAddress,
  businessHours,
  productPrice,
  productCurrency = 'BRL',
  productAvailability = 'InStock',
}: SEOHeadProps) => {
  useEffect(() => {
    // Sanitize and truncate title/description
    const sanitizedTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
    const fullTitle = title.includes(SITE_NAME) ? sanitizedTitle : `${sanitizedTitle} | ${SITE_NAME}`;
    const sanitizedDescription = description.length > 160 ? description.slice(0, 157) + '...' : description;

    // Update document title
    document.title = fullTitle;

    // Helper function to update meta tags
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

    // Helper function to update link tags
    const updateLinkTag = (rel: string, href: string, additionalAttrs?: Record<string, string>) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (additionalAttrs) {
        Object.entries(additionalAttrs).forEach(([key, value]) => {
          link.setAttribute(key, value);
        });
      }
    };

    // Primary Meta Tags
    updateMetaTag('description', sanitizedDescription);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('author', author || SITE_NAME);
    updateMetaTag('rating', 'general');
    updateMetaTag('distribution', 'global');
    updateMetaTag('language', 'Portuguese');
    updateMetaTag('revisit-after', '7 days');

    // Open Graph
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', sanitizedDescription, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:alt', title, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type === 'service' ? 'website' : type, true);
    updateMetaTag('og:site_name', SITE_NAME, true);
    updateMetaTag('og:locale', 'pt_BR', true);

    // Article specific OG tags
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, true);
      if (author) updateMetaTag('article:author', author, true);
      if (section) updateMetaTag('article:section', section, true);
      if (tags) tags.forEach((tag, i) => updateMetaTag(`article:tag:${i}`, tag, true));
    }

    // Twitter Cards
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', sanitizedDescription);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', title);
    updateMetaTag('twitter:site', '@khaoskontrol');
    updateMetaTag('twitter:creator', '@khaoskontrol');

    // Canonical link
    updateLinkTag('canonical', url);

    // Preconnect for performance (critical resources)
    const preconnects = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ];
    preconnects.forEach((href, i) => {
      let link = document.querySelector(`link[rel="preconnect"][href="${href}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        if (href.includes('gstatic')) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // DNS prefetch for additional performance
    const dnsPrefetch = [
      'https://rhvmczcwtfjodrocesaa.supabase.co',
      'https://maps.googleapis.com',
    ];
    dnsPrefetch.forEach(href => {
      let link = document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Build JSON-LD schemas
    const schemas: object[] = [];

    // WebSite schema (for sitelinks search box)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": BASE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${BASE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });

    // Breadcrumb schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      });
    }

    // FAQ schema
    if (faq && faq.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      });
    }

    // LocalBusiness schema
    if (businessName) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": businessName,
        "url": url,
        "telephone": businessPhone,
        "address": businessAddress ? {
          "@type": "PostalAddress",
          "addressLocality": businessAddress
        } : undefined,
        "priceRange": priceRange || "$$",
        "openingHours": businessHours
      });
    }

    // Product/Service schema
    if (productPrice) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "description": description,
        "image": image,
        "offers": {
          "@type": "Offer",
          "price": productPrice,
          "priceCurrency": productCurrency,
          "availability": `https://schema.org/${productAvailability}`,
          "url": url
        }
      });
    }

    // Custom JSON-LD
    if (jsonLd) {
      schemas.push(jsonLd);
    }

    // Clear existing dynamic schemas and add new ones
    document.querySelectorAll('script[data-seo="dynamic"]').forEach(el => el.remove());

    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'dynamic');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

  }, [title, description, keywords, image, url, type, noindex, jsonLd, breadcrumbs, faq, publishedTime, modifiedTime, author, section, tags, priceRange, businessName, businessPhone, businessAddress, businessHours, productPrice, productCurrency, productAvailability]);

  return null;
};

export default SEOHead;
