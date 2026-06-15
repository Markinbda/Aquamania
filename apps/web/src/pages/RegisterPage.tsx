import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type ConsentType = 'WATER_SAFETY' | 'PHOTO_CONSENT' | 'MEDICAL_CONSENT' | 'GENERAL'

type RegistrationPayload = {
  account: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }
  parentProfile: {
    address?: string
    emergencyName?: string
    emergencyPhone?: string
  }
  swimmer: {
    firstName: string
    lastName: string
    dateOfBirth: string
    medicalNotes?: string
  }
  consent: {
    signedByName: string
    formTypes: ConsentType[]
    signatureAccepted: true
  }
}

const requiredConsentTypes: ConsentType[] = ['WATER_SAFETY', 'PHOTO_CONSENT', 'MEDICAL_CONSENT', 'GENERAL']
const stepTitles = ['Account', 'Swimmer', 'Consent', 'Confirm']

export function RegisterPage() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  })

  const [parentProfile, setParentProfile] = useState({
    address: '',
    emergencyName: '',
    emergencyPhone: ''
  })

  const [swimmer, setSwimmer] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    medicalNotes: ''
  })

  const [consent, setConsent] = useState({
    signedByName: '',
    signatureAccepted: false,
    formTypes: requiredConsentTypes as ConsentType[]
  })

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(account.firstName && account.lastName && account.email && account.password.length >= 8)
    }
    if (step === 1) {
      return Boolean(swimmer.firstName && swimmer.lastName && swimmer.dateOfBirth)
    }
    if (step === 2) {
      return Boolean(consent.signedByName && consent.signatureAccepted)
    }
    return true
  }, [account, consent, step, swimmer])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!consent.signatureAccepted) {
      setErrorMessage('Please accept the consent statement before submitting.')
      return
    }

    const payload: RegistrationPayload = {
      account: {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        password: account.password,
        phone: account.phone || undefined
      },
      parentProfile: {
        address: parentProfile.address || undefined,
        emergencyName: parentProfile.emergencyName || undefined,
        emergencyPhone: parentProfile.emergencyPhone || undefined
      },
      swimmer: {
        firstName: swimmer.firstName,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        medicalNotes: swimmer.medicalNotes || undefined
      },
      consent: {
        signedByName: consent.signedByName,
        formTypes: consent.formTypes,
        signatureAccepted: true
      }
    }

    try {
      setSubmitting(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Unable to submit registration right now.')
      }

      setSuccessMessage('Registration submitted. We will review your details and contact you soon.')
      setStep(3)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 md:px-8">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Parent Registration</h1>
        <p className="mt-2 text-base text-[var(--text-muted)]">
          Complete all steps to submit your swimmer registration for review.
        </p>

        <ol className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {stepTitles.map((title, index) => (
            <li
              key={title}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                index === step
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-dark)]'
                  : 'border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {index + 1}. {title}
            </li>
          ))}
        </ol>

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
            {successMessage}
          </p>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          {step === 0 ? (
            <>
              <Input
                label="Parent first name"
                value={account.firstName}
                onChange={(value) => setAccount((prev) => ({ ...prev, firstName: value }))}
              />
              <Input
                label="Parent last name"
                value={account.lastName}
                onChange={(value) => setAccount((prev) => ({ ...prev, lastName: value }))}
              />
              <Input
                label="Email address"
                type="email"
                value={account.email}
                onChange={(value) => setAccount((prev) => ({ ...prev, email: value }))}
              />
              <Input
                label="Create password"
                type="password"
                hint="At least 8 characters"
                value={account.password}
                onChange={(value) => setAccount((prev) => ({ ...prev, password: value }))}
              />
              <Input
                label="Phone (optional)"
                value={account.phone}
                onChange={(value) => setAccount((prev) => ({ ...prev, phone: value }))}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Input
                label="Swimmer first name"
                value={swimmer.firstName}
                onChange={(value) => setSwimmer((prev) => ({ ...prev, firstName: value }))}
              />
              <Input
                label="Swimmer last name"
                value={swimmer.lastName}
                onChange={(value) => setSwimmer((prev) => ({ ...prev, lastName: value }))}
              />
              <Input
                label="Swimmer date of birth"
                type="date"
                value={swimmer.dateOfBirth}
                onChange={(value) => setSwimmer((prev) => ({ ...prev, dateOfBirth: value }))}
              />
              <Input
                label="Medical notes (optional)"
                value={swimmer.medicalNotes}
                onChange={(value) => setSwimmer((prev) => ({ ...prev, medicalNotes: value }))}
              />
              <Input
                label="Address (optional)"
                value={parentProfile.address}
                onChange={(value) => setParentProfile((prev) => ({ ...prev, address: value }))}
              />
              <Input
                label="Emergency contact name (optional)"
                value={parentProfile.emergencyName}
                onChange={(value) => setParentProfile((prev) => ({ ...prev, emergencyName: value }))}
              />
              <Input
                label="Emergency contact phone (optional)"
                value={parentProfile.emergencyPhone}
                onChange={(value) => setParentProfile((prev) => ({ ...prev, emergencyPhone: value }))}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--text-muted)]">
                The following forms are included in your registration and will be signed electronically now:
                <ul className="mt-2 list-disc pl-5">
                  <li>Water Safety Disclaimer</li>
                  <li>Photo Consent</li>
                  <li>Medical / First Aid Consent</li>
                  <li>General Registration Consent</li>
                </ul>
              </div>

              <Input
                label="Type your full name to sign"
                value={consent.signedByName}
                onChange={(value) => setConsent((prev) => ({ ...prev, signedByName: value }))}
              />

              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={consent.signatureAccepted}
                  onChange={(event) => setConsent((prev) => ({ ...prev, signatureAccepted: event.target.checked }))}
                />
                I confirm the information is correct and I agree to all consent statements above.
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-4 text-sm text-[var(--text-primary)]">
              Your registration is now in review. You can return to the login page after your account is approved.
            </div>
          ) : null}

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {step > 0 && step < 3 ? (
              <button
                type="button"
                className="min-h-12 rounded-2xl border border-[var(--border)] px-4 text-base font-semibold"
                onClick={() => setStep((current) => current - 1)}
              >
                Back
              </button>
            ) : null}

            {step < 2 ? (
              <button
                type="button"
                disabled={!canContinue}
                className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white disabled:opacity-50"
                onClick={() => setStep((current) => current + 1)}
              >
                Continue
              </button>
            ) : null}

            {step === 2 ? (
              <button
                type="submit"
                disabled={!canContinue || submitting}
                className="min-h-12 rounded-2xl bg-[var(--accent)] px-4 text-base font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            ) : null}

            {step === 3 ? (
              <Link
                to="/login"
                className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white"
              >
                Go to Login
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}

type InputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'date'
  hint?: string
}

function Input({ label, value, onChange, type = 'text', hint }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      <input
        className="min-h-12 rounded-2xl border border-[var(--border)] px-4 text-base text-[var(--text-primary)] outline-none ring-[var(--primary)] focus:ring-2"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="text-xs font-normal text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  )
}
