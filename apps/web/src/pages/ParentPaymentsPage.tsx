import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

type Payment = { id: string; description: string; amountDue: number; amountPaid: number; status: string; dueDate: string | null }

export function ParentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/parent/payments`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { data: Payment[] }) => setPayments(body.data))
      .catch(() => setPayments([]))
  }, [])

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payments</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">To pay, please transfer to [bank details] and use reference: [swimmer name + term]</p>
      </div>

      <div className="grid gap-3">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="font-semibold text-[var(--text-primary)]">{payment.description}</p>
            <p className="text-sm text-[var(--text-muted)]">Due: ${payment.amountDue.toFixed(2)} | Paid: ${payment.amountPaid.toFixed(2)}</p>
            <p className={`text-sm ${payment.status === 'OVERDUE' ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}`}>Status: {payment.status}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
