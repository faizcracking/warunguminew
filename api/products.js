const { supabase } = require('../config/supabase');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { category, search, promo, sort } = req.query;

    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('is_active', true);

    if (category) {
      query = query.eq('categories.slug', category);
    }

    if (promo === 'true') {
      query = query.eq('is_discount_active', true);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Sort options
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: products, error } = await query;

    if (error) throw error;

    // Helper to calculate active promo price server side
    const now = new Date();
    const formattedProducts = products.map(p => {
      let isPromoValid = p.is_discount_active && p.discount_percentage > 0;
      if (p.discount_start && new Date(p.discount_start) > now) isPromoValid = false;
      if (p.discount_end && new Date(p.discount_end) < now) isPromoValid = false;

      const finalPrice = isPromoValid 
        ? Math.round(p.price - (p.price * (p.discount_percentage / 100))) 
        : Number(p.price);

      return {
        ...p,
        is_promo_active: isPromoValid,
        normal_price: Number(p.price),
        final_price: finalPrice
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};