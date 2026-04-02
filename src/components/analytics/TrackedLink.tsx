import { forwardRef, MouseEvent, AnchorHTMLAttributes } from 'react'
import { Link, LinkProps } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface TrackedLinkProps extends LinkProps {
  trackingName: string
  trackingLocation: string
}

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  (
    {
      trackingName,
      trackingLocation,
      to,
      onClick,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const { trackCTAClick } = useAnalytics()

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      trackCTAClick(trackingName, trackingLocation, String(to))
      onClick?.(e)
    }

    return (
      <Link
        ref={ref}
        to={to}
        onClick={handleClick}
        className={cn(className)}
        {...props}
      >
        {children}
      </Link>
    )
  },
)

TrackedLink.displayName = 'TrackedLink'

interface TrackedExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  trackingName: string
  trackingLocation: string
}

export const TrackedExternalLink = forwardRef<
  HTMLAnchorElement,
  TrackedExternalLinkProps
>(
  (
    {
      trackingName,
      trackingLocation,
      href,
      onClick,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const { trackCTAClick } = useAnalytics()

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      trackCTAClick(trackingName, trackingLocation, href)
      onClick?.(e)
    }

    return (
      <a
        ref={ref}
        href={href}
        onClick={handleClick}
        className={cn(className)}
        {...props}
      >
        {children}
      </a>
    )
  },
)

TrackedExternalLink.displayName = 'TrackedExternalLink'
