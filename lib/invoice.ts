// Builds invoice line items matching the tutor's real invoice template:
// one line per student per month, unless a student had sessions at more
// than one effective rate (e.g. solo AND group sessions), in which case
// they get one line per rate, tagged [Individual] / [Group @ $X/hr].

export type InvoiceSessionInput = {
  date: Date
  duration: number
  rateCharged: number
  studentId: number
  studentName: string
  studentCount: number // how many students were in this specific session
}

export type InvoiceLine = {
  label: string
  hours: number
  rate: number
  amount: number
}

function ordinal(day: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = day % 100
  return `${day}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`
}

function formatHoursLabel(hours: number): string {
  return hours === 1 ? '1HR' : `${hours}HRS`
}

function formatDates(entries: { day: number; duration: number }[]): string {
  const byDuration = new Map<number, number[]>()
  const order: number[] = []
  for (const e of entries) {
    if (!byDuration.has(e.duration)) {
      byDuration.set(e.duration, [])
      order.push(e.duration)
    }
    byDuration.get(e.duration)!.push(e.day)
  }
  return order
    .map(duration => {
      const days = [...byDuration.get(duration)!].sort((a, b) => a - b).map(ordinal)
      return `${days.join(', ')} - ${formatHoursLabel(duration)}`
    })
    .join(', ')
}

type RateGroup = {
  studentId: number
  studentName: string
  rate: number
  isGroup: boolean
  entries: { day: number; duration: number }[]
}

export function buildInvoiceLines(sessions: InvoiceSessionInput[]): InvoiceLine[] {
  const groupMap = new Map<string, RateGroup>()

  for (const s of sessions) {
    const rate = s.rateCharged / s.studentCount
    const isGroup = s.studentCount > 1
    const key = `${s.studentId}:${rate}:${isGroup}`
    let g = groupMap.get(key)
    if (!g) {
      g = { studentId: s.studentId, studentName: s.studentName, rate, isGroup, entries: [] }
      groupMap.set(key, g)
    }
    g.entries.push({ day: s.date.getUTCDate(), duration: s.duration })
  }

  const byStudent = new Map<number, RateGroup[]>()
  for (const g of groupMap.values()) {
    const list = byStudent.get(g.studentId) ?? []
    list.push(g)
    byStudent.set(g.studentId, list)
  }

  const studentIds = [...byStudent.keys()].sort((a, b) =>
    byStudent.get(a)![0].studentName.localeCompare(byStudent.get(b)![0].studentName)
  )

  const lines: InvoiceLine[] = []
  for (const studentId of studentIds) {
    const groups = byStudent.get(studentId)!
    const needsTag = groups.length > 1
    // Individual (solo) line first, then group lines.
    groups.sort((a, b) => Number(a.isGroup) - Number(b.isGroup))

    for (const g of groups) {
      const hours = g.entries.reduce((sum, e) => sum + e.duration, 0)
      const dates = formatDates(g.entries)
      let label = g.studentName
      if (needsTag) {
        label += g.isGroup ? ` [Group @ $${g.rate}/hr]` : ' [Individual]'
      }
      label += ` (${dates})`
      lines.push({ label, hours, rate: g.rate, amount: hours * g.rate })
    }
  }

  return lines
}
