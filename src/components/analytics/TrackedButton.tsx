import { forwardRef, MouseEvent } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

interface TrackedButtonProps extends ButtonProps {
  trackingName: string
  trackingLocation: string
  trackingDestination?: string
}

export const TrackedButton = forwardRef<HTMLButtonElement, TrackedButtonProps>(
  (
    {
      trackingName,
      trackingLocation,
      trackingDestination,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const { trackCTAClick } = useAnalytics()

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      trackCTAClick(trackingName, trackingLocation, trackingDestination)
      onClick?.(e)
    }

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    )
  },
)

TrackedButton.displayName = 'TrackedButton'
