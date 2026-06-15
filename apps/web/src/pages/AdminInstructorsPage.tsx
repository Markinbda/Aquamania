import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Instructor = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  employmentType: string | null
  qualifications: string | null
  certifications: string | null
  photoUrl: string | null
  notes: string | null
  groups: Array<{ id: string; name: string; dayOfWeek: string; startTime: string }>
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  bio: string
  photoUrl: string
  qualifications: string
  certifications: string
  dateOfBirth: string
  address: string
  emergencyName: string
  emergencyPhone: string
  employmentType: string
  notes: string
}

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  bio: '',
  photoUrl: '',
  qualifications: '',
  certifications: '',
  dateOfBirth: '',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
  employmentType: '',
  notes: ''
}

export function AdminInstructorsPage() {
  const [items, setItems] = useState<Instructor[]>([])
  const [selected, setSelected] = useState<Instructor | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const response = await fetch(`${API_BASE_URL}/api/instructors`, { credentials: 'include' })
    const body = (await response.json()) as { data: Instructor[] }
    setItems(body.data)
  }

  useEffect(() => {
    void load()
  }, [])

  function handleInput(key: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
    }
  }

  async function createInstructor(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          password: form.password || 'Instructor2026!'
        })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Could not create instructor')
      }

      setMessage('Instructor added')
      setForm(initialForm)
      setIsCreating(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create instructor')
    }
  }

  async function saveInstructor(event: FormEvent) {
    event.preventDefault()
    if (!selected) return

    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors/${selected.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          resetPassword: form.password || undefined
        })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Could not update instructor')
      }

      setMessage('Instructor updated')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update instructor')
    }
  }

  async function deactivate() {
    if (!selected) return

    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors/${selected.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Could not deactivate instructor')
      }

      setMessage('Instructor deactivated')
      setSelected(null)
      setForm(initialForm)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deactivate instructor')
    }
  }

  function startCreate() {
    setSelected(null)
    setIsCreating(true)
    setForm(initialForm)
  }

  function selectInstructor(item: Instructor) {
    setIsCreating(false)
    setSelected(item)
    setForm({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: item.phone ?? '',
      password: '',
      bio: '',
      photoUrl: item.photoUrl ?? '',
      qualifications: item.qualifications ?? '',
      certifications: item.certifications ?? '',
      dateOfBirth: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      employmentType: item.employmentType ?? '',
      notes: item.notes ?? ''
    })
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Instructor Management</h1>
          <button
            type="button"
            className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white"
            onClick={startCreate}
          >
            Add instructor
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectInstructor(item)}
              className={`w-full rounded-2xl border p-4 text-left ${
                selected?.id === item.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]'
              }`}
            >
              <p className="font-semibold text-[var(--text-primary)]">{item.firstName} {item.lastName}</p>
              <p className="text-sm text-[var(--text-muted)]">{item.email}</p>
              <p className="text-sm text-[var(--text-muted)]">{item.employmentType ?? 'Not set'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {isCreating ? 'New Instructor' : selected ? 'Edit Instructor' : 'Select an instructor'}
        </h2>

        {(isCreating || selected) && (
          <form className="mt-4 grid gap-3" onSubmit={isCreating ? createInstructor : saveInstructor}>
            <Input label="First name" value={form.firstName} onChange={handleInput('firstName')} required />
            <Input label="Last name" value={form.lastName} onChange={handleInput('lastName')} required />
            <Input label="Email" value={form.email} onChange={handleInput('email')} type="email" required />
            <Input label="Phone" value={form.phone} onChange={handleInput('phone')} />
            <Input label="Password (only for create/reset)" value={form.password} onChange={handleInput('password')} type="password" />
            <Input label="Photo URL" value={form.photoUrl} onChange={handleInput('photoUrl')} />
            <Input label="Qualifications" value={form.qualifications} onChange={handleInput('qualifications')} />
            <Input label="Certifications" value={form.certifications} onChange={handleInput('certifications')} />
            <Input label="Employment type" value={form.employmentType} onChange={handleInput('employmentType')} />
            <Input label="Address" value={form.address} onChange={handleInput('address')} />
            <Input label="Emergency contact name" value={form.emergencyName} onChange={handleInput('emergencyName')} />
            <Input label="Emergency contact phone" value={form.emergencyPhone} onChange={handleInput('emergencyPhone')} />
            <Input label="Date of birth" value={form.dateOfBirth} onChange={handleInput('dateOfBirth')} type="date" />
            <TextArea label="Bio" value={form.bio} onChange={handleInput('bio')} />
            <TextArea label="Admin notes" value={form.notes} onChange={handleInput('notes')} />

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="submit" className="min-h-12 rounded-2xl bg-[var(--success)] px-4 text-base font-semibold text-white">
                {isCreating ? 'Create instructor' : 'Save changes'}
              </button>

              {!isCreating && selected ? (
                <button
                  type="button"
                  className="min-h-12 rounded-2xl bg-[var(--error)] px-4 text-base font-semibold text-white"
                  onClick={() => void deactivate()}
                >
                  Deactivate instructor
                </button>
              ) : null}
            </div>
          </form>
        )}

        {selected ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)]">Assigned groups</h3>
            <ul className="mt-2 grid gap-2 text-sm text-[var(--text-primary)]">
              {selected.groups.length === 0 ? <li>No groups assigned.</li> : null}
              {selected.groups.map((group) => (
                <li key={group.id}>{group.name} ({group.dayOfWeek} {group.startTime})</li>
              ))}
            </ul>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
      </div>
    </section>
  )
}

type InputProps = {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: 'text' | 'email' | 'password' | 'date'
  required?: boolean
}

function Input({ label, value, onChange, type = 'text', required }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
      <span>{label}</span>
      <input
        className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
        value={value}
        onChange={onChange}
        type={type}
        required={required}
      />
    </label>
  )
}

type TextAreaProps = {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

function TextArea({ label, value, onChange }: TextAreaProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
      <span>{label}</span>
      <textarea className="rounded-2xl border border-[var(--border)] px-4 py-3" rows={4} value={value} onChange={onChange} />
    </label>
  )
}
