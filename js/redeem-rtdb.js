import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5NaL2Zv-DFGv4jm11dl17dSvbAubcTlY",
    authDomain: "webprogramming-feb0c.firebaseapp.com",
    databaseURL: "https://webprogramming-feb0c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "webprogramming-feb0c",
    storageBucket: "webprogramming-feb0c.firebasestorage.app",
    messagingSenderId: "387978887434",
    appId: "1:387978887434:web:8be3c89fed08f37b30faf3"
};


//初始化firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

//商品代號對照
const productDatabaseRef = ref(database, 'products');

//對照商品
document.getElementById('checkProductButton').addEventListener('click', async () => {
    const productCode = document.getElementById('productCodeInput').value.trim();

    if (!productCode) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '請輸入商品代號！',
        });
        return;
    }

    const productRef = ref(database, `products/${productCode}`);
    const productSnapshot = await get(productRef);

    if (!productSnapshot.exists()) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: `找不到商品代號: ${productCode}`,
        });
        return;
    }

    const productData = productSnapshot.val();
    document.getElementById('modalProductName').textContent = Object.keys(productData)[0];
    document.getElementById('modalProductPrice').textContent = Object.values(productData)[0];
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
});

//自動填入至金額
document.getElementById('confirmProductButton').addEventListener('click', () => {
    const price = document.getElementById('modalProductPrice').textContent;
    document.getElementById('amountInput').value = `-${price}`; // 在金額前加上負號
    const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    productModal.hide();
});

// 引入 Chart.js 的程式碼
const chartCtx = document.getElementById('transactionChart').getContext('2d');
let transactionChart;

// 渲染消費金額的折線圖
function renderTransactions(transactions) {
    const transactionList = document.querySelector('#transactionRecords .list-group');
    if (!transactionList) {
        console.error('交易紀錄區域未載入。請確認 HTML 結構是否正確。');
        return;
    }
    transactionList.innerHTML = '';
    transactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        const localTime = formatToLocalTime(transaction.timestamp);
        listItem.textContent = `金額: ${transaction.amount} 元，時間: ${localTime}`;
        transactionList.appendChild(listItem);
    });
}

function renderTransactionChart(transactions) {
    const labels = transactions.map(t => formatToLocalTime(t.timestamp));
    const data = transactions.map(t => t.amount);

    if (transactionChart) {
        transactionChart.data.labels = labels;
        transactionChart.data.datasets[0].data = data;
        transactionChart.update();
    } else {
        transactionChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '消費金額 (元)',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: '時間' } },
                    y: { title: { display: true, text: '金額 (元)' }, beginAtZero: true }
                }
            }
        });
    }
}

// 在獲取交易資料後更新圖表
async function renderTransactionsAndChart(transactions) {
    renderTransactions(transactions);
    renderTransactionChart(transactions);
}

// 在頁面載入時加載交易紀錄
window.addEventListener('load', async () => {
    const id = document.getElementById('idInput').value.trim();
    if (id) {
        await fetchTodayTransactions(id);
    }
});

// 更新 fetchTodayTransactions 確保即使無交易仍渲染圖表
async function fetchTodayTransactions(id) {
    if (!id) {
        updateTransactionList('請輸入有效的 ID。');
        renderTransactionChart([]); // 清空圖表
        return;
    }

    const userRef = ref(database, `users/${id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
        updateTransactionList('找不到使用者資料。');
        renderTransactionChart([]); // 清空圖表
        return;
    }

    const userData = userSnapshot.val();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime();

    const transactionsRef = ref(database, `users/${id}/transactions`);
    const snapshot = await get(transactionsRef);

    let transactions = [];
    if (snapshot.exists()) {
        transactions = Object.values(snapshot.val()).filter(transaction => {
            const timestamp = transaction.timestamp ? new Date(transaction.timestamp).getTime() : null;
            return timestamp && timestamp >= startOfDay && timestamp <= endOfDay;
        });
    }

    if (transactions.length > 0) {
        renderTransactionsAndChart(transactions);
    } else {
        updateTransactionList('今日無交易記錄。');
        renderTransactionChart([]); // 確保圖表清空或顯示空值
    }
}

//抓取時區
function formatToLocalTime(utcTime) {
    const localTime = new Date(utcTime);
    return localTime.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
}

//交易紀錄
function updateTransactionList(message = '') {
    const transactionList = document.querySelector('#transactionRecords .list-group');
    if (!transactionList) {
        console.error('交易紀錄區域未載入。請確認 HTML 結構是否正確。');
        return;
    }
    transactionList.innerHTML = message
        ? `<li class="list-group-item">${message}</li>`
        : '';
}

async function getUserStatus(id) {
    const userRef = ref(database, `users/${id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
        console.error(`找不到使用者 ID: ${id}`);
        return null;
    }

    const userData = userSnapshot.val();
    return userData.inOutStatus?.status || 'out';
}

//語音播報
function speakText(message) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'zh-TW'; // 設定語言為繁體中文
    synth.speak(utterance);
}

// 新增用戶檢查與交易處理邏輯
async function handleNewUser(id) {
    const dbRef = ref(database, `users/${id}`);
    const currentTime = new Date().toISOString();

    const newUser = {
        balance: 0,
        inOutStatus: {
            status: 'out',
            timestamp: currentTime,
        },
        transactions: {},
        timestamp: currentTime,
    };

    await set(dbRef, newUser);

    Swal.fire({
        icon: 'success',
        title: '歡迎新用戶！',
        text: `已為 ID: ${id} 建立新用戶資料。`,
    });

    speakText(`歡迎新用戶！已為 ID: ${id} 建立新用戶資料。`);
}

async function handleTransaction(id, amount) {
    const dbRef = ref(database, `users/${id}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
        await handleNewUser(id); // 處理新用戶
        return;
    }


    const userData = snapshot.val();
    const currentTime = new Date().toISOString();

    if (!isNaN(amount)) {
        const newBalance = (userData.balance || 0) + amount;

        if (newBalance < 0) {
            Swal.fire({
                icon: 'error',
                title: '交易失敗',
                text: `餘額不足。當前餘額: ${userData.balance || 0} 元`,
            });
            speakText(`交易失敗，餘額不足。當前餘額為 ${userData.balance || 0} 元。`);
            return;
        }

        const transactionsRef = ref(database, `users/${id}/transactions`);
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, {
            amount,
            timestamp: currentTime,
        });

        await update(dbRef, {
            balance: newBalance,
            timestamp: currentTime,
        });

        Swal.fire({
            icon: 'success',
            title: '交易成功',
            text: `新的餘額是: ${newBalance} 元，時間: ${formatToLocalTime(currentTime)}`,
        });
        speakText(`交易成功，新的餘額為 ${newBalance} 元。`);

        fetchTodayTransactions(id);
    } else {
        const currentStatus = userData.inOutStatus?.status || 'out';
        const newStatus = currentStatus === 'in' ? 'out' : 'in';

        await update(dbRef, {
            inOutStatus: {
                status: newStatus,
                timestamp: currentTime,
            },
            timestamp: currentTime,
        });

        Swal.fire({
            icon: 'info',
            title: '狀態更新',
            text: `ID 現在${newStatus === 'in' ? '進場' : '出場'}，時間: ${formatToLocalTime(currentTime)}`,
        });
        speakText(`狀態更新，ID 現在${newStatus === 'in' ? '進場' : '出場'}。`);

        if (newStatus === 'out') {
            clearTransactionRecordsAndChart();
        }
    }
}

function clearTransactionRecordsAndChart() {
    // 清除交易記錄
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';

    // 清除圖表內容
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '<canvas id="transactionChart"></canvas>';
    console.log('交易記錄與圖表已清除');
}

async function checkBalance(id) {
    const dbRef = ref(database, `users/${id}`);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
        const userData = snapshot.val();
        Swal.fire({
            icon: 'info',
            title: '餘額查詢',
            text: `當前餘額為: ${userData.balance || 0} 元`,
        });
        fetchTodayTransactions(id);
    } else {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: 'ID 不存在，無法查詢餘額。',
        });
    }
}

document.getElementById('submitButton').addEventListener('click', async () => {
    const id = document.getElementById('idInput').value.trim();
    const amount = parseFloat(document.getElementById('amountInput').value.trim());

    if (!id) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '請輸入 ID!',
        });
        return;
    }
    await handleTransaction(id, amount);
});

document.getElementById('checkBalanceButton').addEventListener('click', async () => {
    const id = document.getElementById('idInput').value.trim();
    if (!id) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '請輸入 ID!',
        });
        return;
    }
    await checkBalance(id);
});

//查看交易紀錄與圖表按鈕邏輯
document.getElementById('viewTransactionsButton').addEventListener('click', async () => {
    const id = document.getElementById('idInput').value.trim();
    if (!id) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '請輸入 ID!',
        });
        return;
    }
    await fetchTodayTransactions(id);
});


// 處理 RFID 輸入邏輯
document.addEventListener('keydown', function (event) {
    // 確保 RFID 內容以 Enter 鍵結尾
    if (event.key === 'Enter') {
        const scannedValue = event.target.value.trim();

        // 根據目前焦點輸入到對應的欄位
        if (document.activeElement.id === 'idInput') {
            Swal.fire({
                icon: 'success',
                title: 'RFID 掃描成功',
                text: `ID 已設定為: ${scannedValue}`,
            });
        } else if (document.activeElement.id === 'productCodeInput') {
            Swal.fire({
                icon: 'success',
                title: 'RFID 掃描成功',
                text: `商品代號已設定為: ${scannedValue}`,
            });
        }

        // 清空輸入框以便接受下一個掃描
        event.target.value = '';
    }
});
