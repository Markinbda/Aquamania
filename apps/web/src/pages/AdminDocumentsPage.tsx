import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type DocumentTemplateKey = 'WATER_SAFETY' | 'PHOTO_CONSENT' | 'MEDICAL_CONSENT' | 'GENERAL'

type DocumentTemplate = {
  key: DocumentTemplateKey
  title: string
  summary: string
  body: string[]
}

type SwimmerOption = {
  id: string
  firstName: string
  lastName: string
  parentName: string
  registrationStatus: string
}

type SwimmerDetail = {
  data: {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    medicalNotes: string | null
    registrationStatus: string
    parent: {
      address: string | null
      emergencyName: string | null
      emergencyPhone: string | null
      user: {
        firstName: string
        lastName: string
        email: string
        phone: string | null
      }
    }
    consentForms: Array<{
      id: string
      formType: string
      signedAt: string | null
      signedByName: string | null
      version: string
    }>
  }
}

const templates: DocumentTemplate[] = [
  {
    key: 'WATER_SAFETY',
    title: 'Water Safety Agreement',
    summary: 'Parent acknowledgement of pool rules, supervision expectations, and safety conduct.',
    body: [
      'I acknowledge that aquatic activity carries inherent risk and I agree to follow all pool and instructor safety directions.',
      'I understand that guardians must remain on site for swimmer sessions unless written permission is provided by Aquamania.',
      'I confirm that my child will arrive prepared for class and will only participate when medically fit to do so.',
      'I agree that repeated unsafe behavior may result in temporary suspension from lessons for the protection of all swimmers.'
    ]
  },
  {
    key: 'PHOTO_CONSENT',
    title: 'Photo and Media Consent',
    summary: 'Permission settings for class photos, promotional use, and social media sharing.',
    body: [
      'I consent to Aquamania taking photos or videos during lessons for coaching review and progress documentation.',
      'I authorize optional use of selected media for Aquamania website, social pages, and print promotions.',
      'I understand no private medical or financial information will be published with my child image.',
      'I may withdraw this consent in writing at any time for future media use.'
    ]
  },
  {
    key: 'MEDICAL_CONSENT',
    title: 'Medical and Emergency Consent',
    summary: 'Medical declaration and emergency treatment authorization for sessions and events.',
    body: [
      'I confirm all relevant medical conditions, allergies, and care instructions have been disclosed accurately.',
      'I authorize Aquamania staff to contact emergency services if urgent treatment is required.',
      'I understand every effort will be made to contact me or my emergency contact immediately.',
      'I agree to keep all medical and emergency contact details current throughout the program term.'
    ]
  },
  {
    key: 'GENERAL',
    title: 'General Program Terms and Consent',
    summary: 'Core terms covering conduct, scheduling, cancellations, and parent responsibilities.',
    body: [
      'I agree to Aquamania terms regarding punctual attendance, respectful conduct, and coach instructions.',
      'I understand makeup sessions are subject to availability and weather or safety cancellations may be unavoidable.',
      'I acknowledge fees, billing dates, and payment obligations under the enrolled term or package.',
      'I consent to digital record-keeping for attendance, payments, and registration administration.'
    ]
  }
]

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Not provided'
  }
  return new Date(value).toLocaleDateString()
}

