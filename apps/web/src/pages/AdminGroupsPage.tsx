import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Option = { id: string; name: string }
type Group = {
  id: string
  name: string
  dayOfWeek: string
  startTime: string
  endTime: string
  capacity: number
  isActive: boolean
  termName?: string | null
  programLevel?: Option
  poolLocation?: Option
  _count?: { swimmers: number; sessions: number }
}

export function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [levels, setLevels] = useState<Option[]>([])
  const [locations, setLocations] = useState<Option[]>([])
  const [instructors, setInstructors] = useState<Option[]>([])
  const [terms, setTerms] = useState<Option[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    programLevelId: '',
    poolLocationId: '',
    instructorId: '',
    dayOfWeek: 'SATURDAY',
    startTime: '09:00',
    endTime: '09:45',
    capacity: '10',
    termId: ''
  })

  async function loadAll() {
    const [groupsRes, levelsRes, locationsRes, instructorsRes, termsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/program-levels`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/pool-locations`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/instructors`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/terms`, { credentials: 'include' })
    ])

    const groupsBody = (await groupsRes.json()) as { data: Group[] }
    const levelsBody = (await levelsRes.json()) as { data: Option[] }
    const locationsBody = (await locationsRes.json()) as { data: Option[] }
    const instructorsBody = (await instructorsRes.json()) as { data: Array<Option & { firstName?: string; lastName?: string }> }
    const termsBody = (await termsRes.json()) as { data: Array<Option & { isActive?: boolean }> }

    setGroups(groupsBody.data)
    setLevels(levelsBody.data)
    setLocations(locationsBody.data)
    setInstructors(
      instructorsBody.data.map((item) => ({
        id: item.id,
        name: item.name ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()
      }))
    )
    setTerms(termsBody.data)
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function createGroup(event: FormEvent) {
    event.preventDefault()
    setMessage(null)

    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
        termId: form.termId || undefined
      })
    })

    if (response.ok) {
      setMessage('Group created')
      setForm((prev) => ({ ...prev, name: '' }))
      await loadAll()
    }
  }

  async function generateSessions(groupId: string) {
    setMessage(null)
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/generate-sessions`, {
      method: 'POST',
      credentials: 'include'
    })
    if (response.ok) {
      const body = (await response.json()) as { message: string }
      setMessage(body.message)
      await loadAll()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Group and Schedule Management</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={createGroup}>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Group name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.programLevelId} onChange={(e) => setForm((p) => ({ ...p, programLevelId: e.target.value }))} required>
            <option value="">Programme level</option>
            {levels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.poolLocationId} onChange={(e) => setForm((p) => ({ ...p, poolLocationId: e.target.value }))} required>
            <option value="">Pool location</option>
            {locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.instructorId} onChange={(e) => setForm((p) => ({ ...p, instructorId: e.target.value }))} required>
            <option value="">Instructor</option>
            {instructors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.dayOfWeek} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}>
            {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
          <input type="time" className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
          <input type="time" className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.termId} onChange={(e) => setForm((p) => ({ ...p, termId: e.target.value }))}>
            <option value="">Term (optional)</option>
            {terms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Create group</button>
        </form>
      </div>

      <div className="grid gap-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="font-semibold text-[var(--text-primary)]">{group.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{group.dayOfWeek} {group.startTime}-{group.endTime} | Capacity {group.capacity}</p>
            <p className="text-sm text-[var(--text-muted)]">Swimmers: {group._count?.swimmers ?? 0} | Sessions: {group._count?.sessions ?? 0}</p>
            <button type="button" className="mt-3 min-h-12 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white" onClick={() => void generateSessions(group.id)}>Generate sessions</button>
          </div>
        ))}
      </div>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
