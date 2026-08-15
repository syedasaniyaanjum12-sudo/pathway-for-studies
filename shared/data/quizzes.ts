// Phase 3 (Gamification): one concept-check Quiz per World (shared/data/
// worlds.ts) — a Quiz's `id` IS its WorldDef.id (1:1), so the World Map and
// /quiz/<worldId> routes never need a separate lookup table. Unlike the
// SQL/Data Analytics practice questions (which test writing code), these
// test recognizing concepts — a different, complementary skill.
import type { Quiz } from '../types.js'

// Small helper so every question below reads as prompt/choices/answer
// without repeating id-plumbing boilerplate — choice ids are just 'a'..'d'.
function q(
  id: string,
  prompt: string,
  choices: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string,
): Quiz['questions'][number] {
  const letters = ['a', 'b', 'c', 'd'] as const
  return {
    id,
    prompt,
    choices: choices.map((text, i) => ({ id: letters[i], text })),
    correctChoiceId: letters[correctIndex],
    explanation,
  }
}

export const quizzes: Quiz[] = [
  {
    id: 'sql-foundations',
    title: 'SQL Foundations Quiz',
    questions: [
      q(
        'sql-foundations-1',
        'Which SQL clause filters individual rows based on a condition?',
        ['SELECT', 'WHERE', 'ORDER BY', 'FROM'],
        1,
        'WHERE filters rows before any grouping happens; SELECT chooses columns, ORDER BY sorts, FROM names the table.',
      ),
      q(
        'sql-foundations-2',
        'What does `ORDER BY salary DESC LIMIT 3` return?',
        ['The 3 lowest salaries', 'The 3 highest salaries', 'All salaries, ascending', 'An error'],
        1,
        'DESC sorts highest-first, and LIMIT 3 keeps only the first 3 rows of that sorted result.',
      ),
      q(
        'sql-foundations-3',
        'Which statement correctly selects every column from a table named `employees`?',
        ['SELECT employees.*', 'SELECT * FROM employees', 'GET * FROM employees', 'SELECT ALL employees'],
        1,
        '`SELECT * FROM <table>` is the standard "every column" query; the others aren\'t valid SQL.',
      ),
      q(
        'sql-foundations-4',
        'In `WHERE price > 50`, what kind of expression is `price > 50`?',
        ['A boolean condition', 'A column alias', 'A join condition', 'An aggregate function'],
        0,
        'It evaluates to true/false per row — exactly what WHERE needs to decide which rows survive.',
      ),
    ],
  },
  {
    id: 'sql-aggregates-joins',
    title: 'Joins & Aggregates Quiz',
    questions: [
      q(
        'sql-aggregates-joins-1',
        'Which clause filters groups *after* GROUP BY, based on an aggregate result?',
        ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
        1,
        'WHERE filters rows before grouping; HAVING filters the grouped/aggregated results themselves.',
      ),
      q(
        'sql-aggregates-joins-2',
        'An INNER JOIN between two tables returns:',
        [
          'All rows from both tables',
          'Only rows with matching keys in both tables',
          'Only rows from the left table',
          'A random sample of rows',
        ],
        1,
        'INNER JOIN keeps only rows where the join condition matches on both sides.',
      ),
      q(
        'sql-aggregates-joins-3',
        '`COUNT(*)` counts:',
        ['Distinct values only', 'Non-null values in one column', 'All rows, including nulls', 'Only the first row'],
        2,
        'COUNT(*) counts rows regardless of null columns; COUNT(column) is the one that skips nulls.',
      ),
      q(
        'sql-aggregates-joins-4',
        'To find customers with no matching orders, which pattern do you typically need?',
        ['INNER JOIN', 'LEFT JOIN ... WHERE right side IS NULL', 'CROSS JOIN', 'SELF JOIN only'],
        1,
        'A LEFT JOIN keeps unmatched left rows with NULLs on the right side — filtering for that NULL finds "no match" rows.',
      ),
    ],
  },
  {
    id: 'da-numpy-pandas',
    title: 'NumPy & Pandas Basics Quiz',
    questions: [
      q(
        'da-numpy-pandas-1',
        'What is the main advantage of a NumPy operation like `prices * 0.9` over a Python for-loop?',
        [
          "It mutates the original list in place",
          "It's vectorized — no explicit loop needed",
          'It only works on integers',
          'It sorts the array',
        ],
        1,
        'NumPy applies the operation element-wise across the whole array at once, in optimized C code.',
      ),
      q(
        'da-numpy-pandas-2',
        "In pandas, `df[df['salary'] > 100000]` is an example of:",
        ['Boolean indexing', 'A SQL join', 'A pivot table', 'String formatting'],
        0,
        "The comparison produces a boolean mask, and df[mask] keeps only the True rows.",
      ),
      q(
        'da-numpy-pandas-3',
        'Which method returns summary statistics (mean, std, min, max, etc.) for numeric columns?',
        ['df.describe()', 'df.info()', 'df.columns()', 'df.head()'],
        0,
        '.describe() computes count/mean/std/quartiles for every numeric column in one call.',
      ),
      q(
        'da-numpy-pandas-4',
        "`employees_df.groupby('department_id')['salary'].mean()` returns:",
        [
          'The overall mean salary',
          'The mean salary per department',
          'A boolean mask',
          'The count of employees per department',
        ],
        1,
        'groupby splits the DataFrame by department_id, then .mean() aggregates salary within each group.',
      ),
    ],
  },
  {
    id: 'sql-patterns',
    title: 'SQL Patterns & Text/Date Handling Quiz',
    questions: [
      q(
        'sql-patterns-1',
        "`CASE WHEN salary > 120000 THEN 'Senior' ELSE 'Junior' END` is an example of:",
        ['A window function', 'Conditional logic within a SELECT', 'A subquery', 'An index hint'],
        1,
        'CASE WHEN is SQL\'s inline if/else, evaluated per row inside the SELECT list.',
      ),
      q(
        'sql-patterns-2',
        'Why might `NOT IN (subquery)` silently return zero rows unexpectedly?',
        ['NOT IN always errors', 'If the subquery result contains a NULL', 'NOT IN only works with strings', 'It requires an index'],
        1,
        'A NULL anywhere in the NOT IN list makes every comparison UNKNOWN, so no rows pass — a classic gotcha.',
      ),
      q(
        'sql-patterns-3',
        'Which function extracts the year from a date string in SQLite?',
        ['YEAR(date)', "strftime('%Y', date)", 'EXTRACT(date)', 'DATE_PART(date)'],
        1,
        "SQLite has no YEAR()/EXTRACT() — strftime('%Y', ...) is its date-formatting function for this.",
      ),
      q('sql-patterns-4', 'The `||` operator in SQLite is used to:', [
        'Perform a logical OR',
        'Concatenate strings',
        'Divide two numbers',
        'Compare dates',
      ], 1, "SQLite uses `||` for string concatenation, not logical OR (that's the `OR` keyword)."),
    ],
  },
  {
    id: 'da-cleaning',
    title: 'Data Cleaning Quiz',
    questions: [
      q('da-cleaning-1', '`.str.strip()` on a pandas string column removes:', [
        'Duplicate rows',
        'Leading/trailing whitespace',
        'Missing values',
        'Punctuation',
      ], 1, '.strip() trims whitespace from both ends of each string in the column.'),
      q(
        'da-cleaning-2',
        "Which call fills missing values in a column with that column's median?",
        ['series.dropna()', 'series.fillna(series.median())', 'series.drop_duplicates()', 'series.astype(float)'],
        1,
        'fillna(value) replaces NaNs with the given value — the median is a common, outlier-resistant choice.',
      ),
      q(
        'da-cleaning-3',
        "`.drop_duplicates()` followed by `.dropna(subset=['salary'])` does what, in that order?",
        [
          'Drops missing salaries first, then duplicates',
          'Removes duplicate rows first, then rows still missing salary',
          'Only removes duplicates',
          'Only removes missing salaries',
        ],
        1,
        'Each call does exactly what it says, applied in sequence: duplicates go first, then rows missing salary.',
      ),
      q(
        'da-cleaning-4',
        "Standardizing inconsistent text casing (e.g. 'SALES' vs 'Sales') commonly uses:",
        ['.str.title() or .str.lower()', '.astype(int)', '.fillna()', '.sort_values()'],
        0,
        '.str.title()/.str.lower() normalize casing so equivalent values compare equal.',
      ),
    ],
  },
  {
    id: 'da-eda-viz',
    title: 'EDA & Visualization Quiz',
    questions: [
      q(
        'da-eda-viz-1',
        '`series.value_counts()` is most useful for:',
        [
          'Computing a correlation',
          'Seeing the frequency of each category in a column',
          'Plotting a line chart',
          'Merging two DataFrames',
        ],
        1,
        'value_counts() tallies how often each distinct value appears — a quick categorical breakdown.',
      ),
      q('da-eda-viz-2', 'A Pearson correlation coefficient close to 1 means:', [
        'No relationship between the two variables',
        'A strong negative relationship',
        'A strong positive relationship',
        'The data has missing values',
      ], 2, 'Values near +1 indicate the two variables move strongly together in the same direction.'),
      q(
        'da-eda-viz-3',
        'Which chart type best shows the distribution of a single numeric column?',
        ['Histogram', 'Line chart', 'Pie chart', 'A scatter of two unrelated columns'],
        0,
        'A histogram bins one variable\'s values and shows how many fall into each bin — exactly a distribution view.',
      ),
      q(
        'da-eda-viz-4',
        'To find the top N rows by a computed value in pandas, you would typically use:',
        ['.sort_values(ascending=False).head(N)', '.dropna().head(N)', '.describe()', '.value_counts().tail(N)'],
        0,
        'Sort descending by the value, then take the first N rows.',
      ),
    ],
  },
  {
    id: 'sql-advanced',
    title: 'Advanced SQL Engineering Quiz',
    questions: [
      q(
        'sql-advanced-1',
        '`RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)` computes a rank:',
        ['Across the whole table', 'Independently within each department', 'Only for the top row', 'Randomly'],
        1,
        'PARTITION BY resets the ranking for each department group; ORDER BY decides the rank order within it.',
      ),
      q(
        'sql-advanced-2',
        'A window function differs from GROUP BY because it:',
        [
          'Always requires an index',
          'Returns one row per group, collapsing detail',
          'Keeps individual rows while adding an aggregate-like value',
          'Can only be used with COUNT',
        ],
        2,
        "Window functions compute across a set of rows but don't collapse them — every original row survives.",
      ),
      q('sql-advanced-3', 'What does creating a VIEW do?', [
        'Physically duplicates the underlying data',
        'Saves a named, reusable query definition',
        'Creates an index automatically',
        'Deletes the original table',
      ], 1, 'A view is a stored SELECT you can query like a table — it doesn\'t copy the underlying data.'),
      q('sql-advanced-4', 'An index primarily helps with:', [
        'Making INSERT statements shorter',
        'Speeding up lookups/filtering on the indexed column',
        'Automatically fixing data quality',
        'Enforcing foreign keys',
      ], 1, 'An index lets the database jump straight to matching rows instead of scanning the whole table.'),
    ],
  },
  {
    id: 'ai-beginner',
    title: 'AI Engineer: First Builds Quiz',
    questions: [
      q('ai-beginner-1', 'What is a "prompt" in the context of an LLM?', [
        "The model's internal weights",
        'The input text you give the model to generate a response',
        'A type of neural network layer',
        "The model's training dataset",
      ], 1, "The prompt is the input — instructions and/or context — that steers the model's output."),
      q(
        'ai-beginner-2',
        'In an LLM API call, what does the "temperature" parameter roughly control?',
        ['How fast the model responds', 'The randomness/creativity of the output', 'The maximum tokens allowed', "The model's language"],
        1,
        'Higher temperature makes output more varied/creative; lower temperature makes it more deterministic.',
      ),
      q('ai-beginner-3', 'What is "sentiment analysis"?', [
        'Counting words in a document',
        'Classifying text as positive/negative/neutral in tone',
        'Translating text between languages',
        'Compressing text',
      ], 1, 'Sentiment analysis labels text by the emotional tone it expresses.'),
      q('ai-beginner-4', 'A "system prompt" typically:', [
        'Is shown to the end user',
        "Sets the model's behavior/persona before the conversation starts",
        'Is only used for image models',
        'Replaces the need for any user input',
      ], 1, "The system prompt configures how the model should behave, set once before user messages arrive."),
    ],
  },
  {
    id: 'ai-intermediate',
    title: 'AI Systems Building Quiz',
    questions: [
      q(
        'ai-intermediate-1',
        'RAG (Retrieval-Augmented Generation) primarily helps an LLM by:',
        ['Making it faster', 'Giving it relevant external context/documents at query time', 'Reducing its token limit', 'Removing the need for prompts'],
        1,
        'RAG retrieves relevant documents and feeds them into the prompt, grounding answers in real data the model wasn\'t trained on.',
      ),
      q('ai-intermediate-2', 'In "function calling" / tool use, the model:', [
        'Executes code directly on its own servers with no oversight',
        'Requests that your application call a named function with certain arguments',
        'Can only call other LLMs',
        'Ignores any tools it is given',
      ], 1, "The model proposes a function name + arguments; your application decides whether/how to actually run it."),
      q('ai-intermediate-3', 'A "vector embedding" of text is:', [
        'A compressed image of the text',
        'A numeric representation capturing semantic meaning, used for similarity search',
        'The raw token count',
        'A SQL query',
      ], 1, 'Embeddings map text to vectors so that semantically similar text ends up close together in vector space.'),
      q('ai-intermediate-4', 'What is the main purpose of giving a chatbot "memory" across turns?', [
        'To reduce its vocabulary',
        'To let it recall earlier parts of the conversation',
        'To make responses shorter',
        'To disable tool use',
      ], 1, "Memory lets the model reference what was said earlier instead of treating every message in isolation."),
    ],
  },
  {
    id: 'ai-advanced',
    title: 'Advanced AI Engineering Quiz',
    questions: [
      q('ai-advanced-1', '"Fine-tuning" a model means:', [
        'Changing its temperature at inference time',
        'Further training a pretrained model on your own data to specialize it',
        'Writing a better prompt',
        'Increasing its context window',
      ], 1, "Fine-tuning updates the model's weights on task-specific data, rather than just changing how you call it."),
      q('ai-advanced-2', 'In a multi-agent system, agents typically:', [
        'All run the exact same prompt with no differentiation',
        'Have distinct roles/responsibilities and coordinate on a task',
        'Cannot communicate with each other',
        'Replace the need for any tools',
      ], 1, "Multi-agent systems split work across specialized agents (e.g. researcher, writer, critic) that coordinate."),
      q('ai-advanced-3', 'Why sandbox an autonomous coding agent?', [
        'To make it run faster',
        'To limit what it can access/execute, containing potential mistakes or unsafe actions',
        'To increase its token limit',
        'It is required by every LLM API',
      ], 1, "A sandbox contains the blast radius if the agent runs unexpected or unsafe code."),
      q('ai-advanced-4', 'A "production RAG pipeline" typically adds which concern beyond a prototype?', [
        'None — it is identical to a prototype',
        'Reliability, monitoring, latency, and cost at scale',
        'Only better prompts',
        'Removing retrieval entirely',
      ], 1, "Going to production means handling real traffic reliably and affordably, not just working once in a notebook."),
    ],
  },
  {
    id: 'ai-portfolio',
    title: 'Portfolio & Job-Ready Quiz',
    questions: [
      q('ai-portfolio-1', 'What makes a project "portfolio-ready" for a job search?', [
        'It is the most complex thing technically possible, regardless of clarity',
        "It's polished, well-documented, and clearly demonstrates real skills to an employer",
        'It was built in under an hour',
        'It has no README',
      ], 1, "Employers judge clarity and demonstrated skill, not raw complexity — polish and documentation matter."),
      q('ai-portfolio-2', 'Deploying an LLM app "behind an API" mainly means:', [
        'Hiding your prompts from users',
        'Exposing your app\'s functionality over HTTP so other services/clients can call it',
        'Preventing anyone from using the model',
        'Removing the need for authentication',
      ], 1, "An API is how other software (a frontend, another service) talks to your app over the network."),
      q('ai-portfolio-3', 'A "multi-modal" assistant is one that:', [
        'Only handles text',
        'Handles multiple input/output types, e.g. text and images',
        'Runs on multiple servers',
        'Supports multiple languages only',
      ], 1, "Multi-modal means working across more than one kind of data — text plus images, audio, etc."),
      q('ai-portfolio-4', 'Contributing to an open-source AI tool is valuable for a portfolio because it:', [
        'Requires no code review',
        'Demonstrates real collaboration and code quality under public scrutiny',
        'Is always anonymous',
        'Guarantees a job offer',
      ], 1, "Public contributions show you can write reviewable code and collaborate with other engineers."),
    ],
  },
]
