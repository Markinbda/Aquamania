import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'

type Swimmer = {
  id: string
  firstName: string
  lastName: string
  registrationStatus: string
  parentName: string
  parentEmail: string
  groupName: string | null
}

type Group = { id: string; name: string }

export function AdminSwimmersPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selectedGroup, setSelectedGroup] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const [swimmersRes, groupsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/swimmers`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' })
    ])

    const swimmersBody = (await swimmersRes.json()) as { data: Swimmer[] }
    const groupsBody = (await groupsRes.json()) as { data: Group[] }
    setSwimmers(swimmersBody.data)
    setGroups(groupsBody.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    return swimmers.filter((item) => {
      const statusMatch = status === 'ALL' || item.registrationStatus === status
      const searchMatch = !search || `${item.firstName} ${item.lastName} ${item.parentName} ${item.parentEmail}`.toLowerCase().includes(search.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [search, status, swimmers])

  async function move(swimmerId: string) {
    const groupId = selectedGroup[swimmerId]
    if (!groupId) return

    const response = await fetch(`${API_BASE_URL}/api/swimmers/${swimmerId}/group`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    })

    if (response.ok) {
      setMessage('Swimmer moved successfully')
      await load()
    }
  }

  async function markInactive(swimmerId: string) {
    const response = await fetch(`${API_BASE_URL}/api/swimmers/${swimmerId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (response.ok) {
      setMessage('Swimmer marked inactive')
      await load()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Swimmer Management</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Search swimmer or parent" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['ALL', 'PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED', 'INACTIVE'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <a className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-white" href={`${API_BASE_URL}/api/swimmers/export/csv`} target="_blank" rel="noreferrer">Export CSV</a>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((swimmer) => (
          <div key={swimmer.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="font-semibold text-[var(--text-primary)]">{swimmer.firstName} {swimmer.lastName}</p>
            <p className="text-sm text-[var(--text-muted)]">Parent: {swimmer.parentName} ({swimmer.parentEmail})</p>
            <p className="text-sm text-[var(--text-muted)]">Status: {swimmer.registrationStatus} | Group: {swimmer.groupName ?? 'None'}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={selectedGroup[swimmer.id] ?? ''} onChange={(e) => setSelectedGroup((prev) => ({ ...prev, [swimmer.id]: e.target.value }))}>
                <option value="">Move to group</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
              <button type="button" className="min-h-12 rounded-2xl bg-[var(--success)] px-4 text-white" onClick={() => void move(swimmer.id)}>Move</button>
              <button type="button" className="min-h-12 rounded-2xl bg-[var(--error)] px-4 text-white" onClick={() => void markInactive(swimmer.id)}>Mark inactive</button>
            </div>
          </div>
        ))}
      </div>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
