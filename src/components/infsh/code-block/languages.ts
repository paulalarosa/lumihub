import type { LanguageDefinition } from '@/components/infsh/code-block/types'

export const javascript: LanguageDefinition = {
  name: 'javascript',
  aliases: ['js', 'jsx', 'typescript', 'ts', 'tsx'],
  keywords: {
    import: new Set(['import', 'export', 'from', 'as', 'default']),
    declaration: new Set([
      'const',
      'let',
      'var',
      'function',
      'class',
      'extends',
      'static',
      'get',
      'set',
      'async',

      'type',
      'interface',
      'enum',
      'namespace',
      'module',
      'declare',
      'abstract',
      'implements',
      'readonly',
      'private',
      'protected',
      'public',
      'override',
    ]),
    control: new Set([
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'break',
      'continue',
      'return',
      'try',
      'catch',
      'finally',
      'throw',
      'await',
      'yield',
      'of',
      'in',
    ]),
    value: new Set(['true', 'false', 'null', 'undefined']),
    other: new Set([
      'new',
      'delete',
      'typeof',
      'instanceof',
      'void',
      'this',
      'super',
      'satisfies',
      'keyof',
      'infer',
    ]),
    type: new Set([
      'string',
      'number',
      'boolean',
      'object',
      'symbol',
      'bigint',
      'any',
      'unknown',
      'never',
      'void',
    ]),
  },
  patterns: {
    comment: [/^\/\/[^\n]*/, /^\/\*[\s\S]*?\*\//],
    string: [
      /^"(?:[^"\\]|\\.)*"/,
      /^'(?:[^'\\]|\\.)*'/,
      /^`(?:[^`\\]|\\.)*`/,
    ],
  },
}

export const python: LanguageDefinition = {
  name: 'python',
  aliases: ['py'],
  keywords: {
    import: new Set(['import', 'from', 'as']),
    declaration: new Set(['def', 'class', 'lambda', 'global', 'nonlocal']),
    control: new Set([
      'if',
      'elif',
      'else',
      'for',
      'while',
      'break',
      'continue',
      'return',
      'try',
      'except',
      'finally',
      'raise',
      'with',
      'yield',
      'pass',
      'assert',
      'match',
      'case',
    ]),
    value: new Set(['True', 'False', 'None']),
    other: new Set([
      'and',
      'or',
      'not',
      'in',
      'is',
      'del',
      'print',
      'self',
      'cls',
    ]),
  },
  patterns: {
    comment: [/^#[^\n]*/],
    string: [
      /^(?:f|r|b|fr|rf|br|rb)?"""[\s\S]*?"""/,
      /^(?:f|r|b|fr|rf|br|rb)?'''[\s\S]*?'''/,
      /^(?:f|r|b)?"(?:[^"\\]|\\.)*"/,
      /^(?:f|r|b)?'(?:[^'\\]|\\.)*'/, // single
    ],
  },
}

export const bash: LanguageDefinition = {
  name: 'bash',
  aliases: ['sh', 'shell', 'zsh'],
  keywords: {
    control: new Set([
      'if',
      'then',
      'else',
      'elif',
      'fi',
      'for',
      'while',
      'do',
      'done',
      'case',
      'esac',
      'function',
      'return',
      'exit',
      'select',
      'until',
      'in',
    ]),
    other: new Set([
      'echo',
      'export',
      'source',
      'alias',
      'unalias',
      'cd',
      'pwd',
      'ls',
      'cat',
      'grep',
      'sed',
      'awk',
      'curl',
      'wget',
      'chmod',
      'chown',
      'mkdir',
      'rm',
      'cp',
      'mv',
      'touch',
      'find',
      'xargs',
      'npm',
      'npx',
      'yarn',
      'pnpm',
      'node',
      'python',
      'pip',
      'git',
      'docker',
      'sudo',
      'apt',
      'brew',
      'make',
      'cargo',
      'go',
    ]),
  },
  patterns: {
    comment: [/^#[^\n]*/],
    string: [/^"(?:[^"\\]|\\.)*"/, /^'(?:[^'\\]|\\.)*'/],
  },
}

export const json: LanguageDefinition = {
  name: 'json',
  aliases: ['jsonc'],
  keywords: {
    value: new Set(['true', 'false', 'null']),
  },
  patterns: {
    string: [/^"(?:[^"\\]|\\.)*"/],
  },
}

export const css: LanguageDefinition = {
  name: 'css',
  aliases: ['scss', 'sass', 'less'],
  keywords: {
    other: new Set([
      'important',
      'inherit',
      'initial',
      'unset',
      'none',
      'auto',
    ]),
  },
  patterns: {
    comment: [/^\/\*[\s\S]*?\*\//],
    string: [/^"(?:[^"\\]|\\.)*"/, /^'(?:[^'\\]|\\.)*'/],
  },
}

export const html: LanguageDefinition = {
  name: 'html',
  aliases: ['xml', 'svg', 'htm'],
  keywords: {},
  patterns: {
    comment: [/^<!--[\s\S]*?-->/],
    string: [/^"(?:[^"\\]|\\.)*"/, /^'(?:[^'\\]|\\.)*'/],
  },
}

export const go: LanguageDefinition = {
  name: 'go',
  aliases: ['golang'],
  keywords: {
    import: new Set(['import', 'package']),
    declaration: new Set([
      'func',
      'var',
      'const',
      'type',
      'struct',
      'interface',
      'map',
      'chan',
    ]),
    control: new Set([
      'if',
      'else',
      'for',
      'range',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'goto',
      'fallthrough',
      'defer',
      'go',
      'select',
    ]),
    value: new Set(['true', 'false', 'nil', 'iota']),
    other: new Set([
      'make',
      'new',
      'len',
      'cap',
      'append',
      'copy',
      'delete',
      'panic',
      'recover',
    ]),
  },
  patterns: {
    comment: [/^\/\/[^\n]*/, /^\/\*[\s\S]*?\*\//],
    string: [
      /^"(?:[^"\\]|\\.)*"/,
      /^'(?:[^'\\]|\\.)*'/,
      /^`[^`]*`/, // raw strings
    ],
  },
}

