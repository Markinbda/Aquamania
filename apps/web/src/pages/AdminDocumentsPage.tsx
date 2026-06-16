import { useMemo, useState } from 'react'

type DocumentTemplate = {
  key: 'WATER_SAFETY' | 'PHOTO_CONSENT' | 'MEDICAL_CONSENT' | 'GENERAL'
  title: string
  summary: string
  body: string[]
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

export function AdminDocumentsPage() {
  const [selectedKey, setSelectedKey] = useState<DocumentTemplate['key']>('WATER_SAFETY')

  const selected = useMemo(
    () => templates.find((template) => template.key === selectedKey) ?? templates[0],
    [selectedKey]
  )

  function printSelected() {
    window.print()
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Consent and registration templates available for onboarding and audit records.
        </p>

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{selected.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Document Code: {selected.key}</p>
          </div>
          <button
            type="button"
            onClick={printSelected}
            className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--primary)]/40 print:hidden"
          >
            Print
          </button>
        </div>

        <div className="mt-6 grid gap-3 text-sm leading-6 text-[var(--text-primary)]">
          {selected.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 grid gap-4 border-t border-dashed border-[var(--border)] pt-5">
          <label className="grid gap-1 text-sm text-[var(--text-muted)]">
            Parent/Guardian Name
            <div className="min-h-10 rounded-xl border border-[var(--border)]" />
          </label>
          <label className="grid gap-1 text-sm text-[var(--text-muted)]">
            Swimmer Name
            <div className="min-h-10 rounded-xl border border-[var(--border)]" />
          </label>
          <label className="grid gap-1 text-sm text-[var(--text-muted)]">
            Signature
            <div className="min-h-10 rounded-xl border border-[var(--border)]" />
          </label>
          <label className="grid gap-1 text-sm text-[var(--text-muted)]">
            Date
            <div className="min-h-10 rounded-xl border border-[var(--border)]" />
          </label>
        </div>
      </article>
    </section>
  )
}
