'use client'

import { cn } from '@/lib/utils'
import ZoomableImage from '@/components/zoomable-image'
import React, { memo, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  isCloudInferenceUrl,
  getYouTubeVideoId,
  stripHtmlComments,
} from '@/lib/markdown-helpers'
import { YouTubeEmbed } from '@/components/youtube-embed'
import { CompactCodeBlock } from '@/components/infsh/code-block/code-block'

export interface MarkdownRendererProps {
  content: string
  className?: string

  compact?: boolean

  renderFilePreview?: (props: {
    uri: string
    filename: string
  }) => React.ReactNode

  renderCloudImage?: (props: { src: string; alt?: string }) => React.ReactNode
}

const textSizeMap = {
  default: {
    h1: 'text-xl',
    h2: 'text-lg',
    h3: 'text-md',
    h4: 'text-base',
    h5: 'text-sm',
    h6: 'text-sm',
    p: 'text-sm',
    li: 'text-sm',
    code: 'text-xs',
    pre: 'text-xs',
    blockquote: 'text-sm',
    ul: 'text-sm',
    ol: 'text-sm',
    th: 'text-sm',
    td: 'text-sm',
  },
  compact: {
    h1: 'text-xl',
    h2: 'text-lg',
    h3: 'text-base',
    h4: 'text-xs',
    h5: 'text-xs',
    h6: 'text-xs',
    p: 'text-xs',
    li: 'text-xs',
    code: 'text-xs',
    pre: 'text-xs',
    blockquote: 'text-xs',
    ul: 'text-xs',
    ol: 'text-xs',
    th: 'text-xs',
    td: 'text-xs',
  },
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  compact = false,
  renderFilePreview,
  renderCloudImage,
}: MarkdownRendererProps) {
  const processedContent = useMemo(() => stripHtmlComments(content), [content])

  const textSize = compact ? textSizeMap.compact : textSizeMap.default
  const fontClass = 'legible'
  const paragraphClass = cn(
    textSize.p,
    'break-words whitespace-pre-wrap my-0 py-0 not-last:mb-4 text-justify leading-relaxed',
    fontClass,
  )

  return (
    <div className={className}>
      <Markdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        components={{
          h1: ({ children }) => (
            <h1
              className={cn(
                textSize.h1,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                textSize.h2,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                textSize.h3,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={cn(
                textSize.h4,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className={cn(
                textSize.h5,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className={cn(
                textSize.h6,
                'font-bold my-0 [&:first-child]:mt-0 mt-8 py-0',
                fontClass,
              )}
            >
              {children}
            </h6>
          ),

          p: ({ children }) => {
            const hasBlockContent = React.Children.toArray(children).some(
              (child) => {
                if (!React.isValidElement(child)) return false
                const props = child.props as { href?: string; src?: string }

                if (props.href && getYouTubeVideoId(props.href)) return true

                if (props.href && isCloudInferenceUrl(props.href)) return true

                if (props.src) return true
                return false
              },
            )

            return hasBlockContent && !compact ? (
              <div className={paragraphClass}>{children}</div>
            ) : (
              <p className={paragraphClass}>{children}</p>
            )
          },

          blockquote: ({ children }) => (
            <blockquote className={cn('border-l-4 pl-4 my-2 py-0', fontClass)}>
              {children}
            </blockquote>
          ),

          ul: ({ children }) => (
            <ul
              className={cn(
                'list-disc list-outside ml-5 my-0 mt-2 py-0',
                fontClass,
              )}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={cn(
                'list-decimal list-outside ml-5 my-0 mt-2 py-0',
                fontClass,
              )}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={cn(textSize.li, 'my-0 mt-2 py-0 pl-1', fontClass)}>
              {children}
            </li>
          ),

          strong: ({ children }) => (
            <strong className={cn('font-bold', fontClass)}>{children}</strong>
          ),
          em: ({ children }) => (
            <em className={cn('italic', fontClass)}>{children}</em>
          ),

          code(props) {
            const { children, className } = props
            const hasLang = /language-(\w+)/.test(className || '')
            const hasNewlines = String(children).includes('\n')
            const isBlock = hasLang || hasNewlines

            if (isBlock) {
              return (
                <code className={cn(textSize.code, fontClass, className)}>
                  {children}
                </code>
              )
            }

            return (
              <span className="inline bg-muted/30 rounded px-1 text-pink-400/80">
                <code className={cn(textSize.code, fontClass)}>{children}</code>
              </span>
            )
          },

          pre: ({ children }) => (
            <CompactCodeBlock
              textSize={textSize.pre}
              className={cn('not-last:mb-4', textSize.pre, fontClass)}
            >
              {children}
            </CompactCodeBlock>
          ),

          a: ({ href, children }) => {
            if (href && !compact) {
              const videoId = getYouTubeVideoId(href)
              if (videoId) {
                return <YouTubeEmbed videoId={videoId} />
              }

              if (isCloudInferenceUrl(href) && renderFilePreview) {
                return renderFilePreview({
                  uri: href,
                  filename: typeof children === 'string' ? children : 'file',
                })
              }

              return (
                <a
                  href={href}
                  className={cn('hover:underline', fontClass)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              )
            }
            return <>{children}</>
          },

          img: ({ src, alt }) => {
            if (!src || typeof src !== 'string') return null

            if (isCloudInferenceUrl(src) && renderCloudImage) {
              return renderCloudImage({ src, alt })
            }

            return (
              <ZoomableImage
                src={src}
                alt={alt}
                className={cn('max-w-full h-auto my-0 py-0 rounded', fontClass)}
              />
            )
          },

          table: ({ children }) => (
            <div
              className={cn(
                'min-w-0 overflow-x-auto my-2 border border-border rounded-md',
                fontClass,
              )}
            >
              <table className="">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn('border-b border-border', fontClass)}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className={fontClass}>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th
              className={cn(
                'px-3 py-1.5 text-left text-xs text-muted-foreground',
                fontClass,
              )}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn('px-3 py-1.5 text-sm', fontClass)}>{children}</td>
          ),

          hr: () => <hr className="my-2 border-t" />,

          s: ({ children }) => <s className="line-through">{children}</s>,
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  )
})
