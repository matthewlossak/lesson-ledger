'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { isUpcoming } from '@/lib/sessions'

export type CalendarSession = {
  id: number
  date: string
  startTime: string | null
  duration: number
  rateCharged: number
  studentNames: string
}

function addHours(isoStr: string, hours: number): string {
  return new Date(new Date(isoStr).getTime() + hours * 3600 * 1000).toISOString()
}

function toEvent(s: CalendarSession) {
  const dateStr = s.date.split('T')[0]
  const isPast = !isUpcoming(s.date, s.startTime, s.duration)
  const color = isPast ? 'var(--muted)' : 'var(--header)'

  if (!s.startTime) {
    return {
      id: String(s.id),
      title: s.studentNames,
      start: dateStr,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
    }
  }

  const start = `${dateStr}T${s.startTime}`
  return {
    id: String(s.id),
    title: s.studentNames,
    start,
    end: addHours(start, s.duration),
    backgroundColor: color,
    borderColor: color,
  }
}

export default function CalendarView({ sessions }: { sessions: CalendarSession[] }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={sessions.map(toEvent)}
      height="auto"
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      allDayText="No time set"
      nowIndicator
    />
  )
}
