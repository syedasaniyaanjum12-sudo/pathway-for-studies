// Shared by client (grading in-browser via Pyodide, all difficulties) and
// server (re-grading Interview-tier submissions independently via the
// RestrictedPython sandbox — see server/src/lib/pythonSandbox.ts). Keeping
// this in one place means the two can never silently disagree about what
// "correct" means.

/** Deep-equality check for the JSON-shaped values the Python engines produce
 * (numbers, strings, arrays, and {__type__: 'dataframe'|'series', ...}
 * objects). Numbers are compared with a relative tolerance because pandas/
 * numpy float results (means, sums over floats) can differ in the last bit
 * from summation-order alone even when the learner's logic is correct. */
export function valuesMatch(actual: unknown, expected: unknown): boolean {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return true
    return Math.abs(actual - expected) <= 1e-6 * Math.max(1, Math.abs(expected))
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === expected.length && actual.every((v, i) => valuesMatch(v, expected[i]))
  }

  if (isPlainObject(actual) && isPlainObject(expected)) {
    const actualKeys = Object.keys(actual).sort()
    const expectedKeys = Object.keys(expected).sort()
    if (actualKeys.length !== expectedKeys.length) return false
    return actualKeys.every(
      (key, i) => key === expectedKeys[i] && valuesMatch(actual[key], expected[key]),
    )
  }

  return actual === expected
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
