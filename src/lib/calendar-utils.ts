// Utility functions for calendar integration

interface EventData {
  title: string;
  description?: string | null;
  event_date: string;
  arrival_time?: string | null;
  making_of_time?: string | null;
  ceremony_time?: string | null;
  advisory_time?: string | null;
  address?: string | null;
  location?: string | null;
}

/**
 * Format time string to ICS format (HHMMSS)
 */
function formatTimeForICS(time: string | null | undefined): string {
  if (!time) return '000000';
  return time.replace(/:/g, '') + '00';
}

/**
 * Format date to ICS format (YYYYMMDD)
 */
function formatDateForICS(date: string): string {
  return date.replace(/-/g, '');
}

/**
 * Generate a unique ID for the event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@beautyagenda.app`;
}

/**
 * Create ICS content for a single event
 */
export function createICSContent(event: EventData): string {
  const uid = generateUID();
  const dateStr = formatDateForICS(event.event_date);
  
  // Use ceremony_time as main time, fallback to arrival_time
  const mainTime = event.ceremony_time || event.arrival_time || '10:00';
  const timeStr = formatTimeForICS(mainTime);
  
  // Build description with all times
  const descriptionParts: string[] = [];
  if (event.description) descriptionParts.push(event.description);
  if (event.arrival_time) descriptionParts.push(`Chegada: ${event.arrival_time}`);
  if (event.making_of_time) descriptionParts.push(`Making of: ${event.making_of_time}`);
  if (event.ceremony_time) descriptionParts.push(`Cerimônia: ${event.ceremony_time}`);
  if (event.advisory_time) descriptionParts.push(`Assessoria: ${event.advisory_time}`);
  
  const description = descriptionParts.join('\\n');
  const location = event.address || event.location || '';

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
END:VCALENDAR`;

  return icsContent;
}

/**
 * Download ICS file for an event
 */
export function downloadICSFile(event: EventData): void {
  const icsContent = createICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for an event
 */
export function getGoogleCalendarUrl(event: EventData): string {
  const dateStr = formatDateForICS(event.event_date);
  const mainTime = event.ceremony_time || event.arrival_time || '10:00';
  const timeStr = formatTimeForICS(mainTime);
  
  // Build description with all times
  const descriptionParts: string[] = [];
  if (event.description) descriptionParts.push(event.description);
  if (event.arrival_time) descriptionParts.push(`Chegada: ${event.arrival_time}`);
  if (event.making_of_time) descriptionParts.push(`Making of: ${event.making_of_time}`);
  if (event.ceremony_time) descriptionParts.push(`Cerimônia: ${event.ceremony_time}`);
  if (event.advisory_time) descriptionParts.push(`Assessoria: ${event.advisory_time}`);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${dateStr}T${timeStr}/${dateStr}T${timeStr}`,
    details: descriptionParts.join('\n'),
    location: event.address || event.location || ''
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open Google Maps with the address or coordinates
 */
export function openInMaps(address: string, latitude?: number | null, longitude?: number | null): void {
  // If we have coordinates, use them for better precision
  if (latitude && longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  
  const encodedAddress = encodeURIComponent(address);
  
  // Try to detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let url: string;
  
  if (isIOS) {
    // Apple Maps
    url = `maps://maps.apple.com/?q=${encodedAddress}`;
    // Fallback to Google Maps if Apple Maps doesn't open
    setTimeout(() => {
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }, 500);
    window.location.href = url;
  } else if (isAndroid) {
    // Google Maps on Android
    url = `geo:0,0?q=${encodedAddress}`;
    window.location.href = url;
    // Fallback
    setTimeout(() => {
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }, 500);
  } else {
    // Desktop - open Google Maps in new tab
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  }
}
