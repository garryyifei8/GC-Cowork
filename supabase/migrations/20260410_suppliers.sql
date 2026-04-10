-- Supplier management table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('material','equipment','subcontract','service','consulting')),
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    qualification TEXT DEFAULT '',
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
    projects TEXT[] DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- Optional FK columns for procurement_packages and invoices
ALTER TABLE procurement_packages ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES suppliers(id);