export const rust: LanguageDefinition = {
  name: 'rust',
  aliases: ['rs'],
  keywords: {
    import: new Set(['use', 'mod', 'crate', 'extern', 'as', 'pub']),
    declaration: new Set([
      'fn',
      'let',
      'mut',
      'const',
      'static',
      'struct',
      'enum',
      'trait',
      'impl',
      'type',
      'where',
    ]),
    control: new Set([
      'if',
      'else',
      'for',
      'while',
      'loop',
      'match',
      'break',
      'continue',
      'return',
      'async',
      'await',
      'move',
    ]),
    value: new Set([
      'true',
      'false',
      'self',
      'Self',
      'None',
      'Some',
      'Ok',
      'Err',
    ]),
    other: new Set(['unsafe', 'ref', 'dyn', 'macro_rules']),
  },
  patterns: {
    comment: [/^\/\/[^\n]*/, /^\/\*[\s\S]*?\*\//],
    string: [/^"(?:[^"\\]|\\.)*"/, /^r#*"[\s\S]*?"#*/, /^'(?:[^'\\]|\\.)*'/],
  },
}

export const languages: Record<string, LanguageDefinition> = {
  javascript,
  python,
  bash,
  json,
  css,
  html,
  go,
  rust,
}

export function getLanguage(name: string): LanguageDefinition | null {
  const normalized = name.toLowerCase()

  if (languages[normalized]) {
    return languages[normalized]
  }

  for (const lang of Object.values(languages)) {
    if (lang.aliases.includes(normalized)) {
      return lang
    }
  }

  return null
}

export function normalizeLanguage(language?: string): string {
  if (!language) return 'text'

  const lang = getLanguage(language)
  return lang?.name ?? 'text'
}