export function AdminDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedKey, setSelectedKey] = useState<DocumentTemplateKey>(() => {
    const initial = searchParams.get('template') as DocumentTemplateKey | null
    return templates.some((template) => template.key === initial) ? (initial as DocumentTemplateKey) : 'WATER_SAFETY'
  })
  const [swimmers, setSwimmers] = useState<SwimmerOption[]>([])
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string>(() => searchParams.get('swimmerId') ?? '')
  const [detail, setDetail] = useState<SwimmerDetail['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = useMemo(
    () => templates.find((template) => template.key === selectedKey) ?? templates[0],
    [selectedKey]
  )

  useEffect(() => {
    let active = true

    async function loadSwimmers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/swimmers`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error('Could not load swimmers')
        }

        const body = (await response.json()) as { data: SwimmerOption[] }
        if (!active) {
          return
        }

        setSwimmers(body.data)
        if (!selectedSwimmerId && body.data.length > 0) {
          setSelectedSwimmerId(body.data[0].id)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load swimmers')
        }
      }
    }

    void loadSwimmers()

    return () => {
      active = false
    }
  }, [selectedSwimmerId])

  useEffect(() => {
    let active = true

    async function loadDetail() {
      if (!selectedSwimmerId) {
        setDetail(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/swimmers/${selectedSwimmerId}`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error('Could not load swimmer details')
        }

        const body = (await response.json()) as SwimmerDetail
        if (active) {
          setDetail(body.data)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load swimmer details')
          setDetail(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [selectedSwimmerId])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (selectedSwimmerId) {
      next.set('swimmerId', selectedSwimmerId)
    } else {
      next.delete('swimmerId')
    }
    next.set('template', selectedKey)
    setSearchParams(next, { replace: true })
  }, [searchParams, selectedKey, selectedSwimmerId, setSearchParams])

  function downloadPdf() {
    if (!detail) {
      return
    }

    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 48
    const maxWidth = 516
    let y = 56

    function ensureSpace(required = 24) {
      if (y + required <= 740) {
        return
      }
      doc.addPage()
      y = 56
    }

    function writeBlock(text: string, size = 11, gap = 18) {
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, maxWidth)
      ensureSpace(lines.length * gap)
      doc.text(lines, margin, y)
      y += lines.length * gap
    }

    const parentName = `${detail.parent.user.firstName} ${detail.parent.user.lastName}`

    doc.setFontSize(20)
    doc.text(selected.title, margin, y)
    y += 28
    doc.setFontSize(11)
    doc.text(`Aquamania | Document Code: ${selected.key}`, margin, y)
    y += 22

    writeBlock(`Parent/Guardian: ${parentName}`)
    writeBlock(`Swimmer: ${detail.firstName} ${detail.lastName}`)
    writeBlock(`Status: ${detail.registrationStatus}`)
    writeBlock(`Email: ${detail.parent.user.email}`)
    writeBlock(`Phone: ${detail.parent.user.phone ?? 'Not provided'}`)
    writeBlock(`Address: ${detail.parent.address ?? 'Not provided'}`)
    writeBlock(`Emergency Contact: ${detail.parent.emergencyName ?? 'Not provided'} | ${detail.parent.emergencyPhone ?? 'Not provided'}`)
    writeBlock(`Date of Birth: ${formatDate(detail.dateOfBirth)}`)
    writeBlock(`Medical Notes: ${detail.medicalNotes ?? 'None provided'}`)
    y += 8

    selected.body.forEach((paragraph) => {
      writeBlock(paragraph)
      y += 4
    })

    y += 12
    writeBlock('Consent History On File', 13, 18)
    detail.consentForms.forEach((form) => {
      writeBlock(`${form.formType}: ${form.signedByName ?? 'Unsigned'} | Signed: ${formatDate(form.signedAt)} | Version: ${form.version}`)
    })

    y += 18
    ensureSpace(80)
    doc.line(margin, y, margin + 220, y)
    doc.line(margin + 260, y, margin + 420, y)
    y += 14
    doc.setFontSize(10)
    doc.text('Parent/Guardian Signature', margin, y)
    doc.text('Date', margin + 260, y)

    doc.save(`aquamania-${selected.key.toLowerCase()}-${detail.lastName.toLowerCase()}.pdf`)
  }

  function printSelected() {
    window.print()
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-6 print:hidden">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Pre-fill consent and registration templates from swimmer records, then print or download as PDF.
        </p>

        <label className="mt-4 grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
          Select swimmer
          <select
            value={selectedSwimmerId}
            onChange={(event) => setSelectedSwimmerId(event.target.value)}
            className="min-h-12 rounded-2xl border border-[var(--border)] px-3"
          >
            <option value="">Choose swimmer</option>
            {swimmers.map((swimmer) => (
              <option key={swimmer.id} value={swimmer.id}>
                {swimmer.firstName} {swimmer.lastName} | {swimmer.parentName}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-3">
          {templates.map((template) => {
            const active = template.key === selected.key
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => setSelectedKey(template.key)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] bg-white hover:border-[var(--primary)]/40'
                }`}
              >
                <p className="font-semibold text-[var(--text-primary)]">{template.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{template.summary}</p>
              </button>
            )
          })}
        </div>
      </aside>

      <article className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8 print:shadow-none">
        <div className="flex items-start justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{selected.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Document Code: {selected.key}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!detail}
              className="min-h-10 rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={printSelected}
              disabled={!detail}
              className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-50"
            >
              Print
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)] print:hidden">
            {error}
          </p>
        ) : null}

        {loading ? <p className="mt-4 text-sm text-[var(--text-muted)] print:hidden">Loading document data...</p> : null}

        {detail ? (
          <div className="mt-6 grid gap-5">
            <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Parent / Guardian</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">
                  {detail.parent.user.firstName} {detail.parent.user.lastName}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{detail.parent.user.email}</p>
                <p className="text-sm text-[var(--text-muted)]">{detail.parent.user.phone ?? 'No phone on file'}</p>
                <p className="text-sm text-[var(--text-muted)]">{detail.parent.address ?? 'No address on file'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Swimmer</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">
                  {detail.firstName} {detail.lastName}
                </p>
                <p className="text-sm text-[var(--text-muted)]">DOB: {formatDate(detail.dateOfBirth)}</p>
                <p className="text-sm text-[var(--text-muted)]">Status: {detail.registrationStatus}</p>
                <p className="text-sm text-[var(--text-muted)]">Medical notes: {detail.medicalNotes ?? 'None provided'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{selected.title}</h3>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--text-primary)]">
                {selected.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Consent History On File</h3>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--text-primary)]">
                {detail.consentForms.map((form) => (
                  <li key={form.id} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                    {form.formType} | Signed by {form.signedByName ?? 'Unsigned'} | {formatDate(form.signedAt)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 border-t border-dashed border-[var(--border)] pt-5 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-[var(--text-muted)]">
                Parent/Guardian Name
                <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)]">
                  {detail.parent.user.firstName} {detail.parent.user.lastName}
                </div>
              </label>
              <label className="grid gap-1 text-sm text-[var(--text-muted)]">
                Swimmer Name
                <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)]">
                  {detail.firstName} {detail.lastName}
                </div>
              </label>
              <label className="grid gap-1 text-sm text-[var(--text-muted)] md:col-span-2">
                Signature
                <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white" />
              </label>
              <label className="grid gap-1 text-sm text-[var(--text-muted)]">
                Emergency Contact
                <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)]">
                  {detail.parent.emergencyName ?? 'Not provided'} | {detail.parent.emergencyPhone ?? 'Not provided'}
                </div>
              </label>
              <label className="grid gap-1 text-sm text-[var(--text-muted)]">
                Date
                <div className="min-h-10 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)]">
                  {formatDate(new Date().toISOString())}
                </div>
              </label>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--text-muted)]">Select a swimmer to pre-fill the document.</p>
        )}
      </article>
    </section>
  )
}
