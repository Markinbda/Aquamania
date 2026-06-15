import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'

type RegistrationStatus = 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'INACTIVE'

type RegistrationListItem = {
  id: string
  swimmerName: string
  dateOfBirth: string
  status: RegistrationStatus
  submittedAt: string
  parentName: string
  parentEmail: string
  groupName: string | null
}

type RegistrationDetail = {
  id: string
  swimmer: {
    firstName: string
    lastName: string
    dateOfBirth: string
    medicalNotes: string | null
    status: RegistrationStatus
    groupId: string | null
    groupName: string | null
  }
  parent: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    address: string | null
    emergencyName: string | null
    emergencyPhone: string | null
  }
  consentForms: Array<{
    id: string
    formType: string
    signedAt: string | null
    signedByName: string | null
    version: string
  }>
}

type GroupOption = {
  id: string
  name: string
}

const statusOptions: Array<RegistrationStatus | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED', 'INACTIVE']

export function AdminRegistrationsPage() {
  const [items, setItems] = useState<RegistrationListItem[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RegistrationDetail | null>(null)
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('PENDING')
  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter)
    }
    if (search.trim()) {
      params.set('search', search.trim())
    }
    return params.toString()
  }, [search, statusFilter])

  async function fetchRegistrations() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/registrations${queryString ? `?${queryString}` : ''}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Could not load registrations')
      }
      const body = (await response.json()) as { data: RegistrationListItem[] }
      setItems(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load registrations')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDetail(id: string) {
    setSelectedId(id)
    setDetail(null)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${id}`, { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Could not load registration details')
      }
      const body = (await response.json()) as RegistrationDetail
      setDetail(body)
      setSelectedGroupId(body.swimmer.groupId ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load registration details')
    }
  }

  async function fetchGroups() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' })
      if (!response.ok) {
        return
      }
      const body = (await response.json()) as { data: GroupOption[] }
      setGroups(body.data)
    } catch {
      // Keep UI usable even if groups cannot be loaded.
    }
  }

  async function performAction(path: string, payload?: object) {
    if (!selectedId) {
      return
    }

    setActionLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${selectedId}/${path}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload ? JSON.stringify(payload) : undefined
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message ?? 'Action failed')
      }

      const data = (await response.json()) as { message: string }
      setMessage(data.message)
      await fetchRegistrations()
      await fetchDetail(selectedId)
      setRejectionReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    void fetchGroups()
  }, [])

  useEffect(() => {
    void fetchRegistrations()
  }, [queryString])

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Registration Review</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Review new swimmer registrations, then approve, waitlist, or reject with a clear reason.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Filter by status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as RegistrationStatus | 'ALL')}
              className="min-h-12 rounded-2xl border border-[var(--border)] px-3"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Swimmer or parent name"
              className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
            />
          </label>
        </div>

        {loading ? <p className="mt-4 text-sm text-[var(--text-muted)]">Loading registrations...</p> : null}

        <div className="mt-4 grid gap-3">
          {items.length === 0 && !loading ? (
            <p className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
              No registrations match your current filters.
            </p>
          ) : null}

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void fetchDetail(item.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === item.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-white hover:border-[var(--primary)]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{item.swimmerName}</h2>
                <span className="rounded-full bg-[var(--accent)]/15 px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Parent: {item.parentName}</p>
              <p className="text-sm text-[var(--text-muted)]">Submitted: {new Date(item.submittedAt).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      </div>

      <aside className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Registration Details</h2>

        {!detail ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Select a registration to view full parent, swimmer, and consent information.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Swimmer</h3>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">
                {detail.swimmer.firstName} {detail.swimmer.lastName}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                DOB: {new Date(detail.swimmer.dateOfBirth).toLocaleDateString()}
              </p>
              <p className="text-sm text-[var(--text-muted)]">Status: {detail.swimmer.status}</p>
              <p className="text-sm text-[var(--text-muted)]">Medical notes: {detail.swimmer.medicalNotes ?? 'None provided'}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Parent</h3>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">
                {detail.parent.firstName} {detail.parent.lastName}
              </p>
              <p className="text-sm text-[var(--text-muted)]">Email: {detail.parent.email}</p>
              <p className="text-sm text-[var(--text-muted)]">Phone: {detail.parent.phone ?? 'Not provided'}</p>
              <p className="text-sm text-[var(--text-muted)]">Emergency: {detail.parent.emergencyName ?? 'Not provided'}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Consents</h3>
              <ul className="mt-2 grid gap-2 text-sm text-[var(--text-primary)]">
                {detail.consentForms.map((consent) => (
                  <li key={consent.id} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                    {consent.formType} - {consent.signedByName ?? 'Unsigned'}
                  </li>
                ))}
              </ul>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Assign group when approving
              <select
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                className="min-h-12 rounded-2xl border border-[var(--border)] px-3"
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Rejection reason
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                className="rounded-2xl border border-[var(--border)] px-4 py-3"
                placeholder="Required when rejecting a registration"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => void performAction('approve', { groupId: selectedGroupId })}
                disabled={actionLoading || !selectedGroupId}
                className="min-h-12 rounded-2xl bg-[var(--success)] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void performAction('waitlist')}
                disabled={actionLoading}
                className="min-h-12 rounded-2xl bg-[var(--warning)] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Waitlist
              </button>
              <button
                type="button"
                onClick={() => void performAction('reject', { reason: rejectionReason })}
                disabled={actionLoading || rejectionReason.trim().length < 3}
                className="min-h-12 rounded-2xl bg-[var(--error)] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {message ? (
          <p className="mt-4 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
            {error}
          </p>
        ) : null}
      </aside>
    </section>
  )
}
