// CUSTOMER SHOP LOGIC
let allProducts = [];
let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  fetchProducts();
  updateCartBadge();

  // Search input binding
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
      renderProducts(filtered);
    });
  }
});

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (result.success) {
      allCategories = result.data;
      renderCategories(result.data);
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function renderCategories(categories) {
  const container = document.getElementById('categoryContainer');
  if (!container) return;

  let html = `<button class="category-chip active" onclick="filterByCategory('all', this)">Semua Kategori</button>`;
  categories.forEach(cat => {
    html += `<button class="category-chip" onclick="filterByCategory('${cat.slug}', this)">${cat.name}</button>`;
  });
  container.innerHTML = html;
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const result = await res.json();
    if (result.success) {
      allProducts = result.data;
      renderProducts(allProducts);
      renderPromoProducts(allProducts.filter(p => p.is_promo_active));
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function filterByCategory(slug, btnElement) {
  document.querySelectorAll('.category-chip').forEach(el => el.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  if (slug === 'all') {
    renderProducts(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.categories && p.categories.slug === slug);
    renderProducts(filtered);
  }
}

function renderProducts(products) {
  const container = document.getElementById('productGrid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748B;">Tidak ada produk ditemukan.</div>`;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="product-card">
      ${p.is_promo_active ? `<span class="badge-discount">DISKON ${p.discount_percentage}%</span>` : ''}
      <div class="product-img-wrapper">
        <img src="${p.image_url || 'https://via.placeholder.com/200x200?text=Warung+Umi'}" alt="${p.name}" class="product-img">
      </div>
      <div class="product-info">
        <span class="product-category">${p.categories?.name || 'Kelontong'}</span>
        <h3 class="product-title">${p.name}</h3>
        <div class="price-wrapper">
          ${p.is_promo_active ? `<div class="price-normal-strike">Rp ${Number(p.normal_price).toLocaleString('id-ID')}</div>` : ''}
          <div class="price-final">Rp ${Number(p.final_price).toLocaleString('id-ID')}</div>
        </div>
        <button class="btn-add-cart" ${p.stock <= 0 ? 'disabled' : ''} onclick="addToCart('${p.id}')">
          <i class="fas ${p.stock <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i> ${p.stock <= 0 ? 'Stok Habis' : 'Tambah Ke Keranjang'}
        </button>
      </div>
    </div>
  `).join('');
}

function renderPromoProducts(promoProducts) {
  const container = document.getElementById('promoGrid');
  if (!container) return;
  if (!promoProducts || promoProducts.length === 0) {
    document.getElementById('promoSection').style.display = 'none';
    return;
  }
  container.innerHTML = promoProducts.slice(0, 4).map(p => `
    <div class="product-card">
      <span class="badge-discount">PROMO ${p.discount_percentage}%</span>
      <div class="product-img-wrapper">
        <img src="${p.image_url || 'https://via.placeholder.com/200x200?text=Promo+Umi'}" alt="${p.name}" class="product-img">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.name}</h3>
        <div class="price-wrapper">
          <div class="price-normal-strike">Rp ${Number(p.normal_price).toLocaleString('id-ID')}</div>
          <div class="price-final">Rp ${Number(p.final_price).toLocaleString('id-ID')}</div>
        </div>
        <button class="btn-add-cart" onclick="addToCart('${p.id}')">
          <i class="fas fa-cart-plus"></i> Beli Sekarang
        </button>
      </div>
    </div>
  `).join('');
}

// CART MANAGEMENT IN LOCALSTORAGE
function getCart() {
  return JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('warung_umi_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity += 1;
    } else {
      alert('Jumlah melebihi stok yang tersedia!');
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      normal_price: product.normal_price,
      discount_percentage: product.is_promo_active ? product.discount_percentage : 0,
      final_price: product.final_price,
      quantity: 1,
      image_url: product.image_url
    });
  }

  saveCart(cart);
  alert(`"${product.name}" berhasil ditambahkan ke keranjang!`);
}

function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badgeEl = document.getElementById('cartBadge');
  if (badgeEl) {
    badgeEl.textContent = totalCount;
  }
}