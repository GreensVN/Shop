// main.js - Final Production Version
"use strict";

// =================================================================
// CONFIGURATION & GLOBAL VARIABLES
// =================================================================

const CONFIG = {
    API_BASE_URL: 'https://shop-4mlk.onrender.com/api/v1',
    AUTHORIZED_EMAILS: [
        'chinhan20917976549a@gmail.com',
        'manager@shopgrowgarden.com', 
        'seller@shopgrowgarden.com',
        'greensvn@gmail.com'
    ],
    STORAGE_KEYS: {
        TOKEN: 'token',
        USER: 'currentUser',
        PRODUCTS: 'localProducts'
    },
    TOAST_DURATION: 3000,
    ANIMATION_DELAY: 0.08
};

let currentUser = null;
let allProducts = [];

// =================================================================
// UTILITY CLASS
// =================================================================

class Utils {
    static formatPrice(price) {
        const num = typeof price === 'string' ? parseInt(price, 10) : price;
        if (isNaN(num)) return '0đ';
        return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
    }

    static formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('vi-VN');
        } catch {
            return 'N/A';
        }
    }

    static generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static showToast(message, type = 'success', duration = CONFIG.TOAST_DURATION) {
        const container = this.getToastContainer();
        const toast = this.createToastElement(message, type);
        
        container.appendChild(toast);
        this.animateToast(toast, duration);
    }

    static getToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            Object.assign(container.style, {
                position: 'fixed', top: '20px', right: '20px', zIndex: '10003'
            });
            document.body.appendChild(container);
        }
        return container;
    }

    static createToastElement(message, type) {
        const toast = document.createElement('div');
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
        toast.innerHTML = `<div style="display: flex; align-items: center;"><i class="fas ${icons[type] || icons.info}" style="margin-right: 8px;"></i><span>${message}</span></div><button class="toast-close" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: 10px;">×</button>`;
        Object.assign(toast.style, { background: colors[type] || colors.info, color: 'white', padding: '12px 20px', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'translateX(100%)', opacity: '0', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '300px', zIndex: '9999' });
        return toast;
    }

    static animateToast(toast, duration) {
        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; toast.style.opacity = '1'; });
        const closeToast = () => { toast.style.transform = 'translateX(100%)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); };
        const timer = setTimeout(closeToast, duration);
        toast.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(timer); closeToast(); });
    }
    
    static showLoading(element, message = 'Đang tải...') {
        if (element) element.innerHTML = `<div class="loading-placeholder" style="text-align: center; padding: 50px; color: #888; grid-column: 1 / -1;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">${message}</p></div>`;
    }

    static showError(element, message = 'Có lỗi xảy ra.') {
        if (element) element.innerHTML = `<div class="error-state" style="text-align: center; padding: 50px; color: #ef4444; grid-column: 1 / -1;"><i class="fas fa-exclamation-triangle fa-2x"></i><p style="margin-top: 10px;">${message}</p></div>`;
    }

    static sanitizeInput(input) { return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, ''); }
    static validateURL(url) { try { new URL(url); return true; } catch { return false; } }
}

// =================================================================
// STORAGE MANAGER
// =================================================================

class StorageManager {
    static saveProducts(products) { try { localStorage.setItem(CONFIG.STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); return true; } catch (error) { return false; } }
    static loadProducts() { try { const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.PRODUCTS); return stored ? JSON.parse(stored) : []; } catch { return []; } }
    static addProduct(product) { const products = this.loadProducts(); products.unshift(product); return this.saveProducts(products); }
    static deleteProduct(productId) { const products = this.loadProducts(); const filtered = products.filter(p => p._id !== productId); return this.saveProducts(filtered); }
    static updateProduct(productId, updates) {
        const products = this.loadProducts(); const index = products.findIndex(p => p._id === productId);
        if (index !== -1) { products[index] = { ...products[index], ...updates }; return this.saveProducts(products); }
        return false;
    }
}

// =================================================================
// PERMISSION MANAGER
// =================================================================

class PermissionManager {
    static checkPostPermission() { if (!currentUser?.email) return false; const userEmail = currentUser.email.toLowerCase().trim(); return CONFIG.AUTHORIZED_EMAILS.map(email => email.toLowerCase()).includes(userEmail); }
    static checkDeletePermission(product) { if (!currentUser) return false; if (this.checkPostPermission()) return true; return product.createdBy === currentUser._id; }
}

