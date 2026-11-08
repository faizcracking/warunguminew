-- WARUNG UMI DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE (for admin & roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CREATE STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(100) NOT NULL DEFAULT 'WARUNG UMI',
    whatsapp_number VARCHAR(20) NOT NULL DEFAULT '6285213205216',
    address TEXT NOT NULL DEFAULT 'Jaten, Karanganyar',
    description TEXT DEFAULT 'Toko kelontong kebutuhan sehari-hari lengkap, murah, dan terpercaya.',
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default store settings if none exists
INSERT INTO public.store_settings (store_name, whatsapp_number, address, description)
SELECT 'WARUNG UMI', '6285213205216', 'Jaten, Karanganyar', 'Toko kelontong kebutuhan sehari-hari lengkap, murah, dan terpercaya.'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 4. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'box',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert Default Categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Sembako', 'sembako', 'shopping-bag'),
('Minuman', 'minuman', 'coffee'),
('Makanan', 'makanan', 'utensils'),
('Mie Instan', 'mie-instan', 'box'),
('Perawatan Tubuh', 'perawatan-tubuh', 'smile'),
('Kebutuhan Rumah Tangga', 'kebutuhan-rumah-tangga', 'home'),
('Snack', 'snack', 'cookie'),
('Lain-lain', 'lain-lain', 'grid')
ON CONFLICT (name) DO NOTHING;

-- 5. CREATE PRODUCTS TABLE (with Discount & Promo feature)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150),
    description TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Discount & Promo fields (Shopee style)
    is_discount_active BOOLEAN DEFAULT FALSE,
    discount_percentage INT DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_start TIMESTAMP WITH TIME ZONE,
    discount_end TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for product search and category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 6. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'delivery', -- 'delivery' atau 'pickup'
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu Konfirmasi', -- 'Menunggu Konfirmasi', 'Diproses', 'Selesai', 'Dibatalkan'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    normal_price DECIMAL(12, 2) NOT NULL,
    discount_percentage INT DEFAULT 0,
    final_price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(12, 2) NOT NULL
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public can read, user can update own profile, admin full access
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Store Settings: Public read, Admin manage
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin update store settings" ON public.store_settings FOR ALL USING (public.is_admin());

-- Categories: Public read active, Admin manage
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products: Public read active products, Admin manage all
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (public.is_admin());

-- Orders: Public create order (checkout), Admin manage all orders
CREATE POLICY "Public create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own order" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (public.is_admin());

-- Order Items: Public create items, Admin read/manage
CREATE POLICY "Public create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Admin manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- 9. SEED DUMMY PRODUCTS FOR DEMO
DO $$
DECLARE
    cat_sembako UUID;
    cat_minuman UUID;
    cat_mie UUID;
BEGIN
    SELECT id INTO cat_sembako FROM public.categories WHERE slug = 'sembako' LIMIT 1;
    SELECT id INTO cat_minuman FROM public.categories WHERE slug = 'minuman' LIMIT 1;
    SELECT id INTO cat_mie FROM public.categories WHERE slug = 'mie-instan' LIMIT 1;

    INSERT INTO public.products (category_id, name, description, price, stock, is_active, is_discount_active, discount_percentage) VALUES
    (cat_sembako, 'Beras Lahap 5 kg', 'Beras putih pulen bermutu tinggi 5 kg', 75000, 50, true, true, 10),
    (cat_sembako, 'Gula GMP 1 kg', 'Gula pasir murni Kemasan 1 kg', 18000, 100, true, false, 0),
    (cat_sembako, 'Minyak Goreng Bimoli 2L', 'Minyak goreng kelapa sawit 2 Liters', 38000, 40, true, true, 15),
    (cat_mie, 'Indomie Goreng Spesial', 'Mie instan goreng rasa spesial 85g', 3500, 200, true, false, 0),
    (cat_minuman, 'Teh Botol Sosro 450ml', 'Teh melati dalam kemasan botol PET', 5000, 80, true, true, 20)
    ON CONFLICT DO NOTHING;
END $$;