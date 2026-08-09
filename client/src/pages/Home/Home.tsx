import { Link } from 'react-router-dom'

const TRACKS = [
  {
    to: '/sql-practice',
    title: 'SQL Practice',
    description: 'Progressive SQL questions from basics to interview-level.',
  },
  {
    to: '/data-analytics',
    title: 'Data Analytics',
    description: 'Python data analysis with NumPy, Pandas, and Matplotlib.',
  },
  {
    to: '/ai-projects',
    title: 'AI Engineer Projects',
    description: 'A project catalog from first steps to portfolio pieces.',
  },
]

function Home() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">
        Pathway for Studies
      </h1>
      <p className="mt-2 text-slate-600">
        Pick a track to start practicing.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {TRACKS.map((track) => (
          <Link
            key={track.to}
            to={track.to}
            className="rounded-lg border border-slate-200 bg-white p-6 text-left transition hover:border-indigo-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {track.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{track.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