// =================================================================
// API MANAGER
// =================================================================

class ApiManager {
    static async call(endpoint, method = 'GET', body = null, requireAuth = true) {
        const headers = { 'Content-Type': 'application/json' }; const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        if (token && requireAuth) { headers['Authorization'] = `Bearer ${token}`; }
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
            if (response.status === 204) return { success: true };
            const data = await response.json();
            if (response.status === 401 && !requireAuth) return { data: { products: [], favorites: [], cart: [] } };
            if (!response.ok) throw new Error(data.message || 'Server error occurred');
            return data;
        } catch (error) { throw error; }
    }
    static async createProduct(productData) { return await this.call('/products', 'POST', productData); }
    static async updateProduct(productId, productData) { return await this.call(`/products/${productId}`, 'PATCH', productData); }
    static async deleteProduct(productId) { return await this.call(`/products/${productId}`, 'DELETE'); }
    static async getProducts() { const hasToken = !!localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN); return await this.call('/products', 'GET', null, hasToken); }
}

// =================================================================
// FLOATING BUTTONS MANAGER
// =================================================================

class FloatingButtonsManager {
    static init() { this.addStyles(); this.create(); }
    static addStyles() {
        if (document.getElementById('floatingButtonStyles')) return;
        const styles = document.createElement('style'); styles.id = 'floatingButtonStyles';
        styles.textContent = `.floating-btn{display:flex!important;align-items:center;gap:.5rem;padding:1rem 1.5rem;border-radius:50px;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 25px rgba(0,0,0,.15);font-family:inherit;font-size:14px;backdrop-filter:blur(10px);position:relative;overflow:hidden;white-space:nowrap}.floating-btn:hover{transform:translateY(-3px) scale(1.05)}.messenger-btn{background:linear-gradient(135deg,#0084ff 0%,#0066cc 100%)!important;color:#fff!important}.post-btn{background:linear-gradient(135deg,#10b981 0%,#059669 100%)!important;color:#fff!important}#floatingButtonsContainer{position:fixed!important;bottom:2rem!important;right:2rem!important;z-index:1000!important;display:flex!important;flex-direction:column!important;gap:1rem!important}@media (max-width:768px){#floatingButtonsContainer{bottom:1rem!important;right:1rem!important}}`;
        document.head.appendChild(styles);
    }
    static create() {
        const existingContainer = document.getElementById('floatingButtonsContainer'); if (existingContainer) existingContainer.remove();
        const container = document.createElement('div'); container.id = 'floatingButtonsContainer';
        container.appendChild(this.createMessengerButton());
        if (PermissionManager.checkPostPermission()) { container.appendChild(this.createPostButton()); }
        document.body.appendChild(container);
    }
    static createMessengerButton() { const btn = document.createElement('a'); btn.href = 'https://m.me/100063758577070'; btn.target = '_blank'; btn.rel = 'noopener noreferrer'; btn.className = 'floating-btn messenger-btn'; btn.innerHTML = `<i class="fab fa-facebook-messenger"></i><span>Liên hệ</span>`; btn.title = 'Liên hệ qua Facebook Messenger'; return btn; }
    static createPostButton() {
        const btn = document.createElement('button'); btn.className = 'floating-btn post-btn'; btn.innerHTML = `<i class="fas fa-plus"></i><span>Đăng tin</span>`; btn.title = 'Đăng sản phẩm mới';
        btn.addEventListener('click', () => { if (window.ProductModal?.show) { window.ProductModal.show(); } else { Utils.showToast('Chức năng chưa sẵn sàng!', 'error'); } });
        return btn;
    }
    static update() { setTimeout(() => this.create(), 100); }
}

// =================================================================
// CART & FAVORITES MANAGERS
// =================================================================

