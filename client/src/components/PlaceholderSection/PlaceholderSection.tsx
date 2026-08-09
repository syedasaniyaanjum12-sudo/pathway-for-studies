type PlaceholderSectionProps = {
  title: string
  description: string
  upcomingPhase: string
}

// Temporary stand-in for a section's real content. Every Phase-0 page uses
// this instead of duplicating the same "coming soon" markup three times, and
// each later phase deletes exactly one usage of it when it builds the real
// page (e.g. Phase 1 replaces this inside SqlPractice.tsx).
function PlaceholderSection({
  title,
  description,
  upcomingPhase,
}: PlaceholderSectionProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>
      <p className="mt-4 text-sm text-slate-400">{upcomingPhase}</p>
    </section>
  )
}

export default PlaceholderSection
