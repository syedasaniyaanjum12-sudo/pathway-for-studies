type EmptyStateProps = {
  message: string
  onClear?: () => void
}

// Shared by all three track pages — shown when a search/filter combination
// matches nothing, instead of each page silently rendering an empty list.
function EmptyState({ message, onClear }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default EmptyState
