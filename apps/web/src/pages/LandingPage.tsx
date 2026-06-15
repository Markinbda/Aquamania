import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/aquamania-logo.svg'
import poolImage1 from '../assets/Pool with kids2.jpg'
import poolImage2 from '../assets/Pool with kids3.jpg'
import poolImage3 from '../assets/Pool with kids4.jpg'

const quickActions = [
  { label: 'Register as Parent', to: '/register' },
  { label: 'Sign In', to: '/login' }
]

const facebookPageUrl = 'https://www.facebook.com/'

const carouselSlides = [
  {
    imageSrc: poolImage1,
    imageAlt: 'Aquamania instructor coaching at poolside',
    title: 'Focused poolside coaching',
    subtitle: 'Instructors guide each swimmer one-on-one with clear, simple feedback.'
  },
  {
    imageSrc: poolImage2,
    imageAlt: 'Aquamania beginner group class in the pool',
    title: 'Fun beginner classes',
    subtitle: 'Small groups help beginners build confidence and technique step by step.'
  },
  {
    imageSrc: poolImage3,
    imageAlt: 'Aquamania child learning in a small pool with instructor',
    title: 'Progressive swimmer development',
    subtitle: 'From Aquatots to Advanced, every level is tracked and managed online.'
  }
]

export function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const hasMultipleSlides = carouselSlides.length > 1

  useEffect(() => {
    if (!hasMultipleSlides) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="landing-pool-bg relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-12">
      <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[#b9d9e4] bg-white/92 p-5 shadow-sm backdrop-blur-sm md:p-8">
          <img src={logo} alt="Aquamania Swimming logo" className="h-auto w-full max-w-[360px]" />
          <p className="inline-flex rounded-full bg-[var(--primary)]/15 px-3 py-1 text-sm font-semibold text-[var(--primary-dark)]">
            Bermuda swim school platform
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl">
            Aquamania Swimming
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)] md:max-w-xl">
            Built for families, instructors, and admins to manage registrations, scheduling, payments,
            consent forms, and photos in one place.
          </p>

          <div className="mt-6 grid gap-3 md:max-w-sm">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              >
                {action.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-4">
              <p className="text-sm font-semibold text-[var(--primary-dark)]">Since 1986</p>
              <p className="text-xs text-[var(--text-muted)]">Trusted swim teaching in Bermuda.</p>
            </div>
            <div className="rounded-2xl bg-[var(--primary)]/10 p-4">
              <p className="text-sm font-semibold text-[var(--primary-dark)]">Family-first classes</p>
              <p className="text-xs text-[var(--text-muted)]">Programmes for infants, children, and adults.</p>
            </div>
            <div className="rounded-2xl bg-[var(--primary)]/10 p-4">
              <p className="text-sm font-semibold text-[var(--primary-dark)]">Simple online portal</p>
              <p className="text-xs text-[var(--text-muted)]">Registration, payments, schedules, and updates.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#b9d9e4] bg-white/92 p-4 shadow-sm backdrop-blur-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">From Our Facebook Community</h2>
            <a
              href={facebookPageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Aquamania Facebook page"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14.5 8.5h2V5.5h-2.3c-2.5 0-4.2 1.6-4.2 4.4v1.7H8v3h2v5.9h3v-5.9h2.7l.5-3H13V9.9c0-.9.4-1.4 1.5-1.4z"
                />
              </svg>
            </a>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Swipe through photos and highlights from classes and events.
          </p>

          <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="relative h-64 w-full sm:h-72">
              <img
                src={carouselSlides[activeSlide].imageSrc}
                alt={carouselSlides[activeSlide].imageAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex flex-col justify-end rounded-xl border border-white/25 bg-black/20 p-4 text-white backdrop-blur-[1px]">
                <p className="font-semibold">{carouselSlides[activeSlide].title}</p>
                <p className="text-xs text-white/90">{carouselSlides[activeSlide].subtitle}</p>
              </div>
            </div>
          </div>

          {hasMultipleSlides ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-[var(--primary-dark)] px-4 text-sm font-semibold text-white"
                onClick={() =>
                  setActiveSlide((current) =>
                    current === 0 ? carouselSlides.length - 1 : current - 1
                  )
                }
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {carouselSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === activeSlide ? 'bg-[var(--primary-dark)]' : 'bg-[#94a3b8]'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="min-h-12 rounded-2xl bg-[var(--primary-dark)] px-4 text-sm font-semibold text-white"
                onClick={() => setActiveSlide((current) => (current + 1) % carouselSlides.length)}
              >
                Next
              </button>
            </div>
          ) : null}

        </section>
      </div>
    </div>
  )
}
