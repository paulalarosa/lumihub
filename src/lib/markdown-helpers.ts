export function isCloudInferenceUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'cloud.inference.sh'
  } catch {
    return false
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    if (!url) return null
    const urlObj = new URL(url)

    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }

    if (
      urlObj.hostname === 'youtube.com' ||
      urlObj.hostname === 'www.youtube.com'
    ) {
      if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v')
      }

      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/')[2]
      }
    }

    return null
  } catch {
    return null
  }
}

export function stripHtmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '')
}

export function isLikelyMarkdown(input: string): boolean {
  if (!input) return false
  let score = 0

  if (/(?:^|\n)\s{0,3}#{1,6} \S/.test(input)) score += 2

  if (/\*\*[\s\S]*?\*\*/.test(input)) score += 1

  if (/(?:^|[^*])\*[^*\s][\s\S]*?\*(?:[^*]|$)/.test(input)) score += 1

  if (/(?:^|\n)\s{0,3}(?:[-*+] |\d+\. )\S/.test(input)) score += 1

  if (/!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)/.test(input)) score += 2

  if (/(?:^|\n)```[\s\S]*?```/.test(input) || /`[^`\n]+`/.test(input))
    score += 2

  if (/(?:^|\n)\s{0,3}>\s?\S/.test(input)) score += 1

  if (
    /(?:^|\n)\|[^\n]*\|\s*(?:\n)\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?/.test(
      input,
    )
  )
    score += 2

  if (/(?:^|\n)\s{0,3}(?:-{3,}|_{3,}|\*{3,})\s*(?:\n|$)/.test(input)) score += 1

  return score > 0
}
