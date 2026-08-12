import type { SubmissionResult } from '../../../../shared/types'

// Shared by SQL Practice and Data Analytics — both show this after a
// submission comes back from the server, so a learner can tell whether an
// Interview-tier question/exercise was independently re-graded server-side
// (Phase 6) or just recorded their own client-side result, same as every
// other difficulty.
function VerificationNote({ verification }: { verification: SubmissionResult }) {
  if (verification.gradedBy === 'server') {
    return (
      <p className="mb-2 text-xs font-medium text-indigo-600">
        🔒 Server-verified — Interview-tier submissions are independently re-run and graded server-side,
        not just self-reported.
      </p>
    )
  }
  if (verification.serverNote) {
    return <p className="mb-2 text-xs text-slate-400">{verification.serverNote}</p>
  }
  return null
}

export default VerificationNote
