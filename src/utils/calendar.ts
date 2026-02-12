export interface CalendarEvent {
  name: string;
  startDate: string;
  endDate: string;
  venue?: string | null;
  location?: string | null;
  description?: string | null;
}

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICSContent(event: CalendarEvent): string {
  const loc = [event.venue, event.location].filter(Boolean).join(', ');
  const desc = event.description || `LDA Event: ${event.name}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LDA//Labrador Darts Association//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(event.endDate)}`,
    `SUMMARY:${event.name}`,
    loc ? `LOCATION:${loc}` : '',
    `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const loc = [event.venue, event.location].filter(Boolean).join(', ');
  const desc = event.description || `LDA Event: ${event.name}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${formatICSDate(event.startDate)}/${formatICSDate(event.endDate)}`,
    details: desc,
  });
  if (loc) params.set('location', loc);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICS(event: CalendarEvent): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
