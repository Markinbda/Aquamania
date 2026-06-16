import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type CalendarView = 'day' | 'week' | 'month'
type DayKey = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

type GroupListItem = {
  id: string
  name: string
  dayOfWeek: DayKey
  startTime: string
  endTime: string
  capacity: number
  _count: {
    swimmers: number
    sessions: number
  }
  instructor: {
    id: string
    user: {
      firstName: string
      lastName: string
    }
  }
  poolLocation: {
    id: string
    name: string
  }
  programLevel: {
    id: string
    name: string
  }
  term: {
    id: string
    name: string
  } | null
}

type GroupDetail = {
  id: string
  name: string
  dayOfWeek: DayKey
  startTime: string
  endTime: string
  capacity: number
  programLevel: {
    id: string
    name: string
  }
  poolLocation: {
    id: string
    name: string
  }
  instructor: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  swimmers: Array<{
    id: string
    firstName: string
    lastName: string
    registrationStatus: 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'INACTIVE'
  }>
  sessions: Array<{
    id: string
    date: string
    isCancelled: boolean
  }>
  term: {
    id: string
    name: string
  } | null
}

type RegistrationListItem = {
  id: string
  swimmerName: string
  status: string
  parentName: string
  parentEmail: string
}

type PaymentItem = {
  id: string
  description: string
  amountDue: number
  amountPaid: number
  status: 'OUTSTANDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED'
  dueDate: string | null
  parent: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

type GroupsListResponse = { data: GroupListItem[] }
type SessionListResponse = {
  data: Array<{
    id: string
    groupId: string
    date: string
    isCancelled: boolean
    group: {
      id: string
      name: string
      startTime: string
      endTime: string
    } | null
  }>
}
type InstructorListResponse = { data: Array<{ id: string }> }
type SwimmerListResponse = { data: Array<{ id: string }> }
type RegistrationListResponse = { data: RegistrationListItem[] }
type PaymentListResponse = { data: PaymentItem[] }

type SessionItem = SessionListResponse['data'][number]

function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function atStartOfDay(value: Date) {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(value: Date, days: number) {
  const copy = new Date(value)
  copy.setDate(copy.getDate() + days)
  return copy
}

function startOfWeekMonday(value: Date) {
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return atStartOfDay(addDays(value, diff))
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(':').map((part) => Number(part))
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value
  }
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function dayHeader(value: Date) {
  return value.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function monthTitle(value: Date) {
  return value.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

function paymentBalance(payment: PaymentItem) {
  return Math.max(0, payment.amountDue - payment.amountPaid)
}

function StatTile({ title, value, subtitle, to, tone = 'neutral' }: { title: string; value: string | number; subtitle?: string; to: string; tone?: 'neutral' | 'warning' | 'error' }) {
  const toneClass =
    tone === 'warning'
      ? 'border-[var(--warning)]/30 bg-[var(--warning)]/10'
      : tone === 'error'
        ? 'border-[var(--error)]/30 bg-[var(--error)]/10'
        : 'border-[var(--border)] bg-[var(--bg)]'

  return (
    <Link to={to} className={`rounded-2xl border p-4 transition hover:border-[var(--primary)]/40 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {subtitle ? <p className="text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
    </Link>
  )
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [groups, setGroups] = useState<GroupListItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [pendingItems, setPendingItems] = useState<RegistrationListItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<GroupDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [focusDate, setFocusDate] = useState(atStartOfDay(new Date()))
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({})

  const [instructorCount, setInstructorCount] = useState(0)
  const [swimmerCount, setSwimmerCount] = useState(0)
  const [pendingRegistrations, setPendingRegistrations] = useState(0)
  const [paymentsDueCount, setPaymentsDueCount] = useState(0)
  const [paymentsOutstandingAmount, setPaymentsOutstandingAmount] = useState(0)
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0)

  async function loadDashboard() {
    setLoading(true)
    setError(null)

    try {
      const [groupsRes, instructorsRes, swimmersRes, pendingRes, paymentsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/instructors`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/swimmers`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/registrations?status=PENDING`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/payments`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/sessions`, { credentials: 'include' })
      ])

      if (!groupsRes.ok || !instructorsRes.ok || !swimmersRes.ok || !pendingRes.ok || !paymentsRes.ok || !sessionsRes.ok) {
        throw new Error('Could not load dashboard data')
      }

      const groupsBody = (await groupsRes.json()) as GroupsListResponse
      const instructorsBody = (await instructorsRes.json()) as InstructorListResponse
      const swimmersBody = (await swimmersRes.json()) as SwimmerListResponse
      const pendingBody = (await pendingRes.json()) as RegistrationListResponse
      const paymentsBody = (await paymentsRes.json()) as PaymentListResponse
      const sessionsBody = (await sessionsRes.json()) as SessionListResponse

      const duePayments = paymentsBody.data.filter((item) => ['OUTSTANDING', 'PARTIAL', 'OVERDUE'].includes(item.status))
      const outstandingAmount = duePayments.reduce((sum, item) => sum + paymentBalance(item), 0)

      const now = new Date()
      const weekAhead = addDays(now, 7)
      const nextWeekSessions = sessionsBody.data.filter((session) => {
        const date = new Date(session.date)
        return date >= now && date <= weekAhead && !session.isCancelled
      })

      setGroups(groupsBody.data)
      setSessions(sessionsBody.data)
      setPendingItems(pendingBody.data)
      setPayments(duePayments)
      setInstructorCount(instructorsBody.data.length)
      setSwimmerCount(swimmersBody.data.length)
      setPendingRegistrations(pendingBody.data.length)
      setPaymentsDueCount(duePayments.length)
      setPaymentsOutstandingAmount(outstandingAmount)
      setUpcomingSessionsCount(nextWeekSessions.length)

      setGroupAssignments((previous) => {
        const next = { ...previous }
        pendingBody.data.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = groupsBody.data[0]?.id ?? ''
          }
        })
        return next
      })

      if (!selectedGroupId) {
        const fromSessions = sessionsBody.data.find((session) => session.groupId)?.groupId
        const fallback = groupsBody.data[0]?.id
        setSelectedGroupId(fromSessions ?? fallback ?? null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  useEffect(() => {
    let active = true

    async function loadGroupDetail() {
      if (!selectedGroupId) {
        setSelectedGroupDetail(null)
        return
      }

      setDetailLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error('Could not load class details')
        }

        const body = (await response.json()) as GroupDetail
        if (active) {
          setSelectedGroupDetail(body)
        }
      } catch (detailError) {
        if (active) {
          setSelectedGroupDetail(null)
          setError(detailError instanceof Error ? detailError.message : 'Could not load class details')
        }
      } finally {
        if (active) {
          setDetailLoading(false)
        }
      }
    }

    void loadGroupDetail()

    return () => {
      active = false
    }
  }, [selectedGroupId])

  const groupsById = useMemo(() => {
    const map = new Map<string, GroupListItem>()
    for (const group of groups) {
      map.set(group.id, group)
    }
    return map
  }, [groups])

  const sessionsByDateKey = useMemo(() => {
    const map = new Map<string, SessionItem[]>()
    for (const session of sessions) {
      const key = formatDateKey(new Date(session.date))
      const existing = map.get(key) ?? []
      existing.push(session)
      map.set(key, existing)
    }

    for (const [, list] of map) {
      list.sort((a, b) => {
        const aTime = a.group?.startTime ?? ''
        const bTime = b.group?.startTime ?? ''
        return aTime.localeCompare(bTime)
      })
    }

    return map
  }, [sessions])

  const weekStart = useMemo(() => startOfWeekMonday(focusDate), [focusDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])

  const monthGridDays = useMemo(() => {
    const firstOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1)
    const gridStart = startOfWeekMonday(firstOfMonth)
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  }, [focusDate])

  const totalCapacity = useMemo(() => groups.reduce((sum, item) => sum + item.capacity, 0), [groups])
  const totalEnrolled = useMemo(() => groups.reduce((sum, item) => sum + item._count.swimmers, 0), [groups])
  const utilizationPercent = totalCapacity === 0 ? 0 : Math.round((totalEnrolled / totalCapacity) * 100)

  async function approveRegistration(swimmerId: string) {
    const groupId = groupAssignments[swimmerId]
    if (!groupId) {
      setError('Choose a group before approving a registration')
      return
    }

    setActionLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${swimmerId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groupId })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Could not approve registration')
      }

      setMessage('Registration approved')
      await loadDashboard()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not approve registration')
    } finally {
      setActionLoading(false)
    }
  }

  async function recordPayment(paymentId: string) {
    const amount = window.prompt('Amount received')
    if (!amount) {
      return
    }

    setActionLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/record`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amountPaid: Number(amount),
          paidDate: new Date().toISOString(),
          notes: 'Recorded from dashboard quick action'
        })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Could not record payment')
      }

      setMessage('Payment recorded')
      await loadDashboard()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not record payment')
    } finally {
      setActionLoading(false)
    }
  }

  async function generateSessions() {
    if (!selectedGroupId) {
      return
    }

    setActionLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/generate-sessions`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Could not generate sessions')
      }

      const body = (await response.json()) as { message: string }
      setMessage(body.message)
      await loadDashboard()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not generate sessions')
    } finally {
      setActionLoading(false)
    }
  }

  function changeFocus(direction: 'prev' | 'next') {
    const step = direction === 'next' ? 1 : -1
    if (calendarView === 'day') {
      setFocusDate((prev) => addDays(prev, step))
      return
    }
    if (calendarView === 'week') {
      setFocusDate((prev) => addDays(prev, step * 7))
      return
    }
    setFocusDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + step, 1))
  }

  function sessionCard(session: SessionItem, compact = false) {
    const group = groupsById.get(session.groupId)
    const enrolled = group?._count.swimmers ?? 0
    const capacity = group?.capacity ?? 0

    return (
      <button
        key={session.id}
        type="button"
        onClick={() => setSelectedGroupId(session.groupId)}
        className={`rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-left hover:border-[var(--primary)]/40 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <p className="font-semibold text-[var(--text-primary)]">{session.group?.name ?? 'Class'}</p>
        <p className="text-[var(--text-muted)]">
          {timeLabel(session.group?.startTime ?? '')} - {timeLabel(session.group?.endTime ?? '')}
        </p>
        <p className="text-[var(--text-muted)]">Enrolled: {enrolled}/{capacity}</p>
      </button>
    )
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Monitor classes, enrollment, finance, registrations, and document workflows in one place.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatTile title="Instructors" value={instructorCount} to="/admin/instructors" />
          <StatTile title="Swimmers" value={swimmerCount} to="/admin/swimmers" />
          <StatTile title="New Registrations" value={pendingRegistrations} to="/admin/registrations" tone="warning" />
          <StatTile title="Payments Due" value={paymentsDueCount} to="/admin/payments" tone="error" />
          <StatTile title="Outstanding Amount" value={`$${paymentsOutstandingAmount.toFixed(0)}`} to="/admin/payments" />
          <StatTile title="Capacity Utilization" value={`${utilizationPercent}%`} subtitle={`${totalEnrolled}/${totalCapacity} enrolled`} to="/admin/groups" />
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">{error}</p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Session Calendar</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFocusDate(atStartOfDay(new Date()))} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">Today</button>
              <button type="button" onClick={() => changeFocus('prev')} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">Prev</button>
              <button type="button" onClick={() => changeFocus('next')} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">Next</button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              {calendarView === 'day' ? dayHeader(focusDate) : calendarView === 'week' ? `${dayHeader(weekDays[0])} - ${dayHeader(weekDays[6])}` : monthTitle(focusDate)}
            </p>
            <div className="flex rounded-xl border border-[var(--border)] p-1">
              {(['day', 'week', 'month'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold ${calendarView === view ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)]'}`}
                >
                  {view.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? <p className="mt-4 text-sm text-[var(--text-muted)]">Loading sessions...</p> : null}

          {calendarView === 'day' ? (
            <div className="mt-4 grid gap-2">
              {(sessionsByDateKey.get(formatDateKey(focusDate)) ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--text-muted)]">No sessions for this day.</p>
              ) : (
                (sessionsByDateKey.get(formatDateKey(focusDate)) ?? []).map((session) => sessionCard(session))
              )}
            </div>
          ) : null}

          {calendarView === 'week' ? (
            <div className="mt-4 grid gap-3 md:grid-cols-7">
              {weekDays.map((day) => {
                const daySessions = sessionsByDateKey.get(formatDateKey(day)) ?? []
                return (
                  <section key={day.toISOString()} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{dayHeader(day)}</p>
                    <div className="mt-2 grid gap-2">
                      {daySessions.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)]">No sessions</p>
                      ) : (
                        daySessions.map((session) => sessionCard(session, true))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : null}

          {calendarView === 'month' ? (
            <div className="mt-4 grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <p key={label} className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
              ))}

              {monthGridDays.map((day) => {
                const dayKey = formatDateKey(day)
                const daySessions = sessionsByDateKey.get(dayKey) ?? []
                const isCurrentMonth = day.getMonth() === focusDate.getMonth()
                return (
                  <section key={day.toISOString()} className={`min-h-24 rounded-xl border p-2 ${isCurrentMonth ? 'border-[var(--border)] bg-white' : 'border-[var(--border)]/50 bg-[var(--bg)]'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setFocusDate(day)
                        setCalendarView('day')
                      }}
                      className="text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {day.getDate()}
                    </button>
                    <div className="mt-1 grid gap-1">
                      {daySessions.slice(0, 2).map((session) => sessionCard(session, true))}
                      {daySessions.length > 2 ? <p className="text-xs text-[var(--text-muted)]">+{daySessions.length - 2} more</p> : null}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : null}

          <p className="mt-4 text-xs text-[var(--text-muted)]">Upcoming sessions next 7 days: {upcomingSessionsCount}</p>
        </div>

        <aside className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Class Detail</h2>

          {detailLoading ? <p className="mt-4 text-sm text-[var(--text-muted)]">Loading class detail...</p> : null}

          {!selectedGroupDetail && !detailLoading ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Click any session in the calendar to inspect class, instructor, swimmers, and times.</p>
          ) : null}

          {selectedGroupDetail ? (
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Class</p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{selectedGroupDetail.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{selectedGroupDetail.programLevel.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {selectedGroupDetail.dayOfWeek} {timeLabel(selectedGroupDetail.startTime)} - {timeLabel(selectedGroupDetail.endTime)}
                </p>
                <p className="text-sm text-[var(--text-muted)]">Location: {selectedGroupDetail.poolLocation.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void generateSessions()}
                    disabled={actionLoading}
                    className="min-h-10 rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Generate Sessions
                  </button>
                  <Link to="/admin/groups" className="min-h-10 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                    Open groups
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Instructor</p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {selectedGroupDetail.instructor.user.firstName} {selectedGroupDetail.instructor.user.lastName}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{selectedGroupDetail.instructor.user.email}</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Swimmers</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedGroupDetail.swimmers.length}/{selectedGroupDetail.capacity} enrolled</p>
                <ul className="mt-2 grid max-h-52 gap-2 overflow-auto text-sm">
                  {selectedGroupDetail.swimmers.length === 0 ? (
                    <li className="text-[var(--text-muted)]">No swimmers enrolled yet.</li>
                  ) : (
                    selectedGroupDetail.swimmers.map((swimmer) => (
                      <li key={swimmer.id} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)]">
                        <div className="flex items-center justify-between gap-3">
                          <span>
                            {swimmer.firstName} {swimmer.lastName}
                          </span>
                          <Link
                            to={`/admin/documents?swimmerId=${swimmer.id}&template=GENERAL`}
                            className="text-xs font-semibold text-[var(--primary-dark)]"
                          >
                            Documents
                          </Link>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Upcoming Session Dates</p>
                <ul className="mt-2 grid max-h-40 gap-2 overflow-auto text-sm text-[var(--text-primary)]">
                  {selectedGroupDetail.sessions.length === 0 ? (
                    <li className="text-[var(--text-muted)]">No sessions generated yet.</li>
                  ) : (
                    selectedGroupDetail.sessions
                      .filter((session) => new Date(session.date) >= new Date())
                      .slice(0, 8)
                      .map((session) => (
                        <li key={session.id} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                          {dateLabel(session.date)} {session.isCancelled ? '(Cancelled)' : ''}
                        </li>
                      ))
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Quick Approvals</h2>
              <p className="text-sm text-[var(--text-muted)]">Approve new registrations directly from the dashboard.</p>
            </div>
            <Link to="/admin/registrations" className="text-sm font-semibold text-[var(--primary-dark)]">
              Open queue
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {pendingItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">No registrations waiting right now.</p>
            ) : (
              pendingItems.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{item.swimmerName}</p>
                      <p className="text-sm text-[var(--text-muted)]">{item.parentName} | {item.parentEmail}</p>
                    </div>
                    <Link
                      to={`/admin/documents?swimmerId=${item.id}&template=WATER_SAFETY`}
                      className="text-sm font-semibold text-[var(--primary-dark)]"
                    >
                      Documents
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <select
                      value={groupAssignments[item.id] ?? ''}
                      onChange={(event) => setGroupAssignments((previous) => ({ ...previous, [item.id]: event.target.value }))}
                      className="min-h-12 rounded-2xl border border-[var(--border)] px-3"
                    >
                      <option value="">Assign group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void approveRegistration(item.id)}
                      disabled={actionLoading || !groupAssignments[item.id]}
                      className="min-h-12 rounded-2xl bg-[var(--success)] px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Payments Due</h2>
              <p className="text-sm text-[var(--text-muted)]">Record incoming payments without leaving the dashboard.</p>
            </div>
            <Link to="/admin/payments" className="text-sm font-semibold text-[var(--primary-dark)]">
              Open ledger
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {payments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">No due payments right now.</p>
            ) : (
              payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">{payment.description}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {payment.parent.user.firstName} {payment.parent.user.lastName} | {payment.parent.user.email}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Balance: ${paymentBalance(payment).toFixed(2)} | Status: {payment.status}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void recordPayment(payment.id)}
                      disabled={actionLoading}
                      className="min-h-10 rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
