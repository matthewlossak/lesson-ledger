'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/app/generated/prisma/browser'
import { getRate } from '@/lib/rates'
import { createSession } from './actions'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function autoRate(students: Student[], selectedIds: number[]): string {
  if (selectedIds.length === 0) return ''
  const selected = students.filter(s => selectedIds.includes(s.id))
  const tier = selected.some(s => s.defaultRateTier === 'SENIOR') ? 'SENIOR' : 'REGULAR'
  return String(getRate(tier, selectedIds.length))
}

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

export default function SessionForm({ students }: { students: Student[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rate, setRate] = useState('')
  const [rateOverridden, setRateOverridden] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleStudent(id: number) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    setRate(autoRate(students, next))
    setRateOverridden(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createSession({
        date: fd.get('date') as string,
        startTime: fd.get('startTime') as string,
        duration: fd.get('duration') as string,
        rateCharged: rate,
        note: fd.get('note') as string,
        studentIds: selectedIds,
      })
      router.push('/sessions')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Date + Start time + Duration */}
      <div className="sm:flex sm:gap-3">
        <div className="mb-4 sm:mb-0 sm:flex-1">
          <label className="block text-sm font-medium text-foreground mb-1">Date</label>
          <input
            name="date"
            type="date"
            defaultValue={todayString()}
            required
            className={inputClass}
          />
        </div>
        <div className="mb-4 sm:mb-0 sm:w-36">
          <label className="block text-sm font-medium text-foreground mb-1">Start time</label>
          <input
            name="startTime"
            type="time"
            className={inputClass}
          />
        </div>
        <div className="sm:w-36">
          <label className="block text-sm font-medium text-foreground mb-1">Duration (hrs)</label>
          <input
            name="duration"
            type="number"
            min="0.5"
            max="8"
            step="0.5"
            placeholder="e.g. 1.5"
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Student selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Student(s){' '}
          {selectedIds.length === 0 && (
            <span className="text-muted font-normal">(select at least one)</span>
          )}
        </label>
        {students.length === 0 ? (
          <p className="text-sm text-muted">No students yet. Add one first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map(student => {
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
        )}
      </div>

      {/* Rate */}
      <div className="w-48">
        <div className="flex items-baseline justify-between mb-1">
          <label className="text-sm font-medium text-foreground">Rate ($/hr)</label>
          {selectedIds.length > 0 && (
            rateOverridden ? (
              <button
                type="button"
                onClick={() => {
                  setRate(autoRate(students, selectedIds))
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

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Note <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          name="note"
          rows={2}
          placeholder="What was covered..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending || selectedIds.length === 0}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Saving…' : 'Log session'}
        </button>
      </div>
    </form>
  )
}
