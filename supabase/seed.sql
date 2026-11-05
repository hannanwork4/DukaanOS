-- DukaanOS Realistic Seed Data for Kirana Store
-- Business: Sharma General Store

-- 1. Insert Demo Business
INSERT INTO businesses (id, name, owner_name, phone, address, currency)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Sharma General Store',
    'Rajesh Sharma',
    '+91 98765 43210',
    'Shop No. 4, Main Market, Lajpat Nagar, New Delhi',
    'INR'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Suppliers
INSERT INTO suppliers (id, business_id, name, business_name, phone, address, total_purchases, amount_paid, outstanding_balance)
VALUES 
(
    's0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Ramesh Kumar',
    'Ramesh Traders',
    '+91 98112 34567',
    'Warehouse 12, Grain Market, Narela, Delhi',
    18500.00,
    14500.00,
    4000.00
),
(
    's0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Sunil Gupta',
    'Gupta Wholesale Dist.',
    '+91 98223 45678',
    'Block C, Khari Baoli, Old Delhi',
    24000.00,
    24000.00,
    0.00
),
(
    's0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Balaji Enterprises',
    'Balaji Dairy & FMCG',
    '+91 98334 56789',
    'Sector 18, Noida',
    12500.00,
    10000.00,
    2500.00
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Products
INSERT INTO products (id, business_id, name, category, sku, unit, current_stock, min_stock_threshold, purchase_price, selling_price)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Fortune Sunlite Refined Sunflower Oil 1L',
    'Edible Oils',
    'OIL-FORT-1L',
    'packets',
    25.00,
    10.00,
    115.00,
    135.00
),
(
    'p0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Aashirvaad Shudh Chakki Atta 5kg',
    'Flours & Grains',
    'ATTA-AASH-5KG',
    'bags',
    18.00,
    8.00,
    215.00,
    250.00
),
(
    'p0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Tata Salt Vacuum Evaporated 1kg',
    'Spices & Seasoning',
    'SALT-TATA-1KG',
    'packets',
    42.00,
    15.00,
    22.00,
    28.00
),
(
    'p0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'Madhur Pure & Hygienic Sugar 1kg',
    'Staples',
    'SUG-MADH-1KG',
    'kg',
    35.00,
    20.00,
    42.00,
    48.00
),
(
    'p0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000001',
    'Tata Sampann Unpolished Toor Dal 1kg',
    'Pulses',
    'DAL-TOOR-1KG',
    'packets',
    4.00,
    10.00, -- LOW STOCK ALERT (4 <= 10)
    140.00,
    165.00
),
(
    'p0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000001',
    'Parle-G Gold Biscuits 100g',
    'Snacks & Biscuits',
    'SNK-PARL-100G',
    'packets',
    3.00,
    12.00, -- LOW STOCK ALERT (3 <= 12)
    8.50,
    10.00
),
(
    'p0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000001',
    'Amul Taaza Homogenised Toned Milk 1L',
    'Dairy',
    'DRY-AMUL-1L',
    'packets',
    14.00,
    6.00,
    62.00,
    72.00
) ON CONFLICT (id) DO NOTHING;

-- 4. Initial Expenses
INSERT INTO expenses (id, business_id, description, category, amount, date, payment_method, notes)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Shop Electricity Bill October',
    'Electricity',
    2450.00,
    NOW() - INTERVAL '2 days',
    'UPI',
    'Paid via BSES online portal'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Tempo Transport charges for grain sacks',
    'Transport',
    600.00,
    NOW() - INTERVAL '1 day',
    'Cash',
    'Local tempo freight from mandi'
) ON CONFLICT (id) DO NOTHING;

-- 5. Seed Initial Transaction in Ledger
INSERT INTO transactions (id, business_id, type, amount, date, description, payment_method, status)
VALUES
(
    't0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'expense',
    2450.00,
    NOW() - INTERVAL '2 days',
    'Shop Electricity Bill October (Electricity)',
    'UPI',
    'completed'
),
(
    't0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'expense',
    600.00,
    NOW() - INTERVAL '1 day',
    'Tempo Transport charges for grain sacks (Transport)',
    'Cash',
    'completed'
) ON CONFLICT (id) DO NOTHING;
