-- Sample company database used by every SQL Practice question.
-- One connected schema (rather than 6 separate databases) so questions can
-- combine joins across tables, the way real interview questions do.

CREATE TABLE departments (
  department_id   INTEGER PRIMARY KEY,
  department_name TEXT NOT NULL,
  location        TEXT NOT NULL
);

CREATE TABLE employees (
  employee_id   INTEGER PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(department_id),
  manager_id    INTEGER REFERENCES employees(employee_id),
  salary        INTEGER NOT NULL,
  hire_date     TEXT NOT NULL -- ISO date string, e.g. '2021-03-15'
);

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  country     TEXT NOT NULL,
  signup_date TEXT NOT NULL
);

CREATE TABLE products (
  product_id     INTEGER PRIMARY KEY,
  product_name   TEXT NOT NULL,
  category       TEXT NOT NULL,
  price          REAL NOT NULL,
  stock_quantity INTEGER NOT NULL
);

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  employee_id INTEGER REFERENCES employees(employee_id),
  order_date  TEXT NOT NULL,
  status      TEXT NOT NULL -- 'completed' | 'pending' | 'cancelled'
);

CREATE TABLE sales (
  sale_id    INTEGER PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(order_id),
  product_id INTEGER REFERENCES products(product_id),
  quantity   INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

-- Indexes on the foreign keys used most often in joins/filters.
-- Referenced directly by the "Indexes" and "Query optimization" questions.
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_sales_order_id ON sales(order_id);

INSERT INTO departments (department_id, department_name, location) VALUES
  (1, 'Engineering', 'Bengaluru'),
  (2, 'Sales', 'Mumbai'),
  (3, 'Marketing', 'Delhi'),
  (4, 'Human Resources', 'Pune');

INSERT INTO employees (employee_id, first_name, last_name, email, department_id, manager_id, salary, hire_date) VALUES
  (1, 'Asha',   'Rao',      'asha.rao@company.com',      1, NULL, 185000, '2018-01-10'),
  (2, 'Vikram', 'Shah',     'vikram.shah@company.com',   1, 1,    142000, '2019-04-22'),
  (3, 'Neha',   'Kapoor',   'neha.kapoor@company.com',   1, 1,    138000, '2020-07-01'),
  (4, 'Rohit',  'Mehta',    'rohit.mehta@company.com',   2, NULL, 120000, '2017-11-05'),
  (5, 'Priya',  'Nair',     'priya.nair@company.com',    2, 4,    98000,  '2021-02-14'),
  (6, 'Arjun',  'Iyer',     'arjun.iyer@company.com',    2, 4,    95000,  '2022-06-19'),
  (7, 'Kavya',  'Menon',    'kavya.menon@company.com',   3, NULL, 110000, '2019-09-30'),
  (8, 'Sanjay', 'Gupta',    'sanjay.gupta@company.com',  3, 7,    88000,  '2022-01-11'),
  (9, 'Meera',  'Joshi',    'meera.joshi@company.com',   4, NULL, 105000, '2016-03-08'),
  (10,'Divya',  'Reddy',    'divya.reddy@company.com',   4, 9,    76000,  '2023-05-01');

INSERT INTO customers (customer_id, first_name, last_name, email, country, signup_date) VALUES
  (1, 'Liam',   'Brown',    'liam.brown@mail.com',    'USA',    '2021-01-15'),
  (2, 'Emma',   'Wilson',   'emma.wilson@mail.com',   'UK',     '2021-03-22'),
  (3, 'Noah',   'Garcia',   'noah.garcia@mail.com',   'Spain',  '2022-05-10'),
  (4, 'Olivia', 'Martin',   'olivia.martin@mail.com', 'France', '2020-11-02'),
  (5, 'Ethan',  'Clark',    'ethan.clark@mail.com',   'USA',    '2022-08-19'),
  (6, 'Sophia', 'Lewis',    'sophia.lewis@mail.com',  'Canada', '2023-02-27'),
  (7, 'Mason',  'Walker',   'mason.walker@mail.com',  'UK',     '2019-12-05'),
  (8, 'Isabella','Hall',    'isabella.hall@mail.com', 'USA',    '2023-07-14'),
  (9, 'Ava',    'Turner',   'ava.turner@mail.com',    'USA',    '2023-08-02');
-- Ava (9) intentionally has no rows in `orders` — used by the
-- "customers with no orders" anti-join question.

INSERT INTO products (product_id, product_name, category, price, stock_quantity) VALUES
  (1, 'Wireless Mouse',     'Electronics', 25.99,  200),
  (2, 'Mechanical Keyboard','Electronics', 79.99,  120),
  (3, 'USB-C Hub',          'Electronics', 34.50,  150),
  (4, 'Office Chair',       'Furniture',   199.00, 40),
  (5, 'Standing Desk',      'Furniture',   349.00, 25),
  (6, 'Notebook Set',       'Stationery',  9.99,   500),
  (7, 'Desk Lamp',          'Furniture',   45.00,  80),
  (8, 'Webcam 1080p',       'Electronics', 59.99,  90),
  (9, 'Bluetooth Speaker',  'Electronics', 49.99,  60);
-- Bluetooth Speaker (9) intentionally never appears in `sales` — used by
-- the "products never sold" anti-join question.

INSERT INTO orders (order_id, customer_id, employee_id, order_date, status) VALUES
  (1, 1, 5, '2023-01-05', 'completed'),
  (2, 2, 5, '2023-01-18', 'completed'),
  (3, 3, 6, '2023-02-02', 'completed'),
  (4, 1, 5, '2023-02-20', 'cancelled'),
  (5, 4, 6, '2023-03-11', 'completed'),
  (6, 5, 5, '2023-03-15', 'pending'),
  (7, 2, 6, '2023-04-01', 'completed'),
  (8, 6, 5, '2023-04-19', 'completed'),
  (9, 7, 6, '2023-05-07', 'completed'),
  (10,8, 5, '2023-05-30', 'pending');

INSERT INTO sales (sale_id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 2, 25.99),
  (2, 1, 3, 1, 34.50),
  (3, 2, 2, 1, 79.99),
  (4, 3, 4, 1, 199.00),
  (5, 4, 1, 1, 25.99),
  (6, 5, 5, 1, 349.00),
  (7, 5, 6, 3, 9.99),
  (8, 6, 8, 2, 59.99),
  (9, 7, 2, 1, 79.99),
  (10,7, 3, 2, 34.50),
  (11,8, 6, 5, 9.99),
  (12,9, 4, 2, 199.00),
  (13,9, 7, 1, 45.00),
  (14,10,8, 1, 59.99);
