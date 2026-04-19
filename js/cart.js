(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    document.title = t.cart.title;
    const titleEl = document.getElementById('page-title');
    const leadEl = document.getElementById('page-lead');
    if (titleEl) titleEl.textContent = t.cart.heading;
    if (leadEl) leadEl.textContent = t.cart.empty;
})();
