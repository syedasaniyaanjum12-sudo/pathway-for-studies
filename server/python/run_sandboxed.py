"""Runs one learner (or solution) Python submission inside a RestrictedPython
sandbox, for Interview-tier Data Analytics exercises re-graded server-side
(see server/src/lib/pythonSandbox.ts and docs/PLAN.md's Phase 6 section).

SECURITY POSTURE — read before relying on this for anything beyond a
single-user local learning app:

RestrictedPython blocks the classic sandbox-escape vector (reaching
__class__/__globals__/__subclasses__ etc. to get back to unrestricted code,
e.g. `().__class__.__bases__[0].__subclasses__()`) via safer_getattr, and
disallows `import` of anything not explicitly provided. That is real
protection against casual/accidental misuse. It is NOT container-grade
isolation: this process still runs as the same OS user as the server, with
whatever filesystem/network access that user has. RestrictedPython has had
real historical bypasses, and a subprocess timeout (enforced by the Node
caller) only bounds *time*, not access. Do not expose this to untrusted
users on the internet without real isolation (a container with no network
and a read-only filesystem, gVisor/Firecracker, etc.) in front of it.

Communication: reads one JSON object from stdin — {code, checkVar,
datasets: [{variable, file}]} where `file` is already a real, resolved
filesystem path (path resolution happens in Node, not here) — and writes
one JSON object to stdout: {stdout, error, value}.
"""
import sys
import io
import json
import traceback

from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.Guards import safer_getattr, guarded_iter_unpack_sequence, guarded_unpack_sequence
from RestrictedPython.Eval import default_guarded_getiter
from RestrictedPython.PrintCollector import PrintCollector

import pandas as pd
import numpy as np


class _NoOpPlot:
    """Stand-in for matplotlib.pyplot. Only the `result` variable's value is
    graded server-side (the learner already saw the real rendered plot
    client-side via Pyodide — see client/src/lib/pythonEngine.ts), so a
    solution's plt.plot(...)/plt.hist(...) calls just need to not crash,
    not actually render anything. Avoids needing matplotlib installed
    server-side at all."""

    def __getattr__(self, _name):
        def _noop(*_args, **_kwargs):
            return None
        return _noop


def _to_jsonable(value):
    if isinstance(value, pd.DataFrame):
        return {
            '__type__': 'dataframe',
            'index': [str(i) for i in value.index],
            'columns': [str(c) for c in value.columns],
            'rows': value.values.tolist(),
        }
    if isinstance(value, pd.Series):
        return {
            '__type__': 'series',
            'name': value.name,
            'index': [str(i) for i in value.index],
            'values': value.tolist(),
        }
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (int, float, str, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        return [_to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _to_jsonable(v) for k, v in value.items()}
    return str(value)


def run(code, check_var, datasets):
    # safe_globals ships RestrictedPython's own restricted __builtins__;
    # the guard hooks below (_getattr_, _getitem_, etc.) are what let
    # otherwise-ordinary code — attribute access, subscripting, for loops —
    # run at all under compile_restricted, while safer_getattr specifically
    # blocks dunder-attribute access (the sandbox-escape vector).
    restricted_globals = dict(safe_globals)
    # compile_restricted rewrites every print(...) call to go through a
    # `_print_`-provided collector instead of the real builtin, regardless
    # of what's in __builtins__ — this is that hook. Accumulated output
    # ends up on the `_print` object RestrictedPython injects, read back
    # below (real captured stdout serves as a defense-in-depth backstop for
    # anything that somehow writes to sys.stdout directly).
    restricted_globals['_print_'] = PrintCollector
    restricted_globals['_getattr_'] = safer_getattr
    restricted_globals['_getitem_'] = lambda obj, index: obj[index]
    restricted_globals['_getiter_'] = default_guarded_getiter
    restricted_globals['_iter_unpack_sequence_'] = guarded_iter_unpack_sequence
    restricted_globals['_unpack_sequence_'] = guarded_unpack_sequence
    # Every object reachable from this namespace is either a stdlib/pandas
    # function or a DataFrame freshly loaded a few lines below, and the
    # whole namespace is discarded when this process exits — so unlike
    # _getattr_, write access doesn't need its own restriction here.
    restricted_globals['_write_'] = lambda obj: obj
    restricted_globals['pd'] = pd
    restricted_globals['np'] = np
    restricted_globals['plt'] = _NoOpPlot()

    for ds in datasets:
        restricted_globals[ds['variable']] = pd.read_csv(ds['file'])

    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    error = None
    try:
        byte_code = compile_restricted(code, filename='<submission>', mode='exec')
        exec(byte_code, restricted_globals)
    except Exception:
        error = traceback.format_exc()
    real_stdout_text = sys.stdout.getvalue()
    sys.stdout = old_stdout

    # RestrictedPython injects a `_print` collector object as a side effect
    # of any print(...) call the code made; calling it (PrintCollector
    # defines __call__, not __str__) returns the accumulated printed text.
    # Concatenated with real_stdout_text (which should normally be empty,
    # since print() no longer touches real stdout) so nothing is silently
    # dropped either way.
    printer = restricted_globals.get('_print')
    stdout_text = (printer() if printer is not None else '') + real_stdout_text

    value = None
    if error is None and check_var:
        if check_var in restricted_globals:
            value = _to_jsonable(restricted_globals[check_var])
        else:
            error = "Your code must define a variable named '" + check_var + "'."

    return {'stdout': stdout_text, 'error': error, 'value': value}


def main():
    payload = json.loads(sys.stdin.read())
    result = run(payload['code'], payload.get('checkVar', ''), payload.get('datasets', []))
    sys.stdout.write(json.dumps(result))


if __name__ == '__main__':
    main()
