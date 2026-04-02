'use client'

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ChevronDownIcon, ChevronRightIcon, Copy, Check } from 'lucide-react'
import { FilePreview, type PartialFile } from './file-preview'
import { MarkdownRenderer } from '@/components/markdown-renderer'

export interface Field {
  key?: string
  type?: string
  properties?: Record<string, Field>
  items?: Field
}

export function isFile(data: unknown): data is PartialFile {
  return (
    typeof data === 'object' &&
    data !== null &&
    'uri' in data &&
    typeof (data as PartialFile).uri === 'string'
  )
}

export function isUrl(data: unknown): boolean {
  return (
    typeof data === 'string' &&
    (data.startsWith('http://') || data.startsWith('https://'))
  )
}

function transformToFileObject(data: unknown): PartialFile {
  if (isUrl(data)) {
    const uri = data as string
    return {
      uri,
      path: uri,
      filename: uri.split('/').pop()?.split('?')[0],
    }
  }
  return data as PartialFile
}

export interface OutputFieldProps {
  field?: Field

  data: unknown

  className?: string

  compact?: boolean

  buttons?: boolean

  clickable?: boolean

  autoplay?: boolean
}

export const OutputField = memo(function OutputField({
  field,
  data,
  className,
  compact,
  buttons = true,
  clickable = true,
  autoplay,
}: OutputFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (data === null || data === undefined) {
    return null
  }

  const isArray = Array.isArray(data)
  const isFileArray =
    isArray &&
    data.length > 0 &&
    data.every((item) => item !== null && (isUrl(item) || isFile(item)))
  const isSingleFile = !isArray && (isUrl(data) || isFile(data))

  const transformedData = isFileArray
    ? data.map(transformToFileObject)
    : isSingleFile
      ? transformToFileObject(data)
      : data

  const isObject =
    !isSingleFile && !isFileArray && typeof data === 'object' && !isArray

  if (isArray && data.length === 0) {
    return null
  }

  const handleCopy = async () => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {}
      {field?.key && !compact && (
        <div className="flex flex-row gap-2 items-center">
          <Label className="text-muted-foreground flex items-center gap-2 lowercase">
            {field.key}
            {field.type && (
              <span className="text-xs text-muted-foreground/60 font-normal">
                {field.type}
              </span>
            )}
          </Label>
          {isObject && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {}
      {isFileArray ? (
        <div className="space-y-4">
          {(transformedData as PartialFile[]).map((item, index) => (
            <FilePreview
              key={item.uri || index}
              file={item}
              index={index}
              buttons={buttons}
              clickable={clickable}
              autoplay={autoplay}
            />
          ))}
        </div>
      ) : isSingleFile ? (
        <FilePreview
          file={transformedData as PartialFile}
          buttons={buttons}
          clickable={clickable}
          autoplay={autoplay}
        />
      ) : isObject ? (
        <>
          {compact && (
            <Card className="p-0">
              <CardContent
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer hover:bg-muted/50 px-4 py-2"
              >
                <div className="flex flex-row justify-between items-center">
                  <Label className="text-muted-foreground flex items-center gap-2 lowercase">
                    {field?.key}
                    {field?.type && (
                      <span className="text-xs text-muted-foreground/60 font-normal">
                        {field.type}
                      </span>
                    )}
                  </Label>
                  {isOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {(isOpen || !compact) && (
            <Card className="p-0">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(data as Record<string, unknown>).map(
                    ([key, value]) =>
                      value != null && (
                        <OutputField
                          key={key}
                          field={{ key, ...(field?.properties?.[key] || {}) }}
                          data={value}
                          buttons={buttons}
                          clickable={clickable}
                        />
                      ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : typeof data === 'boolean' ? (
        <Card className="p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'px-2 py-1 rounded-full text-sm font-medium',
                  data
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-red-500/15 text-red-600',
                )}
              >
                {data ? 'true' : 'false'}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isArray ? (
        <Card className="p-0">
          <CardContent className="p-4">
            <div className="space-y-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {data.map((item, index) => (
                <OutputField
                  key={index}
                  field={field?.items}
                  data={item}
                  buttons={buttons}
                  clickable={clickable}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0">
          <CardContent className="p-2 h-full">
            <div className="w-full h-full relative group max-h-[300px]">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                onClick={handleCopy}
                aria-label="Copy output"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <div
                className={cn(
                  'max-h-[300px] break-all pr-8',
                  clickable ? 'overflow-y-auto' : 'overflow-y-hidden',
                )}
              >
                {typeof data === 'string' ? (
                  <MarkdownRenderer content={data} />
                ) : (
                  <span className="text-sm">{String(data)}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

export interface OutputFieldsProps {
  output: Record<string, unknown>

  fields?: Record<string, Field>

  className?: string

  compact?: boolean
}

export const OutputFields = memo(function OutputFields({
  output,
  fields,
  className,
  compact,
}: OutputFieldsProps) {
  if (!output || typeof output !== 'object') {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(output).map(([key, value]) => (
        <OutputField
          key={key}
          field={{ key, ...(fields?.[key] || {}) }}
          data={value}
          compact={compact}
        />
      ))}
    </div>
  )
})