const CartManager = {
    async get() { if (!currentUser) return []; try { const result = await ApiManager.call('/cart'); return result.data.cart || []; } catch { return []; } },
    async add(productId, quantity = 1) { if (!currentUser) throw new Error('Vui lòng đăng nhập!'); await ApiManager.call('/cart', 'POST', { productId, quantity }); await this.updateCount(); },
    async updateCount() { if (!currentUser) return; const cart = await this.get(); const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0); document.querySelectorAll('.cart-count, #cartCount').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'inline-flex' : 'none'; }); }
};
const FavoriteManager = {
    async get() { if (!currentUser) return []; try { const result = await ApiManager.call('/favorites'); return result.data.favorites || []; } catch { return []; } },
    async add(productId) { if (!currentUser) throw new Error('Vui lòng đăng nhập!'); await ApiManager.call('/favorites', 'POST', { productId }); await this.updateStatus(productId, true); },
    async remove(productId) { if (!currentUser) return; await ApiManager.call(`/favorites/${productId}`, 'DELETE'); await this.updateStatus(productId, false); },
    async updateStatus(productId, isFavorite) { document.querySelectorAll(`.favorite-btn[data-id="${productId}"]`).forEach(btn => { btn.classList.toggle('active', isFavorite); const icon = btn.querySelector('i'); if (icon) icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart'; }); }
};

// =================================================================
// AUTHENTICATION MANAGER
// =================================================================

class AuthManager {
    static async login(email, password) { const data = await ApiManager.call('/users/login', 'POST', { email, password }); localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token); currentUser = { ...data.data.user, email: data.data.user.email || email }; localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser)); await AuthManager.updateUIAfterLogin(); return currentUser; }
    static async register(name, email, password, passwordConfirm) { const data = await ApiManager.call('/users/signup', 'POST', { name, email, password, passwordConfirm }); localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token); currentUser = { ...data.data.user, name: data.data.user.name || name, email: data.data.user.email || email }; localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser)); await AuthManager.updateUIAfterLogin(); return currentUser; }
    static logout() {
        if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN); localStorage.removeItem(CONFIG.STORAGE_KEYS.USER); currentUser = null;
        AuthManager.updateUIAfterLogout(); Utils.showToast('Đăng xuất thành công!', 'success');
        const protectedPages = ['account.html', 'cart.html', 'favorite.html']; if (protectedPages.some(page => window.location.pathname.includes(page))) { setTimeout(() => window.location.href = 'index.html', 1000); }
    }
    static async checkAutoLogin() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        if (token) {
            try {
                const data = await ApiManager.call('/users/me'); currentUser = data.data.user;
                if (!currentUser.email) throw new Error('Invalid user data');
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
                await AuthManager.updateUIAfterLogin();
            } catch (error) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN); localStorage.removeItem(CONFIG.STORAGE_KEYS.USER); currentUser = null;
                AuthManager.updateUIAfterLogout();
            }
        } else { AuthManager.updateUIAfterLogout(); }
    }
    static getDisplayName(user) { if (!user) return 'User'; if (user.name?.trim()) return user.name.trim(); if (user.email?.includes('@')) return user.email.split('@')[0]; return 'User'; }
    static async updateUIAfterLogin() {
        if (!currentUser) return;
        const loginButton = document.getElementById('loginButton'); const userDropdown = document.getElementById('userDropdown');
        if (loginButton) loginButton.style.display = 'none'; if (userDropdown) userDropdown.style.display = 'flex';
        const displayName = AuthManager.getDisplayName(currentUser); const firstLetter = displayName.charAt(0).toUpperCase();
        document.querySelectorAll('.user-name, #userName').forEach(el => { if (el) el.textContent = displayName; });
        document.querySelectorAll('.user-avatar, #userAvatar').forEach(el => { if (el) el.textContent = firstLetter; });
        await CartManager.updateCount(); FloatingButtonsManager.update();
    }
    static updateUIAfterLogout() {
        const loginButton = document.getElementById('loginButton'); const userDropdown = document.getElementById('userDropdown');
        if (loginButton) loginButton.style.display = 'flex'; if (userDropdown) userDropdown.style.display = 'none';
        document.querySelectorAll('.cart-count, #cartCount').forEach(el => { el.textContent = '0'; el.style.display = 'none'; });
        FloatingButtonsManager.update();
    }
}

// =================================================================
// PRODUCT MANAGER
// =================================================================

