/**
 * 兌換頁：綠點→購物金（本機）＋選修的 RTDB 模組
 */
(function () {
    function refreshBalances() {
        const p = document.getElementById('display-points-main');
        const c = document.getElementById('display-credit-main');
        if (p) p.textContent = String(GreenMartLocal.getPoints());
        if (c) c.textContent = String(GreenMartLocal.getShoppingCredit());
    }

    (async function () {
        const lang = GreenMart.getLang();
        const t = await GreenMart.loadTranslations(lang);
        GreenMart.applyNavLabels(t);
        GreenMart.wireNavLang();
        GreenMart.setActiveNav();
        GreenMart.attachAuthNav(t);
        GreenMart.updateCartBadge();
        document.title = t.redeemPage.title;

        const h = document.getElementById('redeem-heading');
        const lead = document.getElementById('redeem-lead');
        if (h) h.textContent = t.redeemPage.heading;
        if (lead) lead.textContent = t.redeemPage.lead;

        document.getElementById('lbl-balance-points').textContent = t.redeemPage.balancePoints;
        document.getElementById('lbl-balance-credit').textContent = t.redeemPage.balanceCredit;
        document.getElementById('lbl-redeem-input').textContent = t.redeemPage.redeemLabel;
        document.getElementById('btn-redeem-credit-main').textContent = t.redeemPage.redeemBtn;
        document.getElementById('redeem-ratio-note').textContent = t.redeemPage.ratioNote;
        document.getElementById('redeem-partner-note').textContent = t.redeemPage.partnerNote;
        document.getElementById('legacy-summary').textContent = t.redeemPage.legacyTitle;
        const lh = document.getElementById('legacy-hint');
        if (lh) lh.textContent = t.redeemPage.legacyHint;

        refreshBalances();

        document.getElementById('btn-redeem-credit-main').addEventListener('click', function () {
            const n = parseInt(document.getElementById('input-redeem-points-main').value, 10);
            const r = GreenMartLocal.redeemPointsToCredit(n);
            if (!r.ok) {
                GreenMart.showToast(r.msg, 'danger');
                return;
            }
            GreenMart.showToast(t.redeemPage.afterRedeem, 'success');
            document.getElementById('input-redeem-points-main').value = '';
            refreshBalances();
        });

        await import('./redeem-rtdb.js');
    })();
})();
