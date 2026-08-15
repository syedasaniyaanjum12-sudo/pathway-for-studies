// Phase 4 (Gamification): one capstone Boss Challenge per practicable
// (SQL/Data Analytics) World — a BossChallenge's `id` IS its WorldDef.id,
// matching the same 1:1 convention as quizzes.ts/miniChallenges.ts. Unlike
// a Mini Challenge (one existing question + a clock), each part here is
// new, harder content that combines multiple topics from its World — a
// real capstone, not just a timed repeat.
import type { BossChallenge } from '../types.js'

export const bossChallenges: BossChallenge[] = [
  {
    id: 'sql-foundations',
    track: 'sql',
    title: 'Boss: The Filter Gauntlet',
    introText: 'Two clean queries, no hints from muscle memory — prove the fundamentals stuck.',
    parts: [
      {
        id: 'sql-foundations-boss-1',
        prompt:
          'Return first_name, last_name, and salary for employees earning more than 90000, ordered by salary highest first.',
        solutionQuery:
          'SELECT first_name, last_name, salary FROM employees WHERE salary > 90000 ORDER BY salary DESC;',
        orderMatters: true,
        hint: 'A WHERE filter combined with ORDER BY ... DESC.',
      },
      {
        id: 'sql-foundations-boss-2',
        prompt: 'Return product_name and price for the single cheapest product.',
        solutionQuery: 'SELECT product_name, price FROM products ORDER BY price ASC LIMIT 1;',
        orderMatters: true,
        hint: 'ORDER BY price ascending, then LIMIT 1.',
      },
    ],
  },
  {
    id: 'sql-aggregates-joins',
    track: 'sql',
    title: 'Boss: The Aggregation Arena',
    introText: 'Join two tables, group the result, and order it — all in one query, twice.',
    parts: [
      {
        id: 'sql-aggregates-joins-boss-1',
        prompt:
          'Return department_name and the number of employees in that department, aliased as employee_count, ordered by employee_count highest first.',
        solutionQuery:
          'SELECT d.department_name, COUNT(*) AS employee_count FROM employees e JOIN departments d ON e.department_id = d.department_id GROUP BY d.department_name ORDER BY employee_count DESC;',
        orderMatters: true,
        hint: 'JOIN employees to departments, GROUP BY department_name, then ORDER BY the count.',
      },
      {
        id: 'sql-aggregates-joins-boss-2',
        prompt:
          'Return customer_id and the number of orders they have placed, aliased as order_count, for customers with more than 1 order.',
        solutionQuery:
          'SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) > 1;',
        hint: 'GROUP BY customer_id, then HAVING COUNT(*) > 1 to keep only repeat customers.',
      },
    ],
  },
  {
    id: 'da-numpy-pandas',
    track: 'data-analytics',
    title: 'Boss: The Array & DataFrame Duel',
    introText: 'A NumPy warm-up, then a real pandas groupby with a twist.',
    parts: [
      {
        id: 'da-numpy-pandas-boss-1',
        prompt:
          'Given prices = np.array([10, 20, 30, 40, 50]), compute the sum of the squares of every element, assigned as an int to result.',
        solutionCode: 'prices = np.array([10, 20, 30, 40, 50])\nresult = int((prices ** 2).sum())',
        datasets: [],
        hint: 'Square the array element-wise with **, then .sum().',
      },
      {
        id: 'da-numpy-pandas-boss-2',
        prompt:
          'employees_df is loaded. Return the single department_id with the highest average salary, assigned to result.',
        solutionCode: "result = employees_df.groupby('department_id')['salary'].mean().idxmax()",
        datasets: [{ variable: 'employees_df', file: '/data/employees.csv' }],
        hint: 'groupby(...).mean() gives a Series of averages; .idxmax() returns the index (department_id) of the largest one.',
      },
    ],
  },
  {
    id: 'sql-patterns',
    track: 'sql',
    title: 'Boss: The Pattern Trial',
    introText: 'Layered conditional logic, then a date filter — the patterns you practiced, harder.',
    parts: [
      {
        id: 'sql-patterns-boss-1',
        prompt:
          "Return first_name, last_name, and a pay_band column: 'High' if salary >= 100000, 'Mid' if salary >= 70000, otherwise 'Low'.",
        solutionQuery:
          "SELECT first_name, last_name, CASE WHEN salary >= 100000 THEN 'High' WHEN salary >= 70000 THEN 'Mid' ELSE 'Low' END AS pay_band FROM employees;",
        hint: 'CASE WHEN can chain multiple WHEN branches before ELSE.',
      },
      {
        id: 'sql-patterns-boss-2',
        prompt: "Return first_name, last_name for employees hired in 2021 or later.",
        solutionQuery: "SELECT first_name, last_name FROM employees WHERE strftime('%Y', hire_date) >= '2021';",
        hint: "strftime('%Y', hire_date) extracts the year; compare it as a string.",
      },
    ],
  },
  {
    id: 'da-cleaning',
    track: 'data-analytics',
    title: 'Boss: The Cleanup Crew',
    introText: 'Chain two cleaning steps together — real messy data rarely needs just one fix.',
    parts: [
      {
        id: 'da-cleaning-boss-1',
        prompt:
          "messy_employees_df is loaded. Strip whitespace AND standardize casing (title case) on the department column in one expression, assigned to result.",
        solutionCode: "result = messy_employees_df['department'].str.strip().str.title()",
        datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
        hint: 'Chain .str.strip() then .str.title() on the same column.',
      },
      {
        id: 'da-cleaning-boss-2',
        prompt:
          'messy_employees_df is loaded. Drop duplicate rows, fill any remaining missing salary with the column median, and return the cleaned salary column as result.',
        solutionCode:
          "cleaned = messy_employees_df.drop_duplicates()\nresult = cleaned['salary'].fillna(cleaned['salary'].median())",
        datasets: [{ variable: 'messy_employees_df', file: '/data/employees_messy.csv' }],
        hint: '.drop_duplicates() first, then .fillna(median) on the salary column of what remains.',
      },
    ],
  },
  {
    id: 'da-eda-viz',
    track: 'data-analytics',
    title: 'Boss: The Insight Gauntlet',
    introText: 'Compute a real business metric, then back it up with a chart.',
    parts: [
      {
        id: 'da-eda-viz-boss-1',
        prompt:
          'Using sales_df, compute total revenue (quantity * unit_price) per product_id, and return the single product_id with the highest total revenue, assigned to result.',
        solutionCode:
          "sales_df['revenue'] = sales_df['quantity'] * sales_df['unit_price']\nresult = sales_df.groupby('product_id')['revenue'].sum().idxmax()",
        datasets: [{ variable: 'sales_df', file: '/data/sales.csv' }],
        hint: 'Add a revenue column, groupby(product_id), sum, then .idxmax().',
      },
      {
        id: 'da-eda-viz-boss-2',
        prompt:
          'Using products_df, plot a histogram of price with 5 bins, and assign the mean price (as a float) to result.',
        solutionCode: "plt.hist(products_df['price'], bins=5)\nresult = float(products_df['price'].mean())",
        datasets: [{ variable: 'products_df', file: '/data/products.csv' }],
        expectsPlot: true,
        hint: 'plt.hist(data, bins=5), then .mean() on the same column.',
      },
    ],
  },
  {
    id: 'sql-advanced',
    track: 'sql',
    title: 'Boss: The Engineering Trial',
    introText: 'A windowed aggregate over a join, then a view — the hardest fight in SQL Practice.',
    parts: [
      {
        id: 'sql-advanced-boss-1',
        prompt:
          "Return sale_id and a running total of revenue (quantity * unit_price) ordered by sale_id, aliased as running_total — but only for sales belonging to orders with status = 'completed'.",
        solutionQuery:
          "SELECT s.sale_id, SUM(s.quantity * s.unit_price) OVER (ORDER BY s.sale_id) AS running_total FROM sales s JOIN orders o ON s.order_id = o.order_id WHERE o.status = 'completed' ORDER BY s.sale_id;",
        orderMatters: true,
        hint: 'JOIN sales to orders, filter status = \'completed\', then apply the running-total window function.',
      },
      {
        id: 'sql-advanced-boss-2',
        prompt:
          'Create a view named dept_avg_salary with department_id and avg_salary (AVG of salary) per department. Then select department_id and avg_salary from that view, ordered highest first.',
        solutionQuery:
          'CREATE VIEW dept_avg_salary AS SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id; SELECT department_id, avg_salary FROM dept_avg_salary ORDER BY avg_salary DESC;',
        orderMatters: true,
        hint: 'CREATE VIEW <name> AS <select>; then query it like a table in a second statement.',
      },
    ],
  },
]
