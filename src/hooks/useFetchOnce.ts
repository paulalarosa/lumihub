import { useEffect, useRef } from 'react'

export const useFetchOnce = (fn: () => void | Promise<void>) => {
  const executedRef = useRef(false)

  useEffect(() => {
    if (!executedRef.current) {
      fn()
      executedRef.current = true
    }
  }, [fn])
}
