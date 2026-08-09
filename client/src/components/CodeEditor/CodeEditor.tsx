import CodeMirror, { type Extension } from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  /** Defaults to SQL. Phase 3 (Data Analytics) passes [python()] here instead
   * — the editor itself doesn't know or care which language it's editing. */
  language?: Extension
  placeholder?: string
}

// Thin wrapper around @uiw/react-codemirror (CodeMirror 6) so the rest of the
// app depends on one small component instead of CodeMirror's lower-level API
// directly. Shared between SQL Practice now and Data Analytics in Phase 3.
function CodeEditor({ value, onChange, language, placeholder }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="200px"
      extensions={[language ?? sql()]}
      onChange={onChange}
      placeholder={placeholder}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      className="overflow-hidden rounded-md border border-slate-300 text-left text-sm"
    />
  )
}

export default CodeEditor
