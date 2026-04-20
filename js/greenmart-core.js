/**
 * 綠行選品共用：語系、導覽文字、導覽 active、登入／登出按鈕、Toast
 */
window.GreenMart = window.GreenMart || {};

GreenMart.getLang = function () {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'zh' || q === 'en') return q;
    const saved = localStorage.getItem('greenmart-lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return 'zh';
};

GreenMart.setLang = function (lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    localStorage.setItem('greenmart-lang', lang);
    const u = new URL(window.location.href);
    u.searchParams.set('lang', lang);
    window.location.href = u.toString();
};

GreenMart.loadTranslations = async function (lang) {
    const res = await fetch('lang/' + lang + '.json');
    if (!res.ok) throw new Error('lang load failed');
    return res.json();
};

/* ── 輔助：點分隔路徑取值，例如 "sell.nameLabel" ── */
GreenMart._get = function (obj, path) {
    return path.split('.').reduce((acc, k) => acc?.[k], obj);
};

/* ── 套用一組 { elementId: 'json.key.path' } 對應表 ── */
GreenMart.applyIdMap = function (t, idMap) {
    Object.entries(idMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = GreenMart._get(t, key);
        if (val != null) el.textContent = val;
    });
};

GreenMart.applyNavLabels = function (t) {
    const brand = document.getElementById('nav-brand');
    if (brand && t.brand) brand.textContent = t.brand;
    const pairs = [
        ['nav-home',        t.nav && t.nav.home],
        ['nav-products',    t.nav && t.nav.products],
        ['nav-redeem',      t.nav && t.nav.redeem],
        ['nav-cart',        t.nav && t.nav.cart],
        ['nav-sell',        t.nav && t.nav.sell],
        ['nav-profile',     t.nav && t.nav.profile],
        ['languageDropdown', t.nav && t.nav.language],
    ];
    pairs.forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text;
    });
    const langLabel = document.querySelector('[data-i18n="nav.language"]');
    if (langLabel && t.nav && t.nav.language) langLabel.textContent = t.nav.language;
};

/* ── sell.html 專用標籤翻譯 ── */
GreenMart.applySellLabels = function (t) {
    const idMap = {
        'page-title'                 : 'sell.heading',
        'page-lead'                  : 'sell.lead',
        'lbl-sell-name'              : 'sell.nameLabel',
        'lbl-sell-price'             : 'sell.priceLabel',
        'lbl-sell-esg'               : 'sell.esgLabel',
        'lbl-sell-imageLabel'        : 'sell.imageLabel',
        'lbl-sell-imageHint'         : 'sell.imageHint',
        'lbl-sell-imageSpec'         : 'sell.imageSpec',
        'sell-submit-btn'            : 'sell.submitBtn',
        'lbl-sell-myListingsHeading' : 'sell.myListingsHeading',
        'lbl-sell-filterAll'         : 'sell.filterAll',
        'lbl-sell-filterActive'      : 'sell.filterActive',
        'lbl-sell-filterDelisted'    : 'sell.filterDelisted',
        'lbl-sell-emptyListings'     : 'sell.emptyListings',
        'lbl-sell-delistTitle'       : 'sell.delistTitle',
        'lbl-sell-delistBody'        : 'sell.delistBody',
        'delistCancel'               : 'sell.delistCancel',
        'lbl-sell-delistConfirm'     : 'sell.delistConfirm',
    };
    GreenMart.applyIdMap(t, idMap);

    /* placeholder 另外處理 */
    const placeholders = {
        'sell-name'  : GreenMart._get(t, 'sell.namePlaceholder'),
        'sell-esg'   : GreenMart._get(t, 'sell.esgPlaceholder'),
    };
    Object.entries(placeholders).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el && text) el.placeholder = text;
    });

    /* <title> */
    const titleVal = GreenMart._get(t, 'sell.title');
    if (titleVal) document.title = titleVal;
};

GreenMart.wireNavLang = function () {
    document.querySelectorAll('[data-set-lang]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            GreenMart.setLang(el.getAttribute('data-set-lang'));
        });
    });
};

GreenMart.setActiveNav = function () {
    const page = document.body.getAttribute('data-page');
    if (!page) return;
    document.querySelectorAll('.navbar [data-nav]').forEach((a) => {
        const match = a.getAttribute('data-nav') === page;
        a.classList.toggle('active', match);
        if (match) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
};

GreenMart.attachAuthNav = function (t) {
    const btn = document.getElementById('nav-auth-btn');
    if (!btn) return;
    const loginLabel  = (t && t.nav && t.nav.authLogin)  || '登入';
    const logoutLabel = (t && t.nav && t.nav.authLogout) || '登出';

    function sync() {
        const signedIn = localStorage.getItem('greenmart-signed-in') === '1';
        btn.textContent = signedIn ? logoutLabel : loginLabel;
        btn.classList.toggle('btn-outline-success', !signedIn);
        btn.classList.toggle('btn-outline-danger',   signedIn);
        btn.onclick = function () {
            if (localStorage.getItem('greenmart-signed-in') === '1') {
                localStorage.removeItem('greenmart-signed-in');
                window.location.reload();
            } else if (!/login\.html$/i.test(window.location.pathname)) {
                window.location.href = 'login.html';
            }
        };
    }
    sync();
};

GreenMart.showToast = function (message, variant) {
    const host = document.getElementById('toast-host');
    if (!host || typeof bootstrap === 'undefined' || !bootstrap.Toast) {
        if (message) console.warn('[Toast]', message);
        return;
    }
    const bg =
        variant === 'danger'  ? 'text-bg-danger'  :
        variant === 'success' ? 'text-bg-success' : 'text-bg-dark';
    const el = document.createElement('div');
    el.className = 'toast align-items-center ' + bg + ' border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML =
        '<div class="d-flex"><div class="toast-body">' + message +
        '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
    host.appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 3200 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
};
