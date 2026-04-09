import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/layout/AppSidebar'
import { BottomNav } from '@/components/ui/layout/BottomNav'
import { Outlet } from 'react-router-dom'
import { TrialBanner } from '@/components/features/subscription/TrialBanner'
import { PageTransition } from '../animation/PageTransition'
import { NotificationBell } from './NotificationBell'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useSessionSecurity } from '@/hooks/useSessionSecurity'
import { lazy, Suspense } from 'react'

const OnboardingWizard = lazy(() =>
  import('@/components/onboarding/OnboardingWizard').then((m) => ({
    default: m.OnboardingWizard,
  })),
)

export default function AppLayout() {
  useSessionSecurity()
  return (
    <SidebarProvider>
      {}
      <AppSidebar />

      {}
      <SidebarInset className="bg-background min-h-screen mb-[60px] md:mb-0 transition-colors duration-300">
        <div className="sticky top-0 z-50 w-full flex flex-col bg-background/80 backdrop-blur-xl border-b border-border">
          <TrialBanner />

          {}
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4 md:hidden">
              <SidebarTrigger className="-ml-1 bg-black border border-white/20 rounded-none h-10 w-10 text-white hover:bg-white hover:text-black transition-colors" />
              <span className="font-serif text-lg font-bold text-white tracking-tight">
                KONTROL
              </span>
            </div>

            {}
            <div className="hidden md:flex flex-1" />

            {}
            <div className="flex items-center gap-3">
              <ModeToggle />
              <NotificationBell />
            </div>
          </div>
        </div>

        {}
        <div className="flex-1 w-full max-w-7xl mx-auto">
          {}
          {}
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </SidebarInset>

      {}
      <BottomNav />
      <Suspense fallback={null}>
        <OnboardingWizard />
      </Suspense>
    </SidebarProvider>
  )
}
