/**
 * Firebase 初始化（共用）
 * 於 Firebase 專案建立後，將設定貼上並取消註解下方程式碼。
 * 其他頁面請在 auth.js / 各功能腳本之後載入 firebase-app 與相容模組版本。
 */
window.GreenMart = window.GreenMart || {};

// 範例（請替換為專案實際設定）：
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
// const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "..." };
// GreenMart.firebaseApp = initializeApp(firebaseConfig);

GreenMart.firebaseReady = Promise.resolve(null);
