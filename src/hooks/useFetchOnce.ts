import { useEffect, useRef } from 'react'

/**
 * Hook to execute a function exactly once during the component's lifecycle.
 * Useful for one-time initializations that shouldn't re-run on re-renders,
 * even in React 18 Strict Mode.
 */
export const useFetchOnce = (fn: () => void | Promise<void>) => {
  const executedRef = useRef(false)

  useEffect(() => {
    if (!executedRef.current) {
      fn()
      executedRef.current = true
    }
  }, [fn])
}
