import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      !!VAPID_PUBLIC_KEY

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch {
      setIsSubscribed(false)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false

    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const keys = subscription.toJSON().keys
      if (!keys?.p256dh || !keys?.auth) throw new Error('Missing push keys')

      const { error } = await supabase.rpc('save_push_subscription', {
        p_endpoint: subscription.endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth,
        p_user_agent: navigator.userAgent,
      })

      if (error) throw error

      setIsSubscribed(true)
      return true
    } catch (error) {
      logger.error('usePushNotifications.subscribe', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, isSupported])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await supabase.rpc('remove_push_subscription', {
          p_endpoint: subscription.endpoint,
        })
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (error) {
      logger.error('usePushNotifications.unsubscribe', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  }
}
