(async function () {
    const lang = GreenMart.getLang();
    const t = await GreenMart.loadTranslations(lang);
    GreenMart.applyNavLabels(t);
    GreenMart.wireNavLang();
    GreenMart.setActiveNav();
    GreenMart.attachAuthNav(t);
    document.title = t.sell.title;
    document.getElementById('page-title').textContent = t.sell.heading;
    document.getElementById('page-lead').textContent = t.sell.lead;
    document.getElementById('lbl-sell-name').textContent = t.sell.nameLabel;
    document.getElementById('lbl-sell-price').textContent = t.sell.priceLabel;
    document.getElementById('lbl-sell-esg').textContent = t.sell.esgLabel;
    document.getElementById('sell-submit-btn').textContent = t.sell.submitBtn;

    // --- 圖片上傳邏輯 ---
    const inputEl    = document.getElementById('sell-image-input');
    const dropzone   = document.getElementById('sell-image-dropzone');
    const previewWrap = document.getElementById('sell-image-preview');
    const previewImg  = document.getElementById('sell-preview-img');
    const removeBtn   = document.getElementById('sell-image-remove');
    const statusEl    = document.getElementById('sell-image-status');
    let selectedFile  = null;
    let uploadedImageUrl = null;

    // 點擊 dropzone 觸發 file input
    dropzone.addEventListener('click', () => inputEl.click());

    // 拖曳支援
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

    // 選擇檔案後處理
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

        // 本地預覽
        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            dropzone.classList.add('d-none');
            previewWrap.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    // 移除圖片
    removeBtn.addEventListener('click', () => {
        selectedFile = null;
        uploadedImageUrl = null;
        inputEl.value = '';
        previewImg.src = '';
        previewWrap.classList.add('d-none');
        dropzone.classList.remove('d-none');
        statusEl.classList.add('d-none');
    });

    // 上傳圖片到 Firebase Storage
    async function uploadImage(file) {
        // Firebase Storage 接好後取消下面的註解
        // const storageRef = firebase.storage().ref();
        // const fileRef = storageRef.child('listings/' + Date.now() + '_' + file.name);
        // const snapshot = await fileRef.put(file);
        // return await snapshot.ref.getDownloadURL();

        // Firebase 尚未接好時，回傳本地 blob URL 作為暫代
        return URL.createObjectURL(file);
    }

    // --- 表單送出 ---
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
            // 有選圖片才上傳
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

        } catch (err) {
            console.error(err);
            GreenMart.showToast('上架失敗，請稍後再試', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = t.sell.submitBtn;
        }
    });
})();