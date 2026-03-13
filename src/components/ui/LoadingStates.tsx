import { Spinner } from './spinner'
import { Skeleton, SkeletonText } from './skeleton'
import { cn } from '@/lib/utils'

export const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin h-5 w-5 text-current', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#050505]">
    <Spinner className="h-8 w-8 text-white" />
  </div>
)

export const TableLoader = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4 w-full" role="status" aria-busy="true">
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton className="h-10 w-1/4" />
      <Skeleton className="h-10 w-1/4" />
    </div>
    <div className="border border-white/5 rounded-none overflow-hidden">
      <div className="bg-zinc-900/50 h-12 border-b border-white/5 flex items-center px-4 space-x-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 border-b border-white/5 last:border-0 flex items-center px-4 space-x-4"
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[20%]" />
          <Skeleton className="h-4 w-[30%]" />
          <Skeleton className="h-4 w-[25%]" />
        </div>
      ))}
    </div>
  </div>
)

export const CardLoader = () => (
  <div
    className="bg-zinc-900/50 border border-white/5 p-6 space-y-4"
    role="status"
    aria-busy="true"
  >
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="flex justify-between items-center pt-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
)

export const FormLoader = () => (
  <div className="space-y-6 max-w-2xl" role="status" aria-busy="true">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="flex justify-end space-x-4 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
)
