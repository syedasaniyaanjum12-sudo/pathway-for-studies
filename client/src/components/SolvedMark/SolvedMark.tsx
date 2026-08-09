// Small checkmark shown next to an already-solved item in a list. Shared by
// the SQL Practice and Data Analytics sidebars (both list "questions you can
// select", one of which may already be solved).
function SolvedMark() {
  return (
    <span className="text-emerald-600" title="Solved" aria-label="Solved">
      ✓
    </span>
  )
}

export default SolvedMark
