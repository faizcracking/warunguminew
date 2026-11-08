const { supabaseAdmin } = require('../../config/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Token authentication check for Admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ success: false, message: 'Sesi login tidak valid atau kadaluarsa.' });
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses dilarang. Anda bukan admin!' });
    }

    // Fetch Stats
    const { count: totalProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const { count: availableProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).gt('stock', 0);
    const { count: outOfStockProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).lte('stock', 0);
    const { count: totalCategories } = await supabaseAdmin.from('categories').select('*', { count: 'exact', head: true });
    const { count: totalOrders } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });

    // Fetch Recent Orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts: totalProducts || 0,
          availableProducts: availableProducts || 0,
          outOfStockProducts: outOfStockProducts || 0,
          totalCategories: totalCategories || 0,
          totalOrders: totalOrders || 0
        },
        recentOrders: recentOrders || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};