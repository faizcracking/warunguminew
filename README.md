# 🛒 WARUNG UMI – Online Grocery Store & Marketplace Mini

Selamat datang di proyek **WARUNG UMI**! Website toko kelontong keluarga modern, berbasis full-stack web application dengan sistem checkout WhatsApp dan promo diskon ala Shopee.

---

## 📌 Fitur Utama

1. **Customer Front-End**:
   - Beranda modern responsive dengan Navbar, Hero Banner, & Kategori Produk.
   - Pencarian produk & filter otomatis.
   - Keranjang belanja interaktif berbasis `localStorage`.
   - **Checkout WhatsApp**: Mengirim detail pesanan terformat langsung ke WhatsApp Warung Umi (`085213205216`).

2. **Sistem Diskon & Promo Shopee-Style**:
   - Tampilan badge diskon (`-10%`, `-20%`).
   - Harga normal dicoret & harga promo lebih besar.
   - Perhitungan otomatis di backend untuk mencegah kecurangan harga.

3. **Dashboard Admin**:
   - Login aman berbasis Supabase Auth & Role-based security.
   - Overview statistik toko (Total produk, stok habis, total transaksi).
   - Kelola produk, stok, kategori, dan pengaturan nomor WA toko.

---

## 🛠️ Panduan Deployment & Instalasi

### 1. Prasyarat Software
- Node.js (v18+)
- Visual Studio Code
- Git

### 2. Setup Supabase Database
1. Buat akun gratis di [Supabase](https://supabase.com).
2. Buat Project Baru.
3. Buka menu **SQL Editor**, salin seluruh isi file `database/schema.sql`, lalu klik **Run**.
4. Ambil `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari Settings -> API.

### 3. Setup Project Lokal
```bash
# Clone atau Ekstrak Project
git clone https://github.com/username/warung-umi.git
cd warung-umi

# Install Dependencies
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env dan masukkan kunci Supabase Anda
```

### 4. Deployment ke Vercel
1. Upload folder proyek ke GitHub repository.
2. Login ke [Vercel](https://vercel.com) dan hubungkan dengan akun GitHub Anda.
3. Import repository `warung-umi`.
4. Masukkan **Environment Variables** di Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
5. Klik **Deploy**!

---
Dibuat dengan ❤️ untuk Warung Umi.