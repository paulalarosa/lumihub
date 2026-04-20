import { useEffect, useMemo } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

type TableName = string

interface Options {
  /**
   * Table(s) to subscribe to. Can pass one name or an array.
   */
  table: TableName | TableName[]
  /**
   * React Query key(s) to invalidate when a change arrives.
   * Pass a single key or array of keys.
   */
  invalidate: QueryKey | QueryKey[]
  /**
   * Optional filter (e.g. `user_id=eq.<uuid>`) to only receive events
   * matching the row. Applied to every subscribed table.
   */
  filter?: string
  /**
   * Optional: which event(s) to listen for. Defaults to all.
   */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /**
   * Unique channel name. Required when the same component subscribes
   * to different tables more than once. Defaults to a hash of the tables.
   */
  channelName?: string
  /**
   * Enable or disable the subscription. Useful for gating on auth.
   */
  enabled?: boolean
}

/**
 * Subscribes to Postgres changes on one or more tables and invalidates
 * React Query caches when a change arrives. Cleans up on unmount.
 *
 * The tables must be part of the `supabase_realtime` publication
 * (see migration 20260420000001_enable_realtime.sql).
 */
export function useRealtimeInvalidate({
  table,
  invalidate,
  filter,
  event = '*',
  channelName,
  enabled = true,
}: Options) {
  const queryClient = useQueryClient()

  // Derive stable string keys from array inputs. Callers typically pass inline
  // array literals which would otherwise re-trigger the effect every render
  // and churn the realtime channel subscription.
  const tablesKey = useMemo(
    () => (Array.isArray(table) ? table.join(',') : table),
    [table],
  )
  const invalidateKey = useMemo(
    () => JSON.stringify(invalidate),
    [invalidate],
  )

  useEffect(() => {
    if (!enabled) return

    const tables = Array.isArray(table) ? table : [table]
    const invalidateKeys = Array.isArray(invalidate[0])
      ? (invalidate as QueryKey[])
      : [invalidate as QueryKey]

    const name = channelName ?? `rt-${tables.join('-')}-${Date.now()}`
    let channel = supabase.channel(name)

    for (const tbl of tables) {
      channel = channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: tbl,
          ...(filter ? { filter } : {}),
        },
        () => {
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        },
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // Effect depends on derived string keys to avoid re-subscribing on every
    // render when callers pass inline array literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, invalidateKey, filter, event, channelName, enabled])
}