class ProductManager {
    static async loadProducts() {
        const productsGrid = document.getElementById('productsGrid'); if (!productsGrid) return; Utils.showLoading(productsGrid, 'Đang tải sản phẩm...');
        try {
            const data = await ApiManager.getProducts(); let products = data.data?.products || [];
            const localProducts = StorageManager.loadProducts();
            const combinedProducts = [...localProducts, ...products];
            allProducts = Array.from(new Map(combinedProducts.map(p => [p._id, p])).values());
            if (window.renderApiProducts) { window.renderApiProducts(allProducts); }
            if (currentUser && window.updateAllFavoriteButtons) { await window.updateAllFavoriteButtons(); }
        } catch (error) {
            const localProducts = StorageManager.loadProducts();
            if (localProducts.length > 0) { allProducts = localProducts; if (window.renderApiProducts) { window.renderApiProducts(localProducts); } Utils.showToast('Hiển thị sản phẩm offline.', 'warning'); } 
            else { productsGrid.innerHTML = `<div class="auth-required-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><i class="fas fa-lock" style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;"></i><h3 style="color: #1f2937; margin-bottom: 1rem;">Cần đăng nhập để xem sản phẩm</h3><p style="color: #64748b; margin-bottom: 2rem;">Vui lòng đăng nhập để truy cập danh sách sản phẩm</p><button class="btn btn-primary" onclick="document.getElementById('loginButton').click()"><i class="fas fa-user"></i> <span>Đăng nhập ngay</span></button></div>`; }
        }
    }
    static async createProduct(productData) {
        const product = { _id: Utils.generateId(), title: Utils.sanitizeInput(productData.title), description: Utils.sanitizeInput(productData.description), price: parseInt(productData.price), images: [productData.image], badge: productData.badge || null, sales: parseInt(productData.sales) || 0, stock: 999, category: 'custom', link: productData.link, createdAt: new Date().toISOString(), createdBy: currentUser?._id };
        try { const apiData = { ...product }; delete apiData._id; await ApiManager.createProduct(apiData); Utils.showToast('Đăng sản phẩm thành công!', 'success'); await ProductManager.loadProducts(); return true; } 
        catch (error) { if (StorageManager.addProduct(product)) { allProducts.unshift(product); if (window.renderApiProducts) { window.renderApiProducts(allProducts); } Utils.showToast('Đăng sản phẩm thành công! (Lưu cục bộ)', 'info'); return true; } }
        throw new Error('Không thể lưu sản phẩm');
    }
    static async deleteProduct(productId) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        try { if (productId.startsWith('local_')) { StorageManager.deleteProduct(productId); } else { await ApiManager.deleteProduct(productId); } allProducts = allProducts.filter(p => p._id !== productId); if (window.renderApiProducts) { window.renderApiProducts(allProducts); } Utils.showToast('Xóa sản phẩm thành công!', 'success'); } 
        catch (error) { Utils.showToast(error.message || 'Không thể xóa sản phẩm!', 'error'); }
    }
}

// =================================================================
// MODAL MANAGER
// =================================================================

