import type { DatasetBinding } from '../../lib/pythonEngine'

const COLUMNS_BY_FILE: Record<string, string[]> = {
  '/data/departments.csv': ['department_id', 'department_name', 'location'],
  '/data/employees.csv': [
    'employee_id',
    'first_name',
    'last_name',
    'email',
    'department_id',
    'manager_id',
    'salary',
    'hire_date',
  ],
  '/data/customers.csv': ['customer_id', 'first_name', 'last_name', 'email', 'country', 'signup_date'],
  '/data/products.csv': ['product_id', 'product_name', 'category', 'price', 'stock_quantity'],
  '/data/orders.csv': ['order_id', 'customer_id', 'employee_id', 'order_date', 'status'],
  '/data/sales.csv': ['sale_id', 'order_id', 'product_id', 'quantity', 'unit_price'],
  '/data/employees_messy.csv': ['employee_id', 'first_name', 'last_name', 'department', 'salary', 'hire_date'],
}

// Specific to this page's content, same as SqlPractice/SchemaReference.
// Only lists the variables the *current* exercise actually preloads, since
// unlike the SQL schema (always all 6 tables), each Python exercise gets a
// different subset of DataFrames.
function DatasetReference({ datasets }: { datasets: DatasetBinding[] }) {
  if (datasets.length === 0) return null

  return (
    <details className="shrink-0 text-sm">
      <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
        Available DataFrames
      </summary>
      <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm">
        {datasets.map((dataset) => (
          <div key={dataset.variable}>
            <p className="font-mono font-medium text-slate-800">{dataset.variable}</p>
            <p className="text-xs text-slate-500">
              {(COLUMNS_BY_FILE[dataset.file] ?? []).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </details>
  )
}

export default DatasetReference
