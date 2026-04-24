function renderProfile(t) {
    document.getElementById('points-balance').textContent = String(GreenMartLocal.getPoints());
    document.getElementById('credit-balance').textContent =
        'NT$ ' + GreenMartLocal.getShoppingCredit();

    const ledger = GreenMartLocal.getLedger();
    const list = document.getElementById('ledger-list');
    const empty = document.getElementById('ledger-empty');
    list.innerHTML = '';
    if (!ledger.length) {
        empty.textContent = t.profile.emptyLedger;
        empty.classList.remove('d-none');
    } else {
        empty.classList.add('d-none');
        ledger.forEach(function (row) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const time = row.time ? new Date(row.time).toLocaleString('zh-TW') : '';
            let pts = '';
            if (row.pointsDelta) pts += ' 綠點 ' + (row.pointsDelta > 0 ? '+' : '') + row.pointsDelta;
            if (row.creditDelta) pts += ' 購物金 ' + (row.creditDelta > 0 ? '+' : '') + row.creditDelta;
            li.innerHTML =
                '<div class="d-flex justify-content-between flex-wrap gap-2">' +
                '<strong>' +
                (row.title || '') +
                '</strong><span class="text-muted small">' +
                time +
                '</span></div>' +
                '<div class="small text-muted">' +
                (row.detail || '') +
                '</div>' +
                (pts ? '<div class="small">' + pts + '</div>' : '');
            list.appendChild(li);
        });
    }

    const listings = GreenMartLocal.getListings();
    const ul = document.getElementById('listing-list');
    ul.innerHTML = '';
    listings.forEach(function (x) {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        const time = x.time ? new Date(x.time).toLocaleString('zh-TW') : '';
        li.textContent =
            (x.name || '') + ' · NT$ ' + (x.price || 0) + (x.esgNote ? ' · ' + x.esgNote : '') + ' · ' + time;
        ul.appendChild(li);
    });
}

(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    GreenMart.updateCartBadge();
    document.title = t.profile.title;
    document.getElementById('page-title').textContent = t.profile.heading;
    document.getElementById('page-lead').textContent = t.profile.lead;
    document.getElementById('lbl-card-points').textContent = t.profile.cardPoints;
    document.getElementById('lbl-card-credit').textContent = t.profile.cardCredit;
    document.getElementById('lbl-ledger').textContent = t.profile.ledgerTitle;
    document.getElementById('lbl-listings').textContent = t.profile.listingTitle;

    renderProfile(t);
})();
