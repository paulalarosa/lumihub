import React from 'react'
import DOMPurify from 'dompurify'

interface SafeHTMLProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string | null | undefined
  as?: React.ElementType
}

/**
 * Universal Wrapper for rendering raw HTML.
 * Uses DOMPurify to strip XSS injecting vectors (<script>, malicious handlers)
 * before passing it to dangerouslySetInnerHTML.
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  as: Component = 'div',
  ...props
}) => {
  if (!html) return null

  // Configure DOMPurify to allow common rich-text formatting but block scripts
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'br',
      'span',
      'div',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'blockquote',
      'pre',
      'code',
      'u',
      's',
      'hr',
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'target',
      'src',
      'alt',
      'class',
      'style',
      'rel',
    ],
  })

  return (
    <Component {...props} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  )
}
