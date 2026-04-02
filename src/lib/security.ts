export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .trim()
}

export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
): T {
  const sanitized = { ...data }
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeUserInput(
        sanitized[key] as string,
      )
    }
  }
  return sanitized
}

export function detectDevTools(): boolean {
  const threshold = 160
  return (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  )
}

export function clearSensitiveStorage() {
  const keysToKeep = ['theme', 'language', 'kontrol_analytics']
  const allKeys = Object.keys(localStorage)
  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key) && !key.startsWith('sb-')) {
      localStorage.removeItem(key)
    }
  })
}

export function sessionTimeout(
  onTimeout: () => void,
  timeoutMs = 30 * 60 * 1000,
) {
  let timer: ReturnType<typeof setTimeout>

  const resetTimer = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      clearSensitiveStorage()
      onTimeout()
    }, timeoutMs)
  }

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  events.forEach((event) =>
    document.addEventListener(event, resetTimer, { passive: true }),
  )
  resetTimer()

  return () => {
    clearTimeout(timer)
    events.forEach((event) => document.removeEventListener(event, resetTimer))
  }
}
