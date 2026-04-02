import type {
  Token,
  TokenType,
  LanguageDefinition,
} from '@/components/infsh/code-block/types'
import { getLanguage } from '@/components/infsh/code-block/languages'

export interface TokenizeContext {
  inTemplateLiteral?: boolean

  inMultilineComment?: boolean
}

function getKeywordType(
  word: string,
  lang: LanguageDefinition,
): TokenType | null {
  const { keywords } = lang

  if (keywords.import?.has(word)) return 'keyword-import'
  if (keywords.declaration?.has(word)) return 'keyword-declaration'
  if (keywords.control?.has(word)) return 'keyword-control'
  if (keywords.value?.has(word)) return 'keyword-value'
  if (keywords.type?.has(word)) return 'type'
  if (keywords.other?.has(word)) return 'keyword-other'

  return null
}

function tryMatch(
  remaining: string,
  patterns: RegExp[] | undefined,
): string | null {
  if (!patterns) return null

  for (const pattern of patterns) {
    const match = remaining.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return null
}

function isJsxLanguage(languageName: string): boolean {
  const jsxLangs = ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts']
  return jsxLangs.includes(languageName.toLowerCase())
}

function isJsonLanguage(languageName: string): boolean {
  return ['json', 'jsonc'].includes(languageName.toLowerCase())
}

function detectJsxContext(code: string): boolean {
  if (/^\s+\/>/.test(code)) {
    return true
  }

  if (/^\s+>(?!=)/.test(code)) {
    return true
  }

  if (/^\s+[a-zA-Z_][a-zA-Z0-9_-]*\s*=\s*[{{"']/.test(code)) {
    return true
  }
  // Check for: whitespace + { (JSX expression in attribute value on its own line)
  if (/^\s+\{\s*$/.test(code) || /^\s+\{[^}]*$/.test(code)) {
    return true
  }
  return false
}

/**
 * Tokenize a line of code with context for multiline constructs
 */
export function tokenize(
  code: string,
  languageName: string,
  context?: TokenizeContext,
): { tokens: Token[]; context: TokenizeContext } {
  const lang = getLanguage(languageName)
  const tokens: Token[] = []
  let remaining = code
  const supportsJsx = isJsxLanguage(languageName)
  const isJson = isJsonLanguage(languageName)

  let inTemplateLiteral = context?.inTemplateLiteral ?? false

  if (inTemplateLiteral) {
    const closingIndex = remaining.indexOf('`')
    if (closingIndex === -1) {
      tokens.push({ type: 'string', content: remaining })
      return { tokens, context: { inTemplateLiteral: true } }
    } else {
      const stringPart = remaining.slice(0, closingIndex + 1)
      tokens.push({ type: 'string', content: stringPart })
      remaining = remaining.slice(closingIndex + 1)
      inTemplateLiteral = false
    }
  }

  let inJsxTag = supportsJsx && detectJsxContext(code) && !inTemplateLiteral

  while (remaining.length > 0) {
    let matched = false

    if (!inJsxTag && lang?.patterns.comment) {
      const comment = tryMatch(remaining, lang.patterns.comment)
      if (comment) {
        tokens.push({ type: 'comment', content: comment })
        remaining = remaining.slice(comment.length)
        matched = true
        continue
      }
    }

    if (supportsJsx) {
      const jsxOpenTag = remaining.match(
        /^<\/?([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)/,
      )
      if (jsxOpenTag) {
        const bracket =
          remaining[0] === '<' && remaining[1] === '/' ? '</' : '<'
        tokens.push({ type: 'punctuation', content: bracket })
        remaining = remaining.slice(bracket.length)

        const tagName = jsxOpenTag[1]
        tokens.push({ type: 'tag', content: tagName })
        remaining = remaining.slice(tagName.length)

        inJsxTag = true
        matched = true
        continue
      }

      if (inJsxTag) {
        if (remaining.startsWith('/>')) {
          tokens.push({ type: 'punctuation', content: '/>' })
          remaining = remaining.slice(2)
          inJsxTag = false
          matched = true
          continue
        }
        if (remaining.startsWith('>')) {
          tokens.push({ type: 'punctuation', content: '>' })
          remaining = remaining.slice(1)
          inJsxTag = false
          matched = true
          continue
        }

        // JSX attribute: propName= or propName (boolean) or propName (before />)
        const jsxAttr = remaining.match(
          /^([a-zA-Z_][a-zA-Z0-9_-]*)(?=\s*=|\s*\/>|\s*>|\s+[a-zA-Z_]|\s*$)/,
        )
        if (jsxAttr) {
          tokens.push({ type: 'attribute', content: jsxAttr[1] })
          remaining = remaining.slice(jsxAttr[1].length)
          matched = true
          continue
        }
      }
    }

    if (lang?.patterns.string) {
      const str = tryMatch(remaining, lang.patterns.string)
      if (str) {
        // In JSON, check if this string is a key (followed by :)
        const afterStr = remaining.slice(str.length)
        const isJsonKey = isJson && /^\s*:/.test(afterStr)
        tokens.push({ type: isJsonKey ? 'property' : 'string', content: str })
        remaining = remaining.slice(str.length)
        matched = true
        continue
      }

      // Check for template literal that starts but doesn't end (multiline)
      // Only trigger if we're AT a backtick and it doesn't close on this line
      if (remaining[0] === '`') {
        tokens.push({ type: 'string', content: remaining })
        return { tokens, context: { inTemplateLiteral: true } }
      }
    }

    if (!lang) {
      const doubleStr = remaining.match(/^"(?:[^"\\]|\\.)*"/)
      if (doubleStr) {
        tokens.push({ type: 'string', content: doubleStr[0] })
        remaining = remaining.slice(doubleStr[0].length)
        matched = true
        continue
      }

      const singleStr = remaining.match(/^'(?:[^'\\]|\\.)*'/)
      if (singleStr) {
        tokens.push({ type: 'string', content: singleStr[0] })
        remaining = remaining.slice(singleStr[0].length)
        matched = true
        continue
      }
    }

    const number = remaining.match(/^-?\b\d+\.?\d*(?:e[+-]?\d+)?\b/i)
    if (number) {
      tokens.push({ type: 'number', content: number[0] })
      remaining = remaining.slice(number[0].length)
      matched = true
      continue
    }

    const word = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
    if (word) {
      const afterWord = remaining.slice(word[0].length)
      const isPropertyKey = /^\s*:(?!:)/.test(afterWord)

      let tokenType: TokenType | null = null
      if (isPropertyKey) {
        tokenType = 'property'
      } else if (lang && !inJsxTag) {
        tokenType = getKeywordType(word[0], lang)
      }

      tokens.push({
        type: tokenType,
        content: word[0],
      })
      remaining = remaining.slice(word[0].length)
      matched = true
      continue
    }

    const operator = remaining.match(
      /^(?:===|!==|==|!=|<=|>=|=>|->|::|\.\.\.?|\?\?|\?\.|&&|\|\||[+\-*/%<>=!&|^~?:])/,
    )
    if (operator) {
      tokens.push({ type: 'operator', content: operator[0] })
      remaining = remaining.slice(operator[0].length)
      matched = true
      continue
    }

    const punct = remaining.match(/^[{}[\]();,.<>]/)
    if (punct) {
      tokens.push({ type: 'punctuation', content: punct[0] })
      remaining = remaining.slice(punct[0].length)
      matched = true
      continue
    }

    if (!matched) {
      tokens.push({ type: null, content: remaining[0] })
      remaining = remaining.slice(1)
    }
  }

  return { tokens, context: { inTemplateLiteral } }
}
