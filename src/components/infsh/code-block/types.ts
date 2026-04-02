export type TokenType =
  | 'comment'
  | 'string'
  | 'keyword-import'
  | 'keyword-declaration'
  | 'keyword-control'
  | 'keyword-value'
  | 'keyword-other'
  | 'number'
  | 'function'
  | 'property'
  | 'operator'
  | 'punctuation'
  | 'type'
  | 'tag'
  | 'attribute'

export interface Token {
  type: TokenType | null
  content: string
}

export interface LanguageDefinition {
  name: string
  aliases: string[]
  keywords: {
    import?: Set<string>
    declaration?: Set<string>
    control?: Set<string>
    value?: Set<string>
    other?: Set<string>
    type?: Set<string>
  }
  patterns: {
    comment?: RegExp[]
    string?: RegExp[]
  }
}
