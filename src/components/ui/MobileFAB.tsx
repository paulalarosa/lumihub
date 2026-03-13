import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileFABProps {
  onClick: () => void
  className?: string
  icon?: React.ReactNode
  label?: string // Optional label for accessibility
}

export function MobileFAB({
  onClick,
  className,
  icon,
  label = 'Create New',
}: MobileFABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 md:hidden', // Fixed position, mobile only
        'w-14 h-14 rounded-none', // Size and shape
        'bg-white text-black hover:bg-gray-200', // Colors
        'shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]', // Industrial shadow
        'flex items-center justify-center p-0', // Centering
        className,
      )}
      aria-label={label}
    >
      {icon || <Plus className="w-6 h-6" />}
    </Button>
  )
}
