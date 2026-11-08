// CART PAGE LOGIC
document.addEventListener('DOMContentLoaded', () => {
  renderCartTable();
});

function renderCartTable() {
  const cart = JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
  const tableContainer = document.getElementById('cartTableBody');
  const totalAmountEl = document.getElementById('cartTotalAmount');

  if (!tableContainer) return;

  if (cart.length === 0) {
    tableContainer.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #64748B;">
          Keranjang belanja Anda kosong. <br><a href="/" style="color: #10B981; font-weight: bold; margin-top: 0.5rem; display: inline-block;">Kembali Belanja</a>
        </td>
      </tr>
    `;
    if (totalAmountEl) totalAmountEl.textContent = 'Rp 0';
    return;
  }

  let total = 0;
  tableContainer.innerHTML = cart.map((item, index) => {
    const subtotal = item.final_price * item.quantity;
    total += subtotal;

    return `
      <tr>
        <td style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${item.image_url || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit: cover; border-radius: 6px;">
          <div>
            <strong>${item.name}</strong>
            ${item.discount_percentage > 0 ? `<br><small style="color: #EF4444;">Diskon ${item.discount_percentage}%</small>` : ''}
          </div>
        </td>
        <td>Rp ${Number(item.final_price).toLocaleString('id-ID')}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button onclick="updateQty(${index}, ${item.quantity - 1})" style="padding: 2px 8px;">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateQty(${index}, ${item.quantity + 1})" style="padding: 2px 8px;">+</button>
          </div>
        </td>
        <td><strong>Rp ${subtotal.toLocaleString('id-ID')}</strong></td>
        <td>
          <button onclick="removeItem(${index})" style="background: none; border: none; color: #EF4444; cursor: pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (totalAmountEl) {
    totalAmountEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
  }
}

function updateQty(index, newQty) {
  const cart = JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQty;
  }
  localStorage.setItem('warung_umi_cart', JSON.stringify(cart));
  renderCartTable();
  if (window.updateCartBadge) window.updateCartBadge();
}

function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem('warung_umi_cart') || '[]');
  cart.splice(index, 1);
  localStorage.setItem('warung_umi_cart', JSON.stringify(cart));
  renderCartTable();
  if (window.updateCartBadge) window.updateCartBadge();
}