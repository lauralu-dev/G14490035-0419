(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    document.title = t.login.title;
    const titleEl = document.getElementById('page-title');
    const leadEl = document.getElementById('page-lead');
    if (titleEl) titleEl.textContent = t.login.heading;
    if (leadEl) leadEl.textContent = t.login.lead;
    const demoBtn = document.getElementById('demo-login-btn');
    if (demoBtn && t.login.demoBtn) demoBtn.textContent = t.login.demoBtn;
    if (demoBtn) {
        demoBtn.addEventListener('click', function () {
            localStorage.setItem('greenmart-signed-in', '1');
            window.location.href = 'index.html';
        });
    }
})();
