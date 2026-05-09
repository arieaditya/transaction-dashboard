INSERT INTO customers (name, email) VALUES
('Budi Santoso', 'budi@example.com'),
('Siti Rahma', 'siti@example.com'),
('Andi Pratama', 'andi@example.com'),
('Nadia Putri', 'nadia@example.com'),
('Rizky Hidayat', 'rizky@example.com'),
('Clara Wijaya', 'clara@example.com'),
('Farhan Maulana', 'farhan@example.com'),
('Maya Lestari', 'maya@example.com');

INSERT INTO transactions (id, customer_id, amount, payment_method, status, created_at, refundable) VALUES
('TXN-10001', 1, 250000, 'QRIS', 'PAID', '2026-05-05 19:30:00', true),
('TXN-10002', 2, 175000, 'VA_BCA', 'PENDING', '2026-05-05 18:10:00', false),
('TXN-10003', 3, 890000, 'CARD', 'FAILED', '2026-05-05 17:45:00', false),
('TXN-10004', 4, 320000, 'EWALLET', 'REFUNDED', '2026-05-05 16:20:00', false),
('TXN-10005', 5, 540000, 'QRIS', 'PAID', '2026-05-05 15:50:00', true),
('TXN-10006', 6, 125000, 'EWALLET', 'PENDING', '2026-05-05 14:15:00', false),
('TXN-10007', 7, 760000, 'CARD', 'PAID', '2026-05-05 13:40:00', true),
('TXN-10008', 8, 98000, 'QRIS', 'FAILED', '2026-05-05 12:55:00', false);

INSERT INTO refunds (transaction_id, reason, created_at) VALUES
('TXN-10004', 'Customer requested refund', '2026-05-05 17:00:00');