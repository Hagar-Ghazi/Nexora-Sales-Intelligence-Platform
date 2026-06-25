-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('sales', 'support', 'manager', 'admin')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    tier VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Records Table
CREATE TABLE sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    sales_rep_id UUID REFERENCES users(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes BIGINT,
    storage_path VARCHAR(500),
    uploaded_by UUID REFERENCES users(id),
    access_roles TEXT[], -- Array of roles ['sales', 'support']
    document_type VARCHAR(100),
    content_hash VARCHAR(255),
    qdrant_collection TEXT[],
    chunk_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) Policies
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

-- Sales reps can only see their own records
CREATE POLICY sales_rep_policy ON sales_records
    FOR SELECT
    TO authenticated
    USING (
        sales_rep_id = auth.uid() 
        OR 
        (SELECT role FROM users WHERE id = auth.uid()) IN ('manager', 'admin')
    );

-- Seed Data
INSERT INTO users (email, full_name, role, department) VALUES
('alice@company.com', 'Alice Smith', 'sales', 'Enterprise Sales'),
('bob@company.com', 'Bob Jones', 'support', 'Tech Support'),
('charlie@company.com', 'Charlie Brown', 'manager', 'Sales Management'),
('diana@company.com', 'Diana Prince', 'admin', 'IT Operations'),
('evan@company.com', 'Evan Wright', 'sales', 'Mid-Market Sales'),
('fiona@company.com', 'Fiona Gallagher', 'sales', 'SMB Sales'),
('george@company.com', 'George Miller', 'support', 'Customer Success'),
('hannah@company.com', 'Hannah Abbott', 'manager', 'Operations');

INSERT INTO products (name, category, price, tier, stock_quantity) VALUES
('Enterprise Widget', 'Hardware', 1200.00, 'Enterprise', 50),
('Standard Widget', 'Hardware', 300.00, 'Standard', 500),
('Cloud Storage 1TB', 'Software', 120.00, 'Basic', 9999),
('Cloud Storage 10TB', 'Software', 1000.00, 'Enterprise', 9999),
('Premium Support', 'Service', 500.00, 'Premium', 9999),
('AI Analytics Add-on', 'Software', 800.00, 'Premium', 9999),
('Basic Support', 'Service', 100.00, 'Basic', 9999),
('Network Router Pro', 'Hardware', 450.00, 'Standard', 150);

-- Insert Sales Records using subqueries to get correct UUIDs
INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Acme Corp', 'contact@acme.com', 5, p.price, p.price * 5, 'North America', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM products p, users u WHERE p.name = 'Enterprise Widget' AND u.email = 'alice@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Globex Inc', 'info@globex.com', 20, p.price, p.price * 20, 'Europe', 'completed', CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM products p, users u WHERE p.name = 'Standard Widget' AND u.email = 'evan@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Initech', 'billing@initech.com', 2, p.price, p.price * 2, 'North America', 'pending', CURRENT_TIMESTAMP - INTERVAL '1 days'
FROM products p, users u WHERE p.name = 'Cloud Storage 10TB' AND u.email = 'fiona@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Umbrella Corp', 'procurement@umbrella.com', 1, p.price, p.price * 1, 'Asia', 'completed', CURRENT_TIMESTAMP - INTERVAL '15 days'
FROM products p, users u WHERE p.name = 'Premium Support' AND u.email = 'alice@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Stark Industries', 'tony@stark.com', 50, p.price, p.price * 50, 'North America', 'completed', CURRENT_TIMESTAMP - INTERVAL '30 days'
FROM products p, users u WHERE p.name = 'Network Router Pro' AND u.email = 'evan@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Wayne Enterprises', 'bruce@wayne.com', 10, p.price, p.price * 10, 'North America', 'completed', CURRENT_TIMESTAMP - INTERVAL '12 days'
FROM products p, users u WHERE p.name = 'AI Analytics Add-on' AND u.email = 'alice@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Massive Dynamic', 'info@massive.com', 100, p.price, p.price * 100, 'Europe', 'completed', CURRENT_TIMESTAMP - INTERVAL '20 days'
FROM products p, users u WHERE p.name = 'Cloud Storage 1TB' AND u.email = 'fiona@company.com';

INSERT INTO sales_records (product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date)
SELECT p.id, u.id, 'Cyberdyne Systems', 'miles@cyberdyne.com', 3, p.price, p.price * 3, 'North America', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '8 days'
FROM products p, users u WHERE p.name = 'Enterprise Widget' AND u.email = 'evan@company.com';
