type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
        This section is scaffolded and ready for feature implementation in the build sequence.
      </p>
    </section>
  )
}
