'use client'

import React, { memo, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const totalSeconds = ms / 1000
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`

  const totalMinutes = totalSeconds / 60
  if (totalMinutes < 60) {
    const minutes = Math.floor(totalMinutes)
    const seconds = Math.round(totalSeconds % 60)
    return `${minutes}m${seconds}s`
  }

  const totalHours = totalMinutes / 60
  const hours = Math.floor(totalHours)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${hours}h${minutes}m${seconds}s`
}

function getSmartInterval(ms: number): number {
  if (ms < 1000) return 20
  if (ms < 60_000) return 100
  if (ms < 3_600_000) return 1000
  return 60_000
}

export interface TimeSinceProps {
  start: string | number | Date | undefined

  end?: string | number | Date | undefined

  className?: string

  parentheses?: boolean
}

export const TimeSince = memo(function TimeSince({
  start,
  end,
  className,
  parentheses = false,
}: TimeSinceProps) {
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (end) return

    function update() {
      setNow(Date.now())
    }

    const startTime = start ? new Date(start).getTime() : 0
    const endTime = end ? new Date(end).getTime() : now
    const diff = Math.max(0, endTime - startTime)
    const interval = getSmartInterval(diff)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(update, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [start, end, now])

  if (!start) return <span className={className}>-</span>

  const startTime = new Date(start).getTime()
  const endTime = end ? new Date(end).getTime() : now

  if (isNaN(startTime) || isNaN(endTime)) {
    return <span className={className}>?</span>
  }

  const diff = Math.max(0, endTime - startTime)

  if (diff === 0) return <span className={className}></span>

  const formatted = formatDuration(diff)

  return (
    <span className={cn('text-xs', className)}>
      {parentheses ? `(${formatted})` : formatted}
    </span>
  )
})
