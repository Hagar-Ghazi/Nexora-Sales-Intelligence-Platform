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
('diana@company.com', 'Diana Prince', 'admin', 'IT Operations');

INSERT INTO products (name, category, price, tier, stock_quantity) VALUES
('Enterprise Widget', 'Hardware', 1200.00, 'Enterprise', 50),
('Standard Widget', 'Hardware', 300.00, 'Standard', 500),
('Cloud Storage 1TB', 'Software', 120.00, 'Basic', 9999),
('Premium Support', 'Service', 500.00, 'Premium', 9999);

-- Note: In a real system, you'd insert valid UUIDs for sales_rep_id and product_id
