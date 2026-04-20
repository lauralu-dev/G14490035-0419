(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    document.title = t.sell.title;
    document.getElementById('page-title').textContent    = t.sell.heading;
    document.getElementById('page-lead').textContent     = t.sell.lead;
    document.getElementById('lbl-sell-name').textContent = t.sell.nameLabel;
    document.getElementById('lbl-sell-price').textContent = t.sell.priceLabel;
    document.getElementById('lbl-sell-esg').textContent  = t.sell.esgLabel;
    document.getElementById('sell-submit-btn').textContent = t.sell.submitBtn;

    // ── 圖片上傳邏輯 ────
    const inputEl     = document.getElementById('sell-image-input');
    const dropzone    = document.getElementById('sell-image-dropzone');
    const previewWrap = document.getElementById('sell-image-preview');
    const previewImg  = document.getElementById('sell-preview-img');
    const removeBtn   = document.getElementById('sell-image-remove');
    const statusEl    = document.getElementById('sell-image-status');
    let selectedFile     = null;
    let uploadedImageUrl = null;

    dropzone.addEventListener('click', () => inputEl.click());

    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.style.borderColor = '#4a8c3f';
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#c8e0b8';
    });
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.style.borderColor = '#c8e0b8';
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    inputEl.addEventListener('change', () => {
        if (inputEl.files[0]) handleFile(inputEl.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            GreenMart.showToast('請選擇圖片檔案', 'danger');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            GreenMart.showToast('圖片大小不能超過 5MB', 'danger');
            return;
        }
        selectedFile = file;
        uploadedImageUrl = null;
        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            dropzone.classList.add('d-none');
            previewWrap.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
        selectedFile = null;
        uploadedImageUrl = null;
        inputEl.value = '';
        previewImg.src = '';
        previewWrap.classList.add('d-none');
        dropzone.classList.remove('d-none');
        statusEl.classList.add('d-none');
    });

    async function uploadImage(file) {
        // Firebase Storage 接好後取消下面的註解
        // const storageRef = firebase.storage().ref();
        // const fileRef = storageRef.child('listings/' + Date.now() + '_' + file.name);
        // const snapshot = await fileRef.put(file);
        // return await snapshot.ref.getDownloadURL();
        return URL.createObjectURL(file);
    }

    // ── 表單送出（上架）───
    document.getElementById('sell-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const name  = document.getElementById('sell-name').value.trim();
        const price = Number(document.getElementById('sell-price').value);
        const esg   = document.getElementById('sell-esg').value.trim();
        if (!name || !Number.isFinite(price) || price < 1) return;

        const submitBtn = document.getElementById('sell-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '上架中...';

        try {
            if (selectedFile) {
                statusEl.textContent = '圖片上傳中...';
                statusEl.classList.remove('d-none');
                uploadedImageUrl = await uploadImage(selectedFile);
                statusEl.classList.add('d-none');
            }

            GreenMartLocal.addListing({
                name,
                price,
                esgNote: esg,
                imageUrl: uploadedImageUrl || null,
            });

            const pts = GreenMartLocal.earnSellPoints(price);
            GreenMartLocal.appendLedger({
                type: 'sell',
                title: '上架商品',
                detail: name + ' · NT$ ' + price + (esg ? ' · ' + esg : ''),
                pointsDelta: pts,
                creditDelta: 0,
            });

            GreenMart.showToast(t.sell.toastOk + ' (+' + pts + ')', 'success');
            this.reset();

            // 重置圖片區
            selectedFile = null;
            uploadedImageUrl = null;
            previewImg.src = '';
            previewWrap.classList.add('d-none');
            dropzone.classList.remove('d-none');

            // 上架後刷新列表
            renderListings(document.getElementById('listing-filter').value);

        } catch (err) {
            console.error(err);
            GreenMart.showToast('上架失敗，請稍後再試', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = t.sell.submitBtn;
        }
    });

    
    // 我的上架商品 ── 列表 & 下架邏輯


    /** 格式化 ISO 時間為本地字串 */
    function fmtTime(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('zh-Hant-TW', { hour12: false });
    }

    /** 渲染商品列表 */
    function renderListings(filter) {
        filter = filter || 'all';
        const all      = GreenMartLocal.getListings();
        const filtered = filter === 'all' ? all : all.filter(p => p.status === filter);

        const listEl = document.getElementById('my-listings-list');
        const emptyEl = document.getElementById('listings-empty');
        listEl.innerHTML = '';

        if (filtered.length === 0) {
            emptyEl.classList.remove('d-none');
            return;
        }
        emptyEl.classList.add('d-none');

        filtered.forEach(item => {
            const isActive = item.status !== 'delisted';

            const thumb = item.imageUrl
                ? `<img class="listing-thumb" src="${item.imageUrl}" alt="${item.name}">`
                : `<div class="listing-thumb-placeholder">🛒</div>`;

            const badge = isActive
                ? `<span class="listing-badge badge-active">上架中</span>`
                : `<span class="listing-badge badge-delisted">已下架</span>`;

            const actionBtn = isActive
                ? `<button class="btn btn-sm btn-outline-danger delist-btn" data-id="${item.id}">下架</button>`
                : `<button class="btn btn-sm btn-outline-success relist-btn" data-id="${item.id}">重新上架</button>`;

            const timeInfo = isActive
                ? `上架時間：${fmtTime(item.listedAt)}`
                : `上架：${fmtTime(item.listedAt)}　｜　下架：${fmtTime(item.delistedAt)}`;

            const card = document.createElement('div');
            card.className = 'card border-0 shadow-sm my-listing-card';
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="card-body d-flex align-items-center gap-3">
                    ${thumb}
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="fw-semibold text-truncate listing-name">${item.name}</span>
                            ${badge}
                        </div>
                        <div class="text-muted small mt-1">NT$ ${Number(item.price).toLocaleString()}</div>
                        ${item.esgNote ? `<div class="listing-esg mt-1">🌱 ${item.esgNote}</div>` : ''}
                        <div class="listing-time mt-1">${timeInfo}</div>
                    </div>
                    <div class="flex-shrink-0">${actionBtn}</div>
                </div>`;
            listEl.appendChild(card);
        });

        // 綁定下架按鈕
        listEl.querySelectorAll('.delist-btn').forEach(btn => {
            btn.addEventListener('click', () => openDelistConfirm(btn.dataset.id));
        });
        // 綁定重新上架按鈕
        listEl.querySelectorAll('.relist-btn').forEach(btn => {
            btn.addEventListener('click', () => handleRelist(btn.dataset.id));
        });
    }

    // ── 下架確認 ────
    let pendingDelistId = null;

    function openDelistConfirm(id) {
        const item = GreenMartLocal.getListings().find(p => p.id === id);
        if (!item) return;
        pendingDelistId = id;
        document.getElementById('delist-confirm-name').textContent = `「${item.name}」`;
        document.getElementById('delist-overlay').classList.remove('d-none');
    }

    function closeDelistOverlay() {
        document.getElementById('delist-overlay').classList.add('d-none');
        pendingDelistId = null;
    }

    document.getElementById('delist-cancel-btn').addEventListener('click', closeDelistOverlay);

    document.getElementById('delist-overlay').addEventListener('click', e => {
        if (e.target === document.getElementById('delist-overlay')) closeDelistOverlay();
    });

    document.getElementById('delist-confirm-btn').addEventListener('click', () => {
        if (!pendingDelistId) return;
        const result = GreenMartLocal.delistListing(pendingDelistId);
        if (result) {
            GreenMartLocal.appendLedger({
                type: 'delist',
                title: '商品下架',
                detail: result.name + ' · NT$ ' + result.price,
                pointsDelta: 0,
                creditDelta: 0,
            });
            GreenMart.showToast('商品已下架', 'success');
        }
        closeDelistOverlay();
        renderListings(document.getElementById('listing-filter').value);
    });

    // ── 重新上架 ──
    function handleRelist(id) {
        const result = GreenMartLocal.relistListing(id);
        if (result) {
            GreenMartLocal.appendLedger({
                type: 'sell',
                title: '商品重新上架',
                detail: result.name + ' · NT$ ' + result.price,
                pointsDelta: 0,
                creditDelta: 0,
            });
            GreenMart.showToast('商品已重新上架 🌱', 'success');
            renderListings(document.getElementById('listing-filter').value);
        }
    }

    // ── 篩選器 ────
    document.getElementById('listing-filter').addEventListener('change', e => {
        renderListings(e.target.value);
    });

    // ── 初始渲染 ─────
    renderListings('all');
})();