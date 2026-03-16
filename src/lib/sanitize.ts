import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML para prevenir XSS
 * Remove scripts, event handlers, e outros elementos perigosos
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    // Permite apenas tags seguras
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
      'table',
      'tr',
      'td',
      'th',
    ],
    // Permite apenas atributos seguros
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    // Remove scripts e event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

/**
 * Hook React para sanitizar HTML
 */
export function useSanitizedHTML(html: string) {
  return sanitizeHTML(html)
}
