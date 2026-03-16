import React from 'react'
import { sanitizeHTML } from '@/lib/sanitize'

interface SafeHTMLProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string | null | undefined
  as?: React.ElementType
}

/**
 * Universal Wrapper for rendering raw HTML.
 * Uses sanitizeHTML to strip XSS injecting vectors (<script>, malicious handlers)
 * before passing it to dangerouslySetInnerHTML.
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  as: Component = 'div',
  ...props
}) => {
  if (!html) return null

  const sanitizedHTML = sanitizeHTML(html)

  return (
    <Component {...props} dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  )
}
