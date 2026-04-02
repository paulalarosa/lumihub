import DOMPurify from 'dompurify'

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
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

    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],

    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

export function useSanitizedHTML(html: string) {
  return sanitizeHTML(html)
}
