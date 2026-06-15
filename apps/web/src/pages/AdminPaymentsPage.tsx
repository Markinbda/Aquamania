import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Payment = {
  id: string
  description: string
  amountDue: number
  amountPaid: number
  status: string
  dueDate: string | null
  parent: { user: { firstName: string; lastName: string; email: string } }
}

type ParentOption = { id: string; name: string }

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [parents, setParents] = useState<ParentOption[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ parentId: '', description: '', amountDue: '', dueDate: '' })

  async function load() {
    const [paymentsRes, swimmersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/payments`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/swimmers`, { credentials: 'include' })
    ])

    const paymentsBody = (await paymentsRes.json()) as { data: Payment[] }
    const swimmersBody = (await swimmersRes.json()) as {
      data: Array<{ parentName: string; parentEmail: string; id: string }>
    }

    setPayments(paymentsBody.data)
    const mappedParents = swimmersBody.data.map((item) => ({ id: item.id, name: `${item.parentName} (${item.parentEmail})` }))
    setParents(mappedParents)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return payments
    return payments.filter((item) => item.status === statusFilter)
  }, [payments, statusFilter])

  async function createPayment(event: FormEvent) {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/payments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: form.parentId,
        description: form.description,
        amountDue: Number(form.amountDue),
        dueDate: form.dueDate || undefined
      })
    })

    if (response.ok) {
      setMessage('Payment record created')
      setForm({ parentId: '', description: '', amountDue: '', dueDate: '' })
      await load()
    }
  }

  async function recordPayment(id: string) {
    const amount = window.prompt('Amount received')
    if (!amount) return

    const response = await fetch(`${API_BASE_URL}/api/payments/${id}/record`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaid: Number(amount),
        paidDate: new Date().toISOString(),
        bankReference: 'BANK-REF',
        notes: 'Recorded from admin screen'
      })
    })

    if (response.ok) {
      setMessage('Payment recorded')
      await load()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payment Tracking</h1>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createPayment}>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.parentId} onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))} required>
            <option value="">Parent</option>
            {parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Amount due" value={form.amountDue} onChange={(e) => setForm((p) => ({ ...p, amountDue: e.target.value }))} required />
          <input type="date" className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Create payment</button>
        </form>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Payment records</h2>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {['ALL', 'OUTSTANDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="grid gap-3">
          {filtered.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-[var(--border)] p-4">
              <p className="font-semibold text-[var(--text-primary)]">{payment.description}</p>
              <p className="text-sm text-[var(--text-muted)]">{payment.parent.user.firstName} {payment.parent.user.lastName} ({payment.parent.user.email})</p>
              <p className="text-sm text-[var(--text-muted)]">Due: ${payment.amountDue.toFixed(2)} | Paid: ${payment.amountPaid.toFixed(2)} | Status: {payment.status}</p>
              <button type="button" className="mt-3 min-h-12 rounded-2xl bg-[var(--success)] px-4 text-sm font-semibold text-white" onClick={() => void recordPayment(payment.id)}>Record bank transfer</button>
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
