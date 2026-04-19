const STORAGE_KEY = 'khk_rate_limits'

interface RateLimitState {
  [key: string]: number[]
}

function load(): RateLimitState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RateLimitState) : {}
  } catch {
    return {}
  }
}

function save(state: RateLimitState) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota errors */
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

export function rateLimit(
  key: string,
  maxCalls: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs
  const state = load()
  const history = (state[key] ?? []).filter((ts) => ts > cutoff)

  if (history.length >= maxCalls) {
    const oldest = history[0]
    const retryAfterMs = oldest + windowMs - now
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  history.push(now)
  state[key] = history
  save(state)

  return {
    allowed: true,
    remaining: maxCalls - history.length,
    retryAfterMs: 0,
  }
}

export class RateLimitError extends Error {
  retryAfterMs: number
  constructor(retryAfterMs: number, message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

export function enforceRateLimit(
  key: string,
  maxCalls: number,
  windowMs: number,
): void {
  const result = rateLimit(key, maxCalls, windowMs)
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterMs)
  }
}
