// ADMIN DASHBOARD LOGIC
const SUPABASE_URL = "YOUR_SUPABASE_URL"; 
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
});

async function checkAdminAuth() {
  const token = localStorage.getItem('warung_umi_admin_token');
  const path = window.location.pathname;

  if (!token && !path.includes('login.html')) {
    window.location.href = '/admin/login.html';
    return;
  }

  if (token && path.includes('login.html')) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  if (token && path.includes('dashboard.html')) {
    loadDashboardStats();
    loadAdminProducts();
  }
}

async function loadDashboardStats() {
  const token = localStorage.getItem('warung_umi_admin_token');
  try {
    const res = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('statTotalProducts').textContent = result.data.stats.totalProducts;
      document.getElementById('statAvailableProducts').textContent = result.data.stats.availableProducts;
      document.getElementById('statOutOfStock').textContent = result.data.stats.outOfStockProducts;
      document.getElementById('statTotalOrders').textContent = result.data.stats.totalOrders;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function adminLogout() {
  localStorage.removeItem('warung_umi_admin_token');
  window.location.href = '/admin/login.html';
}