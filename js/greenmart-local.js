/**
 * 本機示意用：購物車、綠點、購物金、紀錄（不接資料庫）
 * 之後可改為呼叫 Firebase API，鍵名建議沿用或做 migration。
 */
window.GreenMartLocal = window.GreenMartLocal || {};

(function () {
    const CART     = 'greenmart-cart';
    const POINTS   = 'greenmart-points';
    const CREDIT   = 'greenmart-shopping-credit';
    const LEDGER   = 'greenmart-ledger';
    const LISTINGS = 'greenmart-my-listings';

    function readJson(key, fallback) {
        try {
            const s = localStorage.getItem(key);
            return s ? JSON.parse(s) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }

    // ─── 購物車 ────
    GreenMartLocal.getCart = function () {
        const c = readJson(CART, []);
        return Array.isArray(c) ? c : [];
    };

    GreenMartLocal.saveCart = function (items) {
        writeJson(CART, items);
    };

    /** @param {{ id: string, name: string, price: number, qty?: number }} p */
    GreenMartLocal.addToCart = function (p) {
        const items = GreenMartLocal.getCart();
        const qty = p.qty || 1;
        const i = items.findIndex((x) => x.id === p.id);
        if (i >= 0) items[i].qty = (items[i].qty || 1) + qty;
        else items.push({ id: p.id, name: p.name, price: Number(p.price), qty });
        GreenMartLocal.saveCart(items);
        return items;
    };

    // ─── 綠點 ─────

    GreenMartLocal.getPoints = function () {
        const n = parseInt(localStorage.getItem(POINTS), 10);
        return Number.isFinite(n) ? n : 0;
    };

    GreenMartLocal.setPoints = function (n) {
        localStorage.setItem(POINTS, String(Math.max(0, Math.floor(n))));
    };

    // ─── 購物金 ─────

    GreenMartLocal.getShoppingCredit = function () {
        const n = parseFloat(localStorage.getItem(CREDIT));
        return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    };

    GreenMartLocal.setShoppingCredit = function (n) {
        localStorage.setItem(CREDIT, String(Math.max(0, n)));
    };

    /** 綠點兌換成購物金，預設 1 點 = NT$1 購物金 */
    GreenMartLocal.redeemPointsToCredit = function (points, ratio) {
        const r = ratio == null ? 1 : ratio;
        const use = Math.floor(points);
        if (use <= 0) return { ok: false, msg: '請輸入有效的綠點數量' };
        const have = GreenMartLocal.getPoints();
        if (use > have) return { ok: false, msg: '綠點不足' };
        const creditGain = Math.round(use * r * 100) / 100;
        GreenMartLocal.setPoints(have - use);
        GreenMartLocal.setShoppingCredit(GreenMartLocal.getShoppingCredit() + creditGain);
        GreenMartLocal.appendLedger({
            type: 'redeem',
            title: '綠點兌換購物金',
            detail: use + ' 點 → NT$ ' + creditGain + ' 購物金',
            pointsDelta: -use,
            creditDelta: creditGain,
        });
        return { ok: true, creditGain };
    };

    // ─── 帳務紀錄 ────

    GreenMartLocal.appendLedger = function (entry) {
        const list = readJson(LEDGER, []);
        const row = Object.assign(
            {
                time: new Date().toISOString(),
                type: 'info',
                title: '',
                detail: '',
                pointsDelta: 0,
                creditDelta: 0,
            },
            entry
        );
        list.unshift(row);
        writeJson(LEDGER, list.slice(0, 80));
    };

    GreenMartLocal.getLedger = function () {
        return readJson(LEDGER, []);
    };

    // ─── 上架商品 ────

    /**
     * 新增一筆上架紀錄。
     * 自動補上 id、listedAt、status: 'active'。
     */
    GreenMartLocal.addListing = function (item) {
        const list = readJson(LISTINGS, []);
        const newItem = Object.assign(
            {
                id: 'listing_' + Date.now(),
                status: 'active',          // 'active' | 'delisted'
                listedAt: new Date().toISOString(),
                delistedAt: null,
            },
            item
        );
        list.unshift(newItem);
        writeJson(LISTINGS, list.slice(0, 40));
        return newItem;
    };

    GreenMartLocal.getListings = function () {
        const list = readJson(LISTINGS, []);
        return Array.isArray(list) ? list : [];
    };

    /**
     * 對特定商品套用部分更新。
     * @param {string} id
     * @param {object} changes  欲覆寫的欄位
     * @returns {object|null}   更新後的商品，找不到則回 null
     */
    GreenMartLocal.updateListing = function (id, changes) {
        const list = readJson(LISTINGS, []);
        const idx  = list.findIndex(p => p.id === id);
        if (idx === -1) return null;
        Object.assign(list[idx], changes);
        writeJson(LISTINGS, list);
        return list[idx];
    };

    /**
     * 下架指定商品（status → 'delisted'，記錄下架時間）。
     * @param {string} id
     * @returns {object|null}
     */
    GreenMartLocal.delistListing = function (id) {
        return GreenMartLocal.updateListing(id, {
            status: 'delisted',
            delistedAt: new Date().toISOString(),
        });
    };

    /**
     * 重新上架指定商品（status → 'active'，清除下架時間、更新上架時間）。
     * @param {string} id
     * @returns {object|null}
     */
    GreenMartLocal.relistListing = function (id) {
        return GreenMartLocal.updateListing(id, {
            status: 'active',
            listedAt: new Date().toISOString(),
            delistedAt: null,
        });
    };

    // ─── 結帳與贈點 ────

    /** 購買贈點：約訂單金額 10% */
    GreenMartLocal.POINTS_RATE_BUY  = 0.1;
    /** 販售／上架贈點：約標價 5% */
    GreenMartLocal.POINTS_RATE_SELL = 0.05;
    /** 綠點折現：每 10 點 = NT$1 */
    GreenMartLocal.POINTS_PER_DOLLAR_OFF = 10;

    GreenMartLocal.checkoutCart = function (opts) {
        const cart = GreenMartLocal.getCart();
        if (!cart.length) return { ok: false, msg: '購物車是空的' };
        let subtotal = cart.reduce((s, it) => s + it.price * (it.qty || 1), 0);
        subtotal = Math.round(subtotal * 100) / 100;

        const P = GreenMartLocal.getPoints();
        const C = GreenMartLocal.getShoppingCredit();

        const useCredit = Math.min(Math.max(0, opts.useCredit || 0), C, subtotal);
        let remain = Math.round((subtotal - useCredit) * 100) / 100;

        const ppd = GreenMartLocal.POINTS_PER_DOLLAR_OFF;
        const maxPtsByCap = Math.floor(((remain * 0.3) / 1) * ppd);
        const wantRaw = Math.max(0, Math.floor(opts.usePoints || 0));
        const usePts  = Math.min(wantRaw, P, maxPtsByCap);
        const offFromPoints = usePts / ppd;
        remain = Math.max(0, Math.round((remain - offFromPoints) * 100) / 100);

        const earned = Math.floor(remain * GreenMartLocal.POINTS_RATE_BUY);

        GreenMartLocal.setPoints(P - usePts + earned);
        GreenMartLocal.setShoppingCredit(C - useCredit);

        GreenMartLocal.appendLedger({
            type: 'purchase',
            title: '購物結帳',
            detail:
                '訂單 NT$ ' + subtotal +
                '｜購物金折抵 NT$ ' + useCredit +
                '｜綠點折抵 ' + usePts + ' 點（約 NT$ ' + offFromPoints.toFixed(1) + '）' +
                '｜實付約 NT$ ' + remain +
                '｜本次獲得綠點 +' + earned,
            pointsDelta: earned - usePts,
            creditDelta: -useCredit,
        });

        GreenMartLocal.saveCart([]);
        return { ok: true, subtotal, useCredit, usePts, offFromPoints, paid: remain, earned };
    };

    GreenMartLocal.earnSellPoints = function (price) {
        const p = Math.floor(Number(price) * GreenMartLocal.POINTS_RATE_SELL);
        if (p <= 0) return 0;
        GreenMartLocal.setPoints(GreenMartLocal.getPoints() + p);
        return p;
    };
})();