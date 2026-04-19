declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

import { logger } from '@/services/logger'

export type EventCategory =
  | 'cta_click'
  | 'page_view'
  | 'conversion'
  | 'engagement'
  | 'navigation'
  | 'form'
  | 'auth'
  | 'booking'
  | 'subscription'
  | 'feature_usage'

export interface AnalyticsEvent {
  category: EventCategory
  action: string
  label?: string
  value?: number
  customParameters?: Record<string, unknown>
}

export interface PageViewEvent {
  page_path: string
  page_title: string
  page_location?: string
}

export interface ConversionEvent {
  conversion_id: string
  value?: number
  currency?: string
  transaction_id?: string
}

class AnalyticsService {
  private isInitialized = false
  private pageStartTime: number = Date.now()
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initialize()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initialize() {
    if (typeof window !== 'undefined' && window.gtag) {
      this.isInitialized = true
    }
  }

  trackEvent(event: AnalyticsEvent) {
    const { category, action, label, value, customParameters } = event

    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        session_id: this.sessionId,
        ...customParameters,
      })
    }

    this.storeLocalEvent({
      type: 'event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    })
  }

  trackCTAClick(ctaName: string, location: string, destination?: string) {
    this.trackEvent({
      category: 'cta_click',
      action: 'click',
      label: ctaName,
      customParameters: {
        cta_location: location,
        cta_destination: destination,
      },
    })
  }

  trackPageView(pageView: PageViewEvent) {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pageView.page_path,
        page_title: pageView.page_title,
        page_location: pageView.page_location || window.location.href,
        session_id: this.sessionId,
      })
    }

    this.pageStartTime = Date.now()

    this.storeLocalEvent({
      type: 'page_view',
      ...pageView,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    })
  }

  trackTimeOnPage(pagePath: string) {
    const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000)

    if (window.gtag) {
      window.gtag('event', 'time_on_page', {
        event_category: 'engagement',
        page_path: pagePath,
        time_seconds: timeSpent,
        session_id: this.sessionId,
      })
    }

    this.storeLocalEvent({
      type: 'time_on_page',
      pagePath,
      timeSpent,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    })

    return timeSpent
  }

  trackConversion(conversion: ConversionEvent) {
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversion.conversion_id,
        value: conversion.value,
        currency: conversion.currency || 'BRL',
        transaction_id: conversion.transaction_id,
        session_id: this.sessionId,
      })
    }

    this.storeLocalEvent({
      type: 'conversion',
      ...conversion,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    })
  }

  trackFormSubmit(formName: string, success: boolean, errorMessage?: string) {
    this.trackEvent({
      category: 'form',
      action: success ? 'submit_success' : 'submit_error',
      label: formName,
      customParameters: {
        error_message: errorMessage,
      },
    })
  }

  trackAuth(
    action: 'login' | 'signup' | 'logout' | 'password_reset',
    method?: string,
  ) {
    this.trackEvent({
      category: 'auth',
      action,
      label: method,
    })
  }

  trackBooking(
    action: 'started' | 'completed' | 'cancelled',
    serviceId?: string,
    value?: number,
  ) {
    this.trackEvent({
      category: 'booking',
      action,
      label: serviceId,
      value,
    })
  }

  trackSubscription(
    action:
      | 'view_plans'
      | 'select_plan'
      | 'start_trial'
      | 'subscribe'
      | 'cancel',
    planName?: string,
    value?: number,
  ) {
    this.trackEvent({
      category: 'subscription',
      action,
      label: planName,
      value,
    })
  }

  trackScrollDepth(percentage: number, pagePath: string) {
    if (
      percentage === 25 ||
      percentage === 50 ||
      percentage === 75 ||
      percentage === 100
    ) {
      this.trackEvent({
        category: 'engagement',
        action: 'scroll_depth',
        label: pagePath,
        value: percentage,
      })
    }
  }

  private storeLocalEvent(event: Record<string, unknown>) {
    try {
      const events = JSON.parse(
        localStorage.getItem('kontrol_analytics') || '[]',
      )
      events.push(event)

      if (events.length > 100) {
        events.shift()
      }

      localStorage.setItem('kontrol_analytics', JSON.stringify(events))
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao registrar evento analítico.',
        showToast: false,
      })
    }
  }

  getStoredEvents(): Record<string, unknown>[] {
    try {
      return JSON.parse(localStorage.getItem('kontrol_analytics') || '[]')
    } catch {
      return []
    }
  }

  clearStoredEvents() {
    localStorage.removeItem('kontrol_analytics')
  }

  getSessionSummary() {
    const events = this.getStoredEvents()
    const sessionEvents = events.filter((e) => e.sessionId === this.sessionId)

    return {
      sessionId: this.sessionId,
      totalEvents: sessionEvents.length,
      pageViews: sessionEvents.filter((e) => e.type === 'page_view').length,
      ctaClicks: sessionEvents.filter((e) => e.category === 'cta_click').length,
      conversions: sessionEvents.filter((e) => e.type === 'conversion').length,
      startTime: sessionEvents[0]?.timestamp,
    }
  }
}

export const analyticsService = new AnalyticsService()
