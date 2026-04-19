export type LeadTemperature = 'hot' | 'warm' | 'cold'

export interface TemperatureMeta {
  temperature: LeadTemperature
  label: string
  icon: string
  colorClass: string
  borderClass: string
}

export function getLeadTemperature(score: number | null | undefined): TemperatureMeta {
  const s = score ?? 0
  if (s >= 70) {
    return {
      temperature: 'hot',
      label: 'Quente',
      icon: '🔥',
      colorClass: 'text-red-400',
      borderClass: 'border-red-500/40',
    }
  }
  if (s >= 40) {
    return {
      temperature: 'warm',
      label: 'Morno',
      icon: '⚡',
      colorClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/40',
    }
  }
  return {
    temperature: 'cold',
    label: 'Frio',
    icon: '❄️',
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-500/30',
  }
}
