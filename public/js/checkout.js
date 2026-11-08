// CHECKOUT LOGIC & WHATSAPP INTEGRATION
document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
});

function renderCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
  const summaryEl = document.getElementById('checkoutItemsSummary');
  const grandTotalEl = document.getElementById('checkoutGrandTotal');

  if (cart.length === 0) {
    alert('Keranjang belanja kosong. Kembali ke katalog.');
    window.location.href = '/';
    return;
  }

  let total = 0;
  summaryEl.innerHTML = cart.map(item => {
    const itemTotal = item.final_price * item.quantity;
    total += itemTotal;
    return `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
        <span>${item.name} x ${item.quantity} ${item.discount_percentage > 0 ? `(${item.discount_percentage}% Off)` : ''}</span>
        <strong>Rp ${itemTotal.toLocaleString('id-ID')}</strong>
      </div>
    `;
  }).join('');

  grandTotalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const cart = JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
  if (cart.length === 0) return;

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const deliveryType = document.getElementById('deliveryType').value;
  const notes = document.getElementById('custNotes').value.trim();

  const submitBtn = document.getElementById('btnSubmitCheckout');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses Pesanan...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        delivery_address: address,
        delivery_type: deliveryType,
        notes: notes,
        items: cart
      })
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    // Format WhatsApp Message
    let waText = `Assalamu'alaikum Warung Umi.\nSaya ingin memesan:\n`;
    let grandTotal = 0;

    result.data.items.forEach((item, i) => {
      const itemSubtotal = item.final_price * item.quantity;
      grandTotal += itemSubtotal;
      if (item.discount_percentage > 0) {
        waText += `${i+1}. ${item.product_name} ${item.quantity}x = Rp${itemSubtotal.toLocaleString('id-ID')} (Diskon ${item.discount_percentage}%)\n`;
      } else {
        waText += `${i+1}. ${item.product_name} ${item.quantity}x = Rp${itemSubtotal.toLocaleString('id-ID')}\n`;
      }
    });

    waText += `Total: Rp${grandTotal.toLocaleString('id-ID')}\n`;
    waText += `Nama: ${name}\n`;
    waText += `Nomor HP: ${phone}\n`;
    waText += `Alamat: ${address}\n`;
    waText += `Catatan: ${deliveryType === 'delivery' ? 'Mohon diantar. ' : 'Diambil sendiri. '}${notes ? notes : ''}\n`;
    waText += `Mohon konfirmasi pesanan saya. Terima kasih.`;

    const encodedText = encodeURIComponent(waText);
    const waNumber = result.data.whatsapp_number.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${waNumber}?text=${encodedText}`;

    // Clear cart locally
    localStorage.removeItem('warung_umi_cart');

    // Redirect to WhatsApp
    window.location.href = waUrl;
  } catch (err) {
    alert(`Error: ${err.message}`);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirim Pesanan ke WhatsApp';
  }
}