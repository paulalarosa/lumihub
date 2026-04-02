import type { TokenType } from '@/components/infsh/code-block/types'

export const tokenStyles: Record<TokenType, string> = {
  comment: 'text-zinc-500 italic',

  string: 'text-amber-400',

  'keyword-import': 'text-pink-400 font-medium',
  'keyword-declaration': 'text-violet-400 font-medium',
  'keyword-control': 'text-blue-400 font-medium',
  'keyword-value': 'text-cyan-400',
  'keyword-other': 'text-violet-400',

  type: 'text-cyan-400',

  number: 'text-emerald-400',

  function: 'text-green-400',

  property: 'text-blue-400',

  operator: 'text-zinc-400',
  punctuation: 'text-zinc-400',

  tag: 'text-red-400',
  attribute: 'text-orange-300',
}

export function getTokenStyle(type: TokenType | null): string | null {
  if (!type) return null
  return tokenStyles[type] ?? null
}
