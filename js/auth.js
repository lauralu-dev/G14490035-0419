/**
 * 登入／登出邏輯（Firebase Auth 接上後實作）
 */
window.GreenMart = window.GreenMart || {};

GreenMart.auth = {
    /** @type {null | { uid: string, email: string | null }} */
    currentUser: null,

    /**
     * @param {(user: GreenMart.auth['currentUser']) => void} callback
     */
    onAuthStateChanged(callback) {
        GreenMart.firebaseReady.then(() => {
            callback(GreenMart.auth.currentUser);
        });
    },

    async signOut() {
        GreenMart.auth.currentUser = null;
        return Promise.resolve();
    },
};