class ModalManager {
    static initAuthModal() {
        const authModal = document.getElementById('authModal'); const loginButton = document.getElementById('loginButton'); if (!authModal || !loginButton) return;
        const showModal = () => { authModal.style.display = 'flex'; setTimeout(() => authModal.classList.add('show'), 10); document.body.style.overflow = 'hidden'; };
        const hideModal = () => { authModal.classList.remove('show'); setTimeout(() => { authModal.style.display = 'none'; document.body.style.overflow = ''; }, 300); };
        loginButton.addEventListener('click', showModal); authModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', hideModal)); authModal.addEventListener('click', (e) => { if (e.target === authModal) hideModal(); });
        this.setupAuthTabs(authModal); this.setupAuthForms(authModal, hideModal);
    }
    static setupAuthTabs(authModal) {
        const tabs = authModal.querySelectorAll('.modal-tab'); const forms = authModal.querySelectorAll('.modal-form');
        tabs.forEach(tab => { tab.addEventListener('click', () => { tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); forms.forEach(f => f.classList.toggle('active', f.id === `${tab.dataset.tab}Form`)); }); });
        authModal.querySelectorAll('.switch-to-register, .switch-to-login').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const targetTab = e.target.classList.contains('switch-to-register') ? 'register' : 'login'; authModal.querySelector(`.modal-tab[data-tab="${targetTab}"]`)?.click(); }); });
    }
    static setupAuthForms(authModal, hideModal) { this.setupLoginForm(authModal.querySelector('#loginForm'), hideModal); this.setupRegisterForm(authModal.querySelector('#registerForm'), hideModal); }
    static setupLoginForm(form, onSuccess) {
        if (!form) return; form.addEventListener('submit', async (e) => {
            e.preventDefault(); const submitBtn = form.querySelector('.btn-submit'); const spinner = submitBtn.querySelector('.spinner'); this.setLoadingState(submitBtn, spinner, true);
            try { const email = form.email.value.trim(); const password = form.password.value; if (!email || !password) throw new Error('Vui lòng nhập đủ thông tin!'); const user = await AuthManager.login(email, password); Utils.showToast(`Chào mừng ${AuthManager.getDisplayName(user)}!`, 'success'); onSuccess(); form.reset(); setTimeout(() => ProductManager.loadProducts(), 500); } 
            catch (error) { Utils.showToast(error.message || 'Đăng nhập thất bại!', 'error'); } finally { this.setLoadingState(submitBtn, spinner, false); }
        });
    }
    static setupRegisterForm(form, onSuccess) {
        if (!form) return; form.addEventListener('submit', async (e) => {
            e.preventDefault(); const submitBtn = form.querySelector('.btn-submit'); const spinner = submitBtn.querySelector('.spinner'); this.setLoadingState(submitBtn, spinner, true);
            try { const name = form.name.value.trim(); const email = form.email.value.trim(); const password = form.password.value; const confirmPassword = form.confirmPassword.value; if (!name || !email || !password || !confirmPassword) throw new Error('Vui lòng nhập đủ thông tin!'); if (password.length < 6) throw new Error('Mật khẩu ít nhất 6 ký tự!'); if (password !== confirmPassword) throw new Error('Mật khẩu không khớp!'); const user = await AuthManager.register(name, email, password, confirmPassword); Utils.showToast(`Chào mừng ${AuthManager.getDisplayName(user)}!`, 'success'); onSuccess(); form.reset(); setTimeout(() => ProductManager.loadProducts(), 500); } 
            catch (error) { Utils.showToast(error.message || 'Đăng ký thất bại!', 'error'); } finally { this.setLoadingState(submitBtn, spinner, false); }
        });
    }
    static setLoadingState(submitBtn, spinner, isLoading) { if (isLoading) { submitBtn.classList.add('loading'); if (spinner) spinner.style.display = 'inline-block'; submitBtn.disabled = true; } else { submitBtn.classList.remove('loading'); if (spinner) spinner.style.display = 'none'; submitBtn.disabled = false; } }
}

// =================================================================
// INITIALIZATION
// =================================================================

class App {
    static async init() {
        Utils.getToastContainer();
        ModalManager.initAuthModal();
        document.querySelectorAll('#logoutButton, #sidebarLogoutBtn').forEach(btn => { if (btn) btn.addEventListener('click', AuthManager.logout); });
        await AuthManager.checkAutoLogin();
        // FIX: Call static methods on the class itself, not on `this`
        await App.initCurrentPage();
        setTimeout(() => FloatingButtonsManager.init(), 500);
    }
    static async initCurrentPage() {
        const path = window.location.pathname.split("/").pop() || 'index.html';
        switch (path) {
            case 'index.html': case '': await App.initIndexPage(); break;
            case 'account.html': await App.initAccountPage(); break;
            case 'cart.html': await App.initCartPage(); break;
            case 'favorite.html': await App.initFavoritePage(); break;
        }
    }
    static async initIndexPage() {
        await ProductManager.loadProducts();
        const filterButton = document.getElementById('filterButton'); const resetButton = document.getElementById('resetButton');
        if (filterButton) filterButton.addEventListener('click', () => window.filterProducts?.());
        if (resetButton) resetButton.addEventListener('click', () => window.resetFilters?.());
    }
    static async initAccountPage() { if (!currentUser) setTimeout(() => window.location.href = 'index.html', 1000); }
    static async initCartPage() { if (!currentUser) setTimeout(() => window.location.href = 'index.html', 1000); }
    static async initFavoritePage() { if (!currentUser) setTimeout(() => window.location.href = 'index.html', 1000); }
}

// =================================================================
// GLOBAL EXPORTS
// =================================================================

window.Utils = Utils; window.CartManager = CartManager; window.FavoriteManager = FavoriteManager;
window.PermissionManager = PermissionManager; window.ProductManager = ProductManager; window.StorageManager = StorageManager;
window.ApiManager = ApiManager;

window.updateAllFavoriteButtons = async () => {
    if (!currentUser) return; try { const favorites = await FavoriteManager.get(); favorites.forEach(fav => FavoriteManager.updateStatus(fav.productId, true)); } catch {}
};

// =================================================================
// APPLICATION START
// =================================================================

// FIX: Wrap the call in an arrow function to preserve context, or just call the static method directly.
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
