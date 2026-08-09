const TABLES: Array<{ name: string; columns: string[] }> = [
  { name: 'departments', columns: ['department_id', 'department_name', 'location'] },
  {
    name: 'employees',
    columns: [
      'employee_id',
      'first_name',
      'last_name',
      'email',
      'department_id',
      'manager_id',
      'salary',
      'hire_date',
    ],
  },
  {
    name: 'customers',
    columns: ['customer_id', 'first_name', 'last_name', 'email', 'country', 'signup_date'],
  },
  { name: 'products', columns: ['product_id', 'product_name', 'category', 'price', 'stock_quantity'] },
  { name: 'orders', columns: ['order_id', 'customer_id', 'employee_id', 'order_date', 'status'] },
  { name: 'sales', columns: ['sale_id', 'order_id', 'product_id', 'quantity', 'unit_price'] },
]

// Kept specific to this page (not in components/) since the schema itself is
// SQL-Practice-only content, unlike CodeEditor/ResultTable which are
// genuinely reusable across tracks.
function SchemaReference() {
  return (
    <details className="shrink-0 text-sm">
      <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
        Schema reference
      </summary>
      <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm">
        {TABLES.map((table) => (
          <div key={table.name}>
            <p className="font-mono font-medium text-slate-800">{table.name}</p>
            <p className="text-xs text-slate-500">{table.columns.join(', ')}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

export default SchemaReference
