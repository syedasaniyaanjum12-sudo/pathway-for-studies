import type { DataAnalyticsExercise } from '../types.js'

// Every exercise's code must assign its answer to a variable named `result`
// — the same convention throughout, whether that's a number, a list, or a
// DataFrame. This mirrors SQL Practice, where every question just needs a
// final SELECT rather than a per-question return convention.
export const dataAnalyticsExercises: DataAnalyticsExercise[] = [
  {
    id: 'numpy-basic-array',
    title: 'Build a NumPy range',
    difficulty: 'Easy',
    topic: 'NumPy',
    prompt: 'Create a NumPy array containing the integers 1 through 10 (inclusive) and assign it to result.',
    datasets: [],
    solutionCode: 'result = np.arange(1, 11)',
    hint: 'np.arange(start, stop) excludes stop, so you need stop = 11.',
  },
  {
    id: 'numpy-array-stats',
    title: 'Average of an array',
    difficulty: 'Easy',
    topic: 'NumPy',
    prompt:
      'Given data = np.array([12, 45, 7, 23, 56, 89, 34]), compute its mean and assign the float to result.',
    datasets: [],
    solutionCode: 'data = np.array([12, 45, 7, 23, 56, 89, 34])\nresult = float(data.mean())',
    hint: 'NumPy arrays have a built-in .mean() method.',
  },
  {
    id: 'numpy-vectorized-ops',
    title: 'Vectorized discount',
    difficulty: 'Medium',
    topic: 'NumPy',
    prompt:
      'Given prices = np.array([25.99, 79.99, 34.50, 199.00, 349.00]), apply a 10% discount to every price without writing a loop, and assign the discounted array to result.',
    datasets: [],
    solutionCode: 'prices = np.array([25.99, 79.99, 34.50, 199.00, 349.00])\nresult = prices * 0.9',
    hint: 'NumPy operators (*, +, -, /) apply element-wise across an entire array.',
  },
  {
    id: 'pandas-load-and-filter',
    title: 'Filter high earners',
    difficulty: 'Easy',
    topic: 'Pandas',
    prompt:
      'employees_df is already loaded. Return the rows where salary is greater than 100000, assigned to result.',
    datasets: [{ variable: 'employees_df', file: '/data/employees.csv' }],
    solutionCode: "result = employees_df[employees_df['salary'] > 100000]",
    hint: "Boolean indexing: df[df['column'] > value]",
  },
  {
    id: 'pandas-select-columns',
    title: 'Select specific columns',
    difficulty: 'Easy',
    topic: 'Pandas',
    prompt: 'From products_df, select just the product_name and price columns, assigned to result.',
    datasets: [{ variable: 'products_df', file: '/data/products.csv' }],
    solutionCode: "result = products_df[['product_name', 'price']]",
    hint: 'Pass a list of column names inside the square brackets.',
  },
  {
    id: 'pandas-groupby-agg',
    title: 'Average salary per department',
    difficulty: 'Medium',
    topic: 'Pandas',
    prompt:
      'Using employees_df, compute the average salary per department_id, assigned to result.',
    datasets: [{ variable: 'employees_df', file: '/data/employees.csv' }],
    solutionCode: "result = employees_df.groupby('department_id')['salary'].mean()",
    hint: 'groupby(...)[column].mean()',
  },
  {
    id: 'pandas-merge',
    title: 'Merge orders with customer country',
    difficulty: 'Medium',
    topic: 'Pandas',
    prompt:
      "Merge orders_df with customers_df on customer_id to attach each order's country, then return just the order_id and country columns as result.",
    datasets: [
      { variable: 'orders_df', file: '/data/orders.csv' },
      { variable: 'customers_df', file: '/data/customers.csv' },
    ],
    solutionCode:
      "merged = orders_df.merge(customers_df, on='customer_id')\nresult = merged[['order_id', 'country']]",
    hint: 'df1.merge(df2, on="shared_column")',
  },
  {
    id: 'cleaning-strip-whitespace',
    title: 'Strip stray whitespace',
    difficulty: 'Medium',
    topic: 'Data Cleaning',
    prompt:
      'messy_employees_df has extra whitespace around some first_name values. Strip it and assign the cleaned column to result.',
    datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
    solutionCode: "result = messy_employees_df['first_name'].str.strip()",
    hint: 'The .str accessor exposes string methods like .strip() on a whole column at once.',
  },
  {
    id: 'cleaning-standardize-case',
    title: 'Standardize inconsistent casing',
    difficulty: 'Medium',
    topic: 'Data Cleaning',
    prompt:
      "messy_employees_df's department column mixes cases ('engineering', 'SALES', 'Sales'). Standardize it to title case (e.g. 'Engineering') and assign the result.",
    datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
    solutionCode: "result = messy_employees_df['department'].str.strip().str.title()",
    hint: '.str.strip() first, then .str.title() — chain them.',
  },
  {
    id: 'missing-values-fillna',
    title: 'Fill missing salaries',
    difficulty: 'Medium',
    topic: 'Missing Values',
    prompt:
      "Some employees in messy_employees_df have a missing salary. Fill the missing values with the column's median, assigned to result.",
    datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
    solutionCode:
      "result = messy_employees_df['salary'].fillna(messy_employees_df['salary'].median())",
    hint: 'series.fillna(value) — the median is a common, outlier-resistant fill value.',
  },
  {
    id: 'missing-values-dropna-duplicates',
    title: 'Remove duplicates and incomplete rows',
    difficulty: 'Hard',
    topic: 'Missing Values',
    prompt:
      'messy_employees_df has one fully duplicated row and some rows missing salary. Remove duplicate rows, then drop any row still missing a salary, and assign the remaining employee_id column to result.',
    datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
    solutionCode:
      "cleaned = messy_employees_df.drop_duplicates()\ncleaned = cleaned.dropna(subset=['salary'])\nresult = cleaned['employee_id']",
    hint: '.drop_duplicates() then .dropna(subset=[...]) — order matters if a duplicate row is also missing data.',
  },
  {
    id: 'eda-value-counts',
    title: 'Count products per category',
    difficulty: 'Medium',
    topic: 'EDA',
    prompt: 'Using products_df, count how many products fall into each category, assigned to result.',
    datasets: [{ variable: 'products_df', file: '/data/products.csv' }],
    solutionCode: "result = products_df['category'].value_counts()",
    hint: 'series.value_counts() is the quickest way to see a categorical breakdown.',
  },
  {
    id: 'eda-correlation',
    title: 'Correlate quantity and price',
    difficulty: 'Hard',
    topic: 'EDA',
    prompt:
      'Using sales_df, compute the correlation between quantity and unit_price, assigned as a float to result.',
    datasets: [{ variable: 'sales_df', file: '/data/sales.csv' }],
    solutionCode: "result = float(sales_df['quantity'].corr(sales_df['unit_price']))",
    hint: 'series_a.corr(series_b) returns the Pearson correlation coefficient.',
  },
  {
    id: 'eda-top-n-revenue',
    title: 'Top 3 products by revenue',
    difficulty: 'Hard',
    topic: 'EDA',
    prompt:
      'Using sales_df, compute total revenue (quantity * unit_price) per product_id, and return the top 3 product_ids by revenue as result.',
    datasets: [{ variable: 'sales_df', file: '/data/sales.csv' }],
    solutionCode:
      "sales_df['revenue'] = sales_df['quantity'] * sales_df['unit_price']\nresult = sales_df.groupby('product_id')['revenue'].sum().sort_values(ascending=False).head(3)",
    hint: 'Add a computed column, groupby + sum, then sort_values(ascending=False).head(3).',
  },
  {
    id: 'viz-bar-chart',
    title: 'Bar chart of department salary totals',
    difficulty: 'Medium',
    topic: 'Data Visualization',
    prompt:
      'Plot a bar chart of total salary per department_id using employees_df, and assign the same grouped totals to result.',
    datasets: [{ variable: 'employees_df', file: '/data/employees.csv' }],
    solutionCode:
      "grouped = employees_df.groupby('department_id')['salary'].sum()\ngrouped.plot(kind='bar')\nresult = grouped",
    hint: 'A pandas Series has a .plot(kind="bar") method built in — no need to call matplotlib directly.',
    expectsPlot: true,
  },
  {
    id: 'viz-histogram',
    title: 'Histogram of product prices',
    difficulty: 'Hard',
    topic: 'Data Visualization',
    prompt:
      'Plot a histogram of product prices from products_df using 5 bins, and assign the count of products priced above the mean to result.',
    datasets: [{ variable: 'products_df', file: '/data/products.csv' }],
    solutionCode:
      "plt.hist(products_df['price'], bins=5)\nresult = int((products_df['price'] > products_df['price'].mean()).sum())",
    hint: 'plt.hist(data, bins=5); a boolean Series summed with .sum() counts the True values.',
    expectsPlot: true,
  },
  {
    id: 'viz-line-running-total',
    title: 'Cumulative revenue line chart',
    difficulty: 'Interview',
    topic: 'Data Visualization',
    prompt:
      'Using sales_df sorted by sale_id, plot a line chart of cumulative revenue (quantity * unit_price) over time, and assign the final cumulative total to result.',
    datasets: [{ variable: 'sales_df', file: '/data/sales.csv' }],
    solutionCode:
      "sales_sorted = sales_df.sort_values('sale_id')\nsales_sorted['revenue'] = sales_sorted['quantity'] * sales_sorted['unit_price']\nsales_sorted['cumulative'] = sales_sorted['revenue'].cumsum()\nplt.plot(sales_sorted['sale_id'], sales_sorted['cumulative'])\nresult = float(sales_sorted['cumulative'].iloc[-1])",
    hint: 'series.cumsum() gives a running total; plot it against sale_id.',
    expectsPlot: true,
  },
  {
    id: 'interview-pivot-table',
    title: 'Revenue by customer country',
    difficulty: 'Interview',
    topic: 'Pandas',
    prompt:
      'Join sales_df, orders_df, and customers_df to compute total revenue per customer country, sorted highest first, assigned to result.',
    datasets: [
      { variable: 'sales_df', file: '/data/sales.csv' },
      { variable: 'orders_df', file: '/data/orders.csv' },
      { variable: 'customers_df', file: '/data/customers.csv' },
    ],
    solutionCode:
      "merged = sales_df.merge(orders_df, on='order_id').merge(customers_df, on='customer_id')\nmerged['revenue'] = merged['quantity'] * merged['unit_price']\nresult = merged.groupby('country')['revenue'].sum().sort_values(ascending=False)",
    hint: 'Chain two .merge() calls, add a revenue column, then groupby("country").',
  },
  {
    id: 'interview-zscore-outliers',
    title: 'Salary outliers by z-score',
    difficulty: 'Interview',
    topic: 'EDA',
    prompt:
      "Using employees_df, flag salary outliers with the z-score method (|z| > 1.5), and return the first_name of every flagged employee as a list, assigned to result.",
    datasets: [{ variable: 'employees_df', file: '/data/employees.csv' }],
    solutionCode:
      "salaries = employees_df['salary']\nz = (salaries - salaries.mean()) / salaries.std()\nresult = employees_df.loc[z.abs() > 1.5, 'first_name'].tolist()",
    hint: 'z = (x - mean) / std; then boolean-index on z.abs() > threshold.',
  },
]
