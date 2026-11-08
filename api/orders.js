const { supabase, supabaseAdmin } = require('../config/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { customer_name, customer_phone, delivery_address, notes, delivery_type, items } = req.body;

      if (!customer_name || !customer_phone || !items || !items.length) {
        return res.status(400).json({ success: false, message: 'Data checkout tidak lengkap' });
      }

      // Fetch latest prices for items server-side to prevent price manipulation
      const itemIds = items.map(i => i.id);
      const { data: dbProducts, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', itemIds);

      if (prodError || !dbProducts) {
        throw new Error('Gagal memverifikasi produk.');
      }

      let grandTotal = 0;
      const verifiedItems = [];
      const now = new Date();

      for (const item of items) {
        const prod = dbProducts.find(p => p.id === item.id);
        if (!prod) continue;

        let isPromoValid = prod.is_discount_active && prod.discount_percentage > 0;
        if (prod.discount_start && new Date(prod.discount_start) > now) isPromoValid = false;
        if (prod.discount_end && new Date(prod.discount_end) < now) isPromoValid = false;

        const normalPrice = Number(prod.price);
        const finalPrice = isPromoValid 
          ? Math.round(normalPrice - (normalPrice * (prod.discount_percentage / 100))) 
          : normalPrice;

        const qty = parseInt(item.quantity) || 1;
        const subtotal = finalPrice * qty;
        grandTotal += subtotal;

        verifiedItems.push({
          product_id: prod.id,
          product_name: prod.name,
          normal_price: normalPrice,
          discount_percentage: isPromoValid ? prod.discount_percentage : 0,
          final_price: finalPrice,
          quantity: qty,
          subtotal: subtotal
        });
      }

      // Generate Order Code (e.g. UMI-20261108-999)
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const order_code = `UMI-${dateStr}-${randomCode}`;

      // Save order to Database
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([{
          order_code,
          customer_name,
          customer_phone,
          delivery_address: delivery_address || 'Ambil Sendiri',
          notes: notes || '-',
          delivery_type: delivery_type || 'delivery',
          total_amount: grandTotal,
          status: 'Menunggu Konfirmasi'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Save order items
      const orderItemsToInsert = verifiedItems.map(vi => ({
        order_id: orderData.id,
        ...vi
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // Get Store Settings for WhatsApp Number
      const { data: storeSetting } = await supabase
        .from('store_settings')
        .select('whatsapp_number')
        .limit(1)
        .single();

      const waNumber = storeSetting?.whatsapp_number || '6285213205216';

      return res.status(200).json({
        success: true,
        data: {
          order: orderData,
          items: verifiedItems,
          whatsapp_number: waNumber
        }
      });
    } catch (err) {
      console.error('Checkout error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
};