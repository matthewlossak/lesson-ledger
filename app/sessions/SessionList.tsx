'use client'

import { useState, useTransition } from 'react'
import type { Student } from '@/app/generated/prisma/browser'
import { getRate } from '@/lib/rates'
import { isUpcoming, formatSessionDate, formatSessionTime } from '@/lib/sessions'
import { updateSession, deleteSession } from './actions'

export type SessionRow = {
  id: number
  date: string
  startTime: string | null
  duration: number
  rateCharged: number
  note: string | null
  students: { studentId: number; student: { name: string } }[]
}

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

function autoRate(allStudents: Student[], selectedIds: number[]): string {
  if (selectedIds.length === 0) return ''
  const selected = allStudents.filter(s => selectedIds.includes(s.id))
  const tier = selected.some(s => s.defaultRateTier === 'SENIOR') ? 'SENIOR' : 'REGULAR'
  return String(getRate(tier, selectedIds.length))
}

export default function SessionList({
  sessions,
  allStudents,
}: {
  sessions: SessionRow[]
  allStudents: Student[]
}) {
  const [editingSession, setEditingSession] = useState<SessionRow | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rate, setRate] = useState('')
  const [rateOverridden, setRateOverridden] = useState(false)

  function openEdit(session: SessionRow) {
    const ids = session.students.map(ss => ss.studentId)
    setSelectedIds(ids)
    setRate(String(session.rateCharged))
    setRateOverridden(false)
    setEditingSession(session)
  }

  function closeEdit() {
    setEditingSession(null)
    setSelectedIds([])
    setRate('')
    setRateOverridden(false)
  }

  function toggleStudent(id: number) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    setRate(autoRate(allStudents, next))
    setRateOverridden(false)
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingSession || selectedIds.length === 0) return
    const fd = new FormData(e.currentTarget)
    const id = editingSession.id
    startTransition(async () => {
      await updateSession(id, {
        date: fd.get('date') as string,
        startTime: fd.get('startTime') as string,
        duration: fd.get('duration') as string,
        rateCharged: rate,
        note: fd.get('note') as string,
        studentIds: selectedIds,
      })
      closeEdit()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteSession(id)
      setDeletingId(null)
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p>No sessions yet.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {sessions.map(session => {
          const earnings = session.duration * session.rateCharged
          const studentNames = session.students.map(ss => ss.student.name).join(', ')
          const upcoming = isUpcoming(session.date, session.startTime, session.duration)
          const formattedDate = formatSessionDate(session.date, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          const formattedTime = session.startTime ? formatSessionTime(session.startTime) : null

          return (
            <li key={session.id} className={`px-4 py-3 ${upcoming ? 'bg-badge' : 'bg-white'} hover:bg-badge`}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{studentNames}</span>
                    {upcoming && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted">
                    {formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}
                  </span>
                  {session.note && (
                    <span className="text-sm text-muted mt-1">{session.note}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0 ml-4">
                  <span className={`font-medium ${upcoming ? 'text-muted' : 'text-foreground'}`}>
                    ${earnings.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted">
                    {session.duration}h @ ${session.rateCharged}/hr
                  </span>
                  {deletingId === session.id ? (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="text-muted">Delete?</span>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={isPending}
                        className="text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => openEdit(session)}
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(session.id)}
                        className="text-sm text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {editingSession && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-5 text-foreground">Edit Session</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">

              <div className="sm:flex sm:gap-3">
                <div className="mb-3 sm:mb-0 sm:flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={editingSession.date.split('T')[0]}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="mb-3 sm:mb-0 sm:w-28">
                  <label className="block text-sm font-medium text-foreground mb-1">Start time</label>
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={editingSession.startTime ?? ''}
                    className={inputClass}
                  />
                </div>
                <div className="sm:w-28">
                  <label className="block text-sm font-medium text-foreground mb-1">Duration (hrs)</label>
                  <input
                    name="duration"
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.25"
                    defaultValue={editingSession.duration}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Student(s){' '}
                  {selectedIds.length === 0 && (
                    <span className="text-muted font-normal">(select at least one)</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {allStudents.map(student => {
                    const selected = selectedIds.includes(student.id)
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-foreground border-border hover:border-muted'
                        }`}
                      >
                        {student.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="w-48">
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-sm font-medium text-foreground">Rate ($/hr)</label>
                  {selectedIds.length > 0 && (
                    rateOverridden ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRate(autoRate(allStudents, selectedIds))
                          setRateOverridden(false)
                        }}
                        className="text-xs text-muted hover:text-foreground transition-colors"
                      >
                        Reset to default
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRateOverridden(true)}
                        className="text-xs text-muted hover:text-foreground transition-colors"
                      >
                        Override
                      </button>
                    )
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={rate}
                  readOnly={!rateOverridden}
                  onChange={e => setRate(e.target.value)}
                  placeholder="—"
                  required
                  className={`w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none transition-colors ${
                    rateOverridden
                      ? 'bg-white focus:ring-2 focus:ring-primary'
                      : 'bg-badge cursor-default select-none'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Note <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={editingSession.note ?? ''}
                  placeholder="What was covered..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="text-sm text-muted hover:text-foreground px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || selectedIds.length === 0}
                  className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
