/**
 * 綠點計算（共用）— 規則可依專案調整，之後可改為讀取 Firestore 設定
 */
window.GreenMart = window.GreenMart || {};

GreenMart.points = {
    /** 每消費 1 元可獲得幾綠點（例：0.1 = 10 元 1 點） */
    ratePerDollar: 0.1,

    /**
     * @param {number} subtotal 訂單小計（元）
     * @param {{ esgBonus?: number, round?: 'floor' | 'round' }} [opts]
     * @returns {number}
     */
    earnFromOrder(subtotal, opts) {
        const bonus = opts && typeof opts.esgBonus === 'number' ? opts.esgBonus : 1;
        const raw = subtotal * this.ratePerDollar * bonus;
        const mode = (opts && opts.round) || 'floor';
        if (mode === 'round') return Math.round(raw);
        return Math.floor(raw);
    },
};
