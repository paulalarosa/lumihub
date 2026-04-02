interface EventData {
  title: string
  description?: string | null
  event_date: string
  arrival_time?: string | null
  making_of_time?: string | null
  ceremony_time?: string | null
  advisory_time?: string | null
  address?: string | null
  location?: string | null
}

function formatTimeForICS(time: string | null | undefined): string {
  if (!time) return '000000'
  return time.replace(/:/g, '') + '00'
}

function formatDateForICS(date: string): string {
  return date.replace(/-/g, '')
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@beautyagenda.app`
}

export function createICSContent(event: EventData): string {
  const uid = generateUID()
  const dateStr = formatDateForICS(event.event_date)

  const mainTime = event.ceremony_time || event.arrival_time || '10:00'
  const timeStr = formatTimeForICS(mainTime)

  const descriptionParts: string[] = []
  if (event.description) descriptionParts.push(event.description)
  if (event.arrival_time)
    descriptionParts.push(`Chegada: ${event.arrival_time}`)
  if (event.making_of_time)
    descriptionParts.push(`Making of: ${event.making_of_time}`)
  if (event.ceremony_time)
    descriptionParts.push(`Cerimônia: ${event.ceremony_time}`)
  if (event.advisory_time)
    descriptionParts.push(`Assessoria: ${event.advisory_time}`)

  const description = descriptionParts.join('\\n')
  const location = event.address || event.location || ''

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Beauty Agenda//Event//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dateStr}T${timeStr}
SUMMARY:${event.title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`

  return icsContent
}

export function downloadICSFile(event: EventData): void {
  const icsContent = createICSContent(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getGoogleCalendarUrl(event: EventData): string {
  const dateStr = formatDateForICS(event.event_date)
  const mainTime = event.ceremony_time || event.arrival_time || '10:00'
  const timeStr = formatTimeForICS(mainTime)

  const descriptionParts: string[] = []
  if (event.description) descriptionParts.push(event.description)
  if (event.arrival_time)
    descriptionParts.push(`Chegada: ${event.arrival_time}`)
  if (event.making_of_time)
    descriptionParts.push(`Making of: ${event.making_of_time}`)
  if (event.ceremony_time)
    descriptionParts.push(`Cerimônia: ${event.ceremony_time}`)
  if (event.advisory_time)
    descriptionParts.push(`Assessoria: ${event.advisory_time}`)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${dateStr}T${timeStr}/${dateStr}T${timeStr}`,
    details: descriptionParts.join('\n'),
    location: event.address || event.location || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function openInMaps(
  address: string,
  latitude?: number | null,
  longitude?: number | null,
): void {
  if (latitude && longitude) {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      '_blank',
      'noopener,noreferrer',
    )
  } else {
    const encodedAddress = encodeURIComponent(address)
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      '_blank',
      'noopener,noreferrer',
    )
  }
}
