(function () {
  const PHONE = '+1 (909) 754-1412';
  const EMAIL = 'support@lumaxpeptides.com';

  const cookieBanner = document.getElementById('cookie-banner');
  if (!localStorage.getItem('lumax_cookies')) cookieBanner?.classList.remove('hidden');
  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('lumax_cookies', 'accepted');
    cookieBanner?.classList.add('hidden');
  });
  document.getElementById('cookie-reject')?.addEventListener('click', () => {
    localStorage.setItem('lumax_cookies', 'rejected');
    cookieBanner?.classList.add('hidden');
  });
  if (localStorage.getItem('lumax_cookies')) cookieBanner?.classList.add('hidden');

  // Mobile menu
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });

  // Cart
  let cart = JSON.parse(localStorage.getItem('lumax_cart') || '[]');
  const cartPanel = document.getElementById('cart-panel');
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');

  function saveCart() {
    localStorage.setItem('lumax_cart', JSON.stringify(cart));
    renderCart();
  }

  function renderCart() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    if (cartCount) cartCount.textContent = count;
    if (cartSubtotal) cartSubtotal.textContent = '$' + total;
    if (!cartItems) return;
    if (!cart.length) {
      cartItems.innerHTML = '<p class="text-sm text-zinc-500">Your cart is empty.</p>';
      return;
    }
    cartItems.innerHTML = cart.map((item, idx) => `
      <div class="rounded-2xl border border-purple-900/40 bg-black/50 p-4">
        <div class="flex justify-between gap-2">
          <div>
            <p class="font-semibold text-white">${item.name}</p>
            <p class="text-xs text-zinc-400">${item.dosage} · ${item.tier}</p>
          </div>
          <button data-remove="${idx}" class="text-purple-300 hover:text-white text-sm">✕</button>
        </div>
        <div class="mt-2 flex justify-between text-sm">
          <span class="text-zinc-400">Qty: ${item.qty}</span>
          <span class="font-semibold text-white">$${item.price * item.qty}</span>
        </div>
      </div>
    `).join('');
    cartItems.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        cart.splice(Number(btn.dataset.remove), 1);
        saveCart();
      });
    });
  }

  document.getElementById('cart-toggle')?.addEventListener('click', () => {
    cartPanel?.classList.remove('hidden');
  });
  document.getElementById('cart-close')?.addEventListener('click', () => {
    cartPanel?.classList.add('hidden');
  });
  renderCart();

  // Product interactions (store page only)
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const state = {};

  grid.querySelectorAll('.product-card').forEach((card) => {
    const id = card.id;
    state[id] = { tierIndex: 0, dosageIndex: 0, qty: 1 };
  });

  function activeClass(btn, isActive) {
    const tierActive = 'border-purple-300 bg-purple-500/20 text-white';
    const tierInactive = 'border-purple-900/35 bg-zinc-950/80 text-zinc-200 hover:border-purple-400 hover:text-white';
    const doseActive = 'border-purple-400 bg-purple-500/25 text-white';
    const doseInactive = 'border-purple-900/40 bg-black/50 text-purple-100 hover:border-purple-400 hover:text-white';
    const isTier = btn.classList.contains('tier-btn');
    btn.className = btn.className.replace(tierActive, '').replace(tierInactive, '').replace(doseActive, '').replace(doseInactive, '');
    btn.className += ' ' + (isActive ? (isTier ? tierActive : doseActive) : (isTier ? tierInactive : doseInactive));
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }

  document.querySelectorAll('.tier-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.product;
      state[pid].tierIndex = Number(btn.dataset.tierIndex);
      grid.querySelectorAll(`.tier-btn[data-product="${pid}"]`).forEach((b) => activeClass(b, b === btn));
    });
  });

  document.querySelectorAll('.dosage-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.product;
      state[pid].dosageIndex = Number(btn.dataset.dosageIndex);
      grid.querySelectorAll(`.dosage-btn[data-product="${pid}"]`).forEach((b) => activeClass(b, b === btn));
      const addBtn = grid.querySelector(`.add-to-cart[data-product="${pid}"]`);
      if (addBtn) addBtn.textContent = 'Add ' + btn.textContent.trim();
    });
  });

  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.product;
      const display = grid.querySelector(`.qty-display[data-product="${pid}"]`);
      let q = state[pid].qty;
      if (btn.dataset.action === 'inc') q = Math.min(q + 1, 99);
      else q = Math.max(q - 1, 1);
      state[pid].qty = q;
      if (display) display.textContent = q;
    });
  });

  document.querySelectorAll('.add-to-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.product;
      const card = document.getElementById(pid);
      const name = card.querySelector('h3').textContent;
      const tiers = [...card.querySelectorAll('.tier-btn')];
      const doses = [...card.querySelectorAll('.dosage-btn')];
      const tier = tiers[state[pid].tierIndex];
      const dose = doses[state[pid].dosageIndex];
      const price = Number(tier.querySelector('.text-white.text-sm, .font-semibold.text-white')?.textContent?.replace('$', '') || 0);
      cart.push({
        name,
        dosage: dose.textContent.trim(),
        tier: tier.querySelector('.uppercase')?.textContent?.trim() || '1 Vial',
        price,
        qty: state[pid].qty,
      });
      saveCart();
      cartPanel?.classList.remove('hidden');
      btn.textContent = 'Added!';
      setTimeout(() => { btn.textContent = 'Add ' + dose.textContent.trim(); }, 1200);
    });
  });

  // Search
  const search = document.getElementById('product-search');
  const countEl = document.getElementById('product-count');
  const cards = [...grid.querySelectorAll('.product-card')];

  function updateCount(visible) {
    if (countEl) countEl.textContent = `Showing ${visible} of ${cards.length} total peptides.`;
  }

  search?.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    let visible = 0;
    cards.forEach((card) => {
      const match = !q || card.dataset.name.includes(q) || card.querySelector('h3').textContent.toLowerCase().includes(q);
      card.classList.toggle('hidden', !match);
      if (match) visible++;
    });
    updateCount(visible);
  });

  // Category filters
  let activeCategory = 'All Products';
  document.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      document.querySelectorAll('.category-btn').forEach((b) => {
        const on = b === btn;
        b.className = b.className.replace('border-purple-400 bg-purple-500/30 text-white shadow-[0_0_30px_rgba(120,48,255,0.35)]', '');
        if (on) b.className += ' border-purple-400 bg-purple-500/30 text-white shadow-[0_0_30px_rgba(120,48,255,0.35)]';
      });
      filterCards();
    });
  });

  function filterCards() {
    const q = search?.value.toLowerCase().trim() || '';
    let visible = 0;
    cards.forEach((card) => {
      const nameMatch = !q || card.dataset.name.includes(q);
      let catMatch = activeCategory === 'All Products';
      if (!catMatch && activeCategory === 'Featured') {
        catMatch = !!card.querySelector('.text-amber-200');
      } else if (!catMatch) {
        catMatch = (card.dataset.categories || '').toLowerCase().includes(activeCategory.toLowerCase().replace(/ research/g, ''));
      }
      const show = nameMatch && catMatch;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    updateCount(visible);
  }
})();