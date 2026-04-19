/**
 * 兌換頁：導覽與標題後，載入 Firebase Realtime Database 邏輯
 */
(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    document.title = t.redeemPage.title;
    const h = document.getElementById('redeem-heading');
    if (h && t.redeemPage.heading) h.textContent = t.redeemPage.heading;
    await import('./redeem-rtdb.js');
})();
