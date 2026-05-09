CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE transactions (
  id VARCHAR(30) PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  amount INTEGER NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  refundable BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE refunds (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(30) NOT NULL REFERENCES transactions(id),
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);