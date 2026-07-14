'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Student } from '@/app/generated/prisma/browser'
import { createStudent, updateStudent, deleteStudent } from './actions'

const PRESET_SUBJECTS = [
  'Methods 1/2',
  'Methods 3/4',
  'Specialist 1/2',
  'Specialist 3/4',
]

type ModalState =
  | { open: false }
  | { open: true; student: Student | null }

export default function StudentList({ students }: { students: Student[] }) {
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function openModal(student: Student | null) {
    setSelectedSubjects(student?.subjects ?? [])
    setCustomSubject('')
    setModal({ open: true, student })
  }

  function closeModal() {
    setModal({ open: false })
    setSelectedSubjects([])
    setCustomSubject('')
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    )
  }

  function addCustomSubject() {
    const trimmed = customSubject.trim()
    if (!trimmed || selectedSubjects.includes(trimmed)) return
    setSelectedSubjects(prev => [...prev, trimmed])
    setCustomSubject('')
  }

  function removeSubject(subject: string) {
    setSelectedSubjects(prev => prev.filter(s => s !== subject))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedSubjects.length === 0) return
    const fd = new FormData(e.currentTarget)
    const input = {
      name: fd.get('name') as string,
      subjects: selectedSubjects,
      defaultRateTier: fd.get('defaultRateTier') as 'REGULAR' | 'SENIOR',
    }
    startTransition(async () => {
      if (modal.open && modal.student) {
        await updateStudent(modal.student.id, input)
      } else {
        await createStudent(input)
      }
      closeModal()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteStudent(id)
      setDeletingId(null)
    })
  }

  const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted">
          {students.length} {students.length === 1 ? 'student' : 'students'}
        </p>
        <button
          onClick={() => openModal(null)}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg">No students yet.</p>
          <p className="text-sm mt-1">Click &quot;+ Add Student&quot; to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {students.map(student => (
            <li
              key={student.id}
              className="flex items-center justify-between px-4 py-3 bg-white hover:bg-badge"
            >
              <div className="flex flex-col">
                <Link
                  href={`/students/${student.id}`}
                  prefetch={false}
                  className="font-medium text-foreground hover:text-muted hover:underline transition-colors"
                >
                  {student.name}
                </Link>
                <span className="text-sm text-muted">{student.subjects.join(', ')}</span>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    student.defaultRateTier === 'SENIOR'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-badge text-badge-foreground'
                  }`}
                >
                  {student.defaultRateTier === 'SENIOR' ? 'Senior' : 'Regular'}
                </span>

                {deletingId === student.id ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted">Delete {student.name}?</span>
                      <button
                        onClick={() => handleDelete(student.id)}
                        disabled={isPending}
                        className="text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-muted">
                      Note: once sessions are added, this will also remove them from any linked sessions.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openModal(student)}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(student.id)}
                      className="text-sm text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-5 text-foreground">
              {modal.student ? 'Edit Student' : 'Add Student'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={modal.student?.name ?? ''}
                  required
                  autoFocus
                  className={inputClass}
                  placeholder="e.g. Alice Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject(s){' '}
                  {selectedSubjects.length === 0 && (
                    <span className="text-muted font-normal">(select at least one)</span>
                  )}
                </label>

                {/* Preset subject chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_SUBJECTS.map(subject => {
                    const selected = selectedSubjects.includes(subject)
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-foreground border-border hover:border-muted'
                        }`}
                      >
                        {subject}
                      </button>
                    )
                  })}
                </div>

                {/* Custom subject input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() } }}
                    placeholder="Add custom subject..."
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addCustomSubject}
                    disabled={!customSubject.trim()}
                    className="px-3 py-2 text-sm font-medium border border-border rounded-lg text-foreground hover:border-muted disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected subjects (custom ones, and any not in presets) */}
                {selectedSubjects.some(s => !PRESET_SUBJECTS.includes(s)) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSubjects
                      .filter(s => !PRESET_SUBJECTS.includes(s))
                      .map(subject => (
                        <span
                          key={subject}
                          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-primary text-white"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="ml-1 hover:text-white/70 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rate Tier</label>
                <select
                  name="defaultRateTier"
                  defaultValue={modal.student?.defaultRateTier ?? 'REGULAR'}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="SENIOR">Senior</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-muted hover:text-foreground px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || selectedSubjects.length === 0}
                  className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Saving…' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
