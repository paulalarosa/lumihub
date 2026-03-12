import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded cursor-pointer border border-neutral-700"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  )
}
