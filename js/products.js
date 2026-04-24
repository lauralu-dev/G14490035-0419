/**
 * 商品介紹：多語、排序、加入購物車（本機）
 */
(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    GreenMart.updateCartBadge();          // ← badge
    document.title = t.products.title;

    const h    = document.getElementById('products-heading');
    const lead = document.getElementById('products-lead');
    if (h)    h.textContent    = t.products.heading;
    if (lead) lead.textContent = t.products.lead;

    // 排序選單文字（多語）
    const optMap = {
        'sort-opt-default'   : t.products.default   || 'Default',
        'sort-opt-price-asc' : t.products.priceAsc  || 'Price: Low to High',
        'sort-opt-price-desc': t.products.priceDesc || 'Price: High to Low',
        'sort-opt-newest'    : t.products.newest    || 'Newest',
    };
    Object.entries(optMap).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });

    // ── 讀取商品資料（從現有 HTML 卡片讀出，保留原始順序）────────
    const grid = document.querySelector('.product-grid');
    const originalCards = Array.from(grid.querySelectorAll('.col-md-4')).map((col, idx) => {
        const btn   = col.querySelector('.btn-add-cart');
        const price = Number(btn.getAttribute('data-product-price'));
        return { col, price, order: idx };
    });

    // ── 渲染（依排序重排 DOM）──────────────────────────────────────
    function renderSorted(mode) {
        const sorted = [...originalCards];
        if (mode === 'price-asc')  sorted.sort((a, b) => a.price - b.price);
        if (mode === 'price-desc') sorted.sort((a, b) => b.price - a.price);
        if (mode === 'newest')     sorted.sort((a, b) => b.order - a.order); // 可之後改為 listedAt
        if (mode === 'default')    sorted.sort((a, b) => a.order - b.order);
        sorted.forEach(({ col }) => grid.appendChild(col));
    }

    // ── 排序事件 ──────────────────────────────────────────────────
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => renderSorted(sortSelect.value));
    }

    // ── 加入購物車按鈕 ────────────────────────────────────────────
    document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
        btn.textContent = t.products.addCart;
        btn.addEventListener('click', function () {
            GreenMartLocal.addToCart({
                id:    this.getAttribute('data-product-id'),
                name:  this.getAttribute('data-product-name'),
                price: Number(this.getAttribute('data-product-price')),
                qty:   1,
            });
            GreenMart.updateCartBadge();   // 加入後即時更新 badge
            GreenMart.showToast(t.products.toastAdded, 'success');
        });
    });
})();