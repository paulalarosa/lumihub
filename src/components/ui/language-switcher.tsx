import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div
      className={cn(
        'flex items-center border border-border bg-background',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('pt')}
        className={cn(
          'rounded-none h-8 px-3 font-mono text-[10px] uppercase tracking-widest hover:bg-muted',
          language === 'pt'
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'text-muted-foreground',
        )}
      >
        PT
      </Button>
      <div className="h-4 w-[1px] bg-border" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-none h-8 px-3 font-mono text-[10px] uppercase tracking-widest hover:bg-muted',
          language === 'en'
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'text-muted-foreground',
        )}
      >
        EN
      </Button>
    </div>
  )
}
