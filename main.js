// main.js - Enhanced Production Version with Security
"use strict";

// =================================================================
// CONFIGURATION & GLOBAL VARIABLES
// =================================================================

const CONFIG = {
    API_BASE_URL: 'https://shop-4mlk.onrender.com/api/v1',
    AUTHORIZED_EMAILS: [
        'chinhan20917976549a@gmail.com',
        'ryantran149@gmail.com', 
        'seller@shopgrowgarden.com',
        'greensvn@gmail.com'
    ],
    STORAGE_KEYS: {
        TOKEN: 'gag_token',
        USER: 'gag_user',
        PRODUCTS: 'gag_products'
    },
    TOAST_DURATION: 3000,
    ANIMATION_DELAY: 0.08,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    PRODUCT_VALIDATION: {
        TITLE_MIN: 5,
        TITLE_MAX: 100,
        DESC_MIN: 10,
        DESC_MAX: 500,
        PRICE_MIN: 1000,
        PRICE_MAX: 50000000
    }
};

let currentUser = null;
let allProducts = [];

// =================================================================
// SECURITY & VALIDATION UTILITIES
// =================================================================

class SecurityManager {
    static obfuscateConsole() {
        if (typeof window !== 'undefined') {
            const methods = ['log', 'warn', 'error', 'info', 'debug'];
            methods.forEach(method => {
                const original = console[method];
                console[method] = function(...args) {
                    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                        return;
                    }
                    original.apply(console, args);
                };
            });
        }
    }

    static validateImageFile(file) {
        if (!file) throw new Error('Vui lòng chọn file hình ảnh!');
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw new Error('Chỉ hỗ trợ file JPG, PNG, WEBP!');
        }
        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            throw new Error('Kích thước file không được vượt quá 5MB!');
        }
        return true;
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
            .trim();
    }

    static validateProduct(data) {
        const errors = [];
        const { TITLE_MIN, TITLE_MAX, DESC_MIN, DESC_MAX, PRICE_MIN, PRICE_MAX } = CONFIG.PRODUCT_VALIDATION;

        if (!data.title || data.title.length < TITLE_MIN || data.title.length > TITLE_MAX) {
            errors.push(`Tên sản phẩm phải từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự`);
        }

        if (!data.description || data.description.length < DESC_MIN || data.description.length > DESC_MAX) {
            errors.push(`Mô tả phải từ ${DESC_MIN} đến ${DESC_MAX} ký tự`);
        }

        const price = parseInt(data.price);
        if (isNaN(price) || price < PRICE_MIN || price > PRICE_MAX) {
            errors.push(`Giá phải từ ${Utils.formatPrice(PRICE_MIN)} đến ${Utils.formatPrice(PRICE_MAX)}`);
        }

        if (!Utils.validateURL(data.image)) {
            errors.push('URL hình ảnh không hợp lệ');
        }

        if (!Utils.validateURL(data.link)) {
            errors.push('Link sản phẩm không hợp lệ');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        return true;
    }
}

// =================================================================
// ENHANCED UTILITY CLASS
// =================================================================

class Utils {
    static formatPrice(price) {
        const num = typeof price === 'string' ? parseInt(price, 10) : price;
        if (isNaN(num)) return '0đ';
        return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
    }

    static formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    }

    static generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    static validateURL(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
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
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '10003',
                pointerEvents: 'none'
            });
            document.body.appendChild(container);
        }
        return container;
    }

    static createToastElement(message, type) {
        const toast = document.createElement('div');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas ${icons[type] || icons.info}" style="margin-right: 8px;"></i>
                <span style="white-space: pre-line;">${message}</span>
            </div>
            <button class="toast-close" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: 10px; pointer-events: auto;">×</button>
        `;

        Object.assign(toast.style, {
            background: colors[type] || colors.info,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '300px',
            maxWidth: '400px',
            zIndex: '9999',
            pointerEvents: 'auto'
        });

        return toast;
    }

    static animateToast(toast, duration) {
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        const closeToast = () => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        };

        const timer = setTimeout(closeToast, duration);
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            closeToast();
        });
    }
    
    static showLoading(element, message = 'Đang tải...') {
        if (element) {
            element.innerHTML = `
                <div class="loading-placeholder" style="text-align: center; padding: 50px; color: #888; grid-column: 1 / -1;">
                    <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom: 1rem;"></i>
                    <p style="margin-top: 10px; font-size: 1.1rem;">${message}</p>
                </div>
            `;
        }
    }

    static showError(element, message = 'Có lỗi xảy ra.') {
        if (element) {
            element.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 50px; color: #ef4444; grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 1rem;"></i>
                    <p style="margin-top: 10px; font-size: 1.1rem;">${message}</p>
                </div>
            `;
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// =================================================================
// ENHANCED STORAGE MANAGER
// =================================================================

// XÓA TOÀN BỘ StorageManager và các hàm liên quan

// =================================================================
// PERMISSION MANAGER
// =================================================================

class PermissionManager {
    static checkPostPermission() {
        if (!currentUser?.email) return false;
        const userEmail = currentUser.email.toLowerCase().trim();
        return CONFIG.AUTHORIZED_EMAILS.map(email => email.toLowerCase()).includes(userEmail);
    }

    static checkDeletePermission(product) {
        if (!currentUser) return false;
        if (this.checkPostPermission()) return true;
        return product.createdBy === currentUser._id;
    }

    static checkAdminPermission() {
        return this.checkPostPermission();
    }
}

// =================================================================
// ENHANCED API MANAGER
// =================================================================

class ApiManager {
    static async call(endpoint, method = 'GET', body = null, requireAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        
        if (token && requireAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            if (response.status === 204) return { success: true };
            
            const data = await response.json();
            
            if (response.status === 401 && !requireAuth) {
                return { data: { products: [], favorites: [], cart: [] } };
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Server error occurred');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async createProduct(productData) {
        return await this.call('/products', 'POST', productData);
    }

    static async updateProduct(productId, productData) {
        return await this.call(`/products/${productId}`, 'PATCH', productData);
    }

    static async deleteProduct(productId) {
        return await this.call(`/products/${productId}`, 'DELETE');
    }

    static async getProducts() {
        const hasToken = !!localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        return await this.call('/products', 'GET', null, hasToken);
    }
}

// =================================================================
// ENHANCED FLOATING BUTTONS MANAGER
// =================================================================

class FloatingButtonsManager {
    static init() {
        this.addStyles();
        this.create();
    }

    static addStyles() {
        if (document.getElementById('floatingButtonStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'floatingButtonStyles';
        styles.textContent = `
            .floating-btn {
                display: flex !important;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem 1.5rem;
                border-radius: 50px;
                font-weight: 600;
                text-decoration: none;
                border: none;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                font-family: inherit;
                font-size: 14px;
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
                white-space: nowrap;
                user-select: none;
            }
            .floating-btn:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
            }
            .floating-btn:active {
                transform: translateY(-1px) scale(1.02);
            }
            .messenger-btn {
                background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%) !important;
                color: #fff !important;
            }
            .post-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: #fff !important;
            }
            #floatingButtonsContainer {
                position: fixed !important;
                bottom: 2rem !important;
                right: 2rem !important;
                z-index: 1000 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 1rem !important;
            }
            @media (max-width: 768px) {
                #floatingButtonsContainer {
                    bottom: 1rem !important;
                    right: 1rem !important;
                }
                .floating-btn {
                    padding: 0.8rem 1.2rem;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    static create() {
        const existingContainer = document.getElementById('floatingButtonsContainer');
        if (existingContainer) existingContainer.remove();
        
        const container = document.createElement('div');
        container.id = 'floatingButtonsContainer';
        
        container.appendChild(this.createMessengerButton());
        
        if (PermissionManager.checkPostPermission()) {
            container.appendChild(this.createPostButton());
        }
        
        document.body.appendChild(container);
    }

    static createMessengerButton() {
        const btn = document.createElement('a');
        btn.href = 'https://m.me/100063758577070';
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.className = 'floating-btn messenger-btn';
        btn.innerHTML = `<i class="fab fa-facebook-messenger"></i><span>Liên hệ</span>`;
        btn.title = 'Liên hệ qua Facebook Messenger';
        return btn;
    }

    static createPostButton() {
        const btn = document.createElement('button');
        btn.className = 'floating-btn post-btn';
        btn.innerHTML = `<i class="fas fa-plus"></i><span>Đăng tin</span>`;
        btn.title = 'Đăng sản phẩm mới';
        
        btn.addEventListener('click', () => {
            if (window.ProductModal?.show) {
                window.ProductModal.show();
            } else {
                Utils.showToast('Chức năng chưa sẵn sàng!', 'error');
            }
        });
        
        return btn;
    }

    static update() {
        setTimeout(() => this.create(), 100);
    }
}

// =================================================================
// CART & FAVORITES MANAGERS
// =================================================================

// =================================================================
// CART MANAGER
// =================================================================

const CartManager = {
    async get() {
        if (!currentUser) return [];
        try {
            const result = await ApiManager.call('/cart');
            return result.data.cart || [];
        } catch {
            return [];
        }
    },

    async add(productId, quantity = 1) {
        if (!currentUser) throw new Error('Vui lòng đăng nhập!');
        await ApiManager.call('/cart', 'POST', { productId, quantity });
        await this.updateCount();
    },

    async updateCount() {
        if (!currentUser) return;
        const cart = await this.get();
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    }
};

// =================================================================
// FAVORITE MANAGER
// =================================================================

const FavoriteManager = {
    async get() {
        if (!currentUser) return [];
        try {
            const result = await ApiManager.call('/favorites');
            return result.data.favorites || [];
        } catch {
            return [];
        }
    },

    async add(productId) {
        if (!currentUser) throw new Error('Vui lòng đăng nhập!');
        await ApiManager.call('/favorites', 'POST', { productId });
        await this.updateStatus(productId, true);
    },

    async remove(productId) {
        if (!currentUser) return;
        await ApiManager.call(`/favorites/${productId}`, 'DELETE');
        await this.updateStatus(productId, false);
    },

    async updateStatus(productId, isFavorite) {
        document.querySelectorAll(`.btn-favorite[data-id="${productId}"]`).forEach(btn => {
            btn.classList.toggle('active', isFavorite);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            }
        });
    }
};

// =================================================================
// ENHANCED AUTHENTICATION MANAGER
// =================================================================

class AuthManager {
    static async login(email, password) {
        const data = await ApiManager.call('/users/login', 'POST', { email, password });
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
        
        currentUser = {
            ...data.data.user,
            email: data.data.user.email || email
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
        await AuthManager.updateUIAfterLogin();
        return currentUser;
    }

    static async register(name, email, password, passwordConfirm) {
        const data = await ApiManager.call('/users/signup', 'POST', {
            name, email, password, passwordConfirm
        });
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
        
        currentUser = {
            ...data.data.user,
            name: data.data.user.name || name,
            email: data.data.user.email || email
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
        await AuthManager.updateUIAfterLogin();
        return currentUser;
    }

    static logout() {
        if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
        
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        currentUser = null;
        
        AuthManager.updateUIAfterLogout();
        Utils.showToast('Đăng xuất thành công!', 'success');
        
        const protectedPages = ['account.html', 'cart.html', 'favorite.html'];
        if (protectedPages.some(page => window.location.pathname.includes(page))) {
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    static async checkAutoLogin() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        
        if (token) {
            try {
                const data = await ApiManager.call('/users/me');
                currentUser = data.data.user;
                
                if (!currentUser.email) throw new Error('Invalid user data');
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
                await AuthManager.updateUIAfterLogin();
            } catch (error) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
                currentUser = null;
                AuthManager.updateUIAfterLogout();
            }
        } else {
            AuthManager.updateUIAfterLogout();
        }
    }

    static getDisplayName(user) {
        if (!user) return 'User';
        if (user.name?.trim()) return user.name.trim();
        if (user.email?.includes('@')) return user.email.split('@')[0];
        return 'User';
    }

    static async updateUIAfterLogin() {
        if (!currentUser) return;
        
        const loginButton = document.getElementById('loginButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (loginButton) loginButton.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'flex';
        
        const displayName = AuthManager.getDisplayName(currentUser);
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        document.querySelectorAll('.user-name, #userName').forEach(el => {
            if (el) el.textContent = displayName;
        });
        
        document.querySelectorAll('.user-avatar, #userAvatar').forEach(el => {
            if (el) el.textContent = firstLetter;
        });
        
        await CartManager.updateCount();
        FloatingButtonsManager.update();
        updateDevToolsProtection(); // Call the new function here
    }

    static updateUIAfterLogout() {
        const loginButton = document.getElementById('loginButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (loginButton) loginButton.style.display = 'flex';
        if (userDropdown) userDropdown.style.display = 'none';
        
        document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
            el.textContent = '0';
            el.style.display = 'none';
        });
        
        FloatingButtonsManager.update();
    }
}

// =================================================================
// ENHANCED PRODUCT MANAGER
// =================================================================

class ProductManager {
    static async loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        Utils.showLoading(productsGrid, 'Đang tải sản phẩm...');
        
        try {
            const data = await ApiManager.getProducts();
            let products = data.data?.products || [];
            
            allProducts = products;
            
            if (window.renderApiProducts) {
                window.renderApiProducts(allProducts);
            }
            
            if (currentUser && window.updateAllFavoriteButtons) {
                await window.updateAllFavoriteButtons();
            }
        } catch (error) {
            productsGrid.innerHTML = `
                    <div class="auth-required-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                        <i class="fas fa-lock" style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;"></i>
                        <h3 style="color: #1f2937; margin-bottom: 1rem;">Cần đăng nhập để xem sản phẩm</h3>
                        <p style="color: #64748b; margin-bottom: 2rem;">Vui lòng đăng nhập để truy cập danh sách sản phẩm</p>
                        <button class="btn btn-primary" onclick="document.getElementById('loginButton').click()">
                            <i class="fas fa-user"></i> <span>Đăng nhập ngay</span>
                        </button>
                    </div>
                `;
        }
    }

    static async createProduct(productData) {
        SecurityManager.validateProduct(productData);
        
        const product = {
            _id: Utils.generateId(),
            title: SecurityManager.sanitizeInput(productData.title),
            description: SecurityManager.sanitizeInput(productData.description),
            price: parseInt(productData.price),
            images: [productData.image],
            badge: productData.badge || null,
            sales: parseInt(productData.sales) || 0,
            stock: parseInt(productData.stock) || 999,
            category: productData.category || 'custom',
            link: productData.link,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?._id
        };

        try {
            const apiData = { ...product };
            delete apiData._id;
            
            await ApiManager.createProduct(apiData);
            Utils.showToast('Đăng sản phẩm thành công!', 'success');
            await ProductManager.loadProducts();
            return true;
        } catch (error) {
            Utils.showToast(error.message || 'Không thể lưu sản phẩm', 'error');
        }
        
        throw new Error('Không thể lưu sản phẩm');
    }

    static async deleteProduct(productId) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        
        try {
            if (productId.startsWith('local_')) {
                // StorageManager.deleteProduct(productId); // XÓA
            } else {
                await ApiManager.deleteProduct(productId);
            }
            
            allProducts = allProducts.filter(p => p._id !== productId);
            
            if (window.renderApiProducts) {
                window.renderApiProducts(allProducts);
            }

            Utils.showToast('Xóa sản phẩm thành công!', 'success');
        } catch (error) {
            Utils.showToast(error.message || 'Không thể xóa sản phẩm!', 'error');
        }
    }

    static async updateProduct(productId, updates) {
        try {
            SecurityManager.validateProduct(updates);
            
            if (productId.startsWith('local_')) {
                // StorageManager.updateProduct(productId, updates); // XÓA
            } else {
                await ApiManager.updateProduct(productId, updates);
            }
            
            const index = allProducts.findIndex(p => p._id === productId);
            if (index !== -1) {
                allProducts[index] = { ...allProducts[index], ...updates };
            }
            
            if (window.renderApiProducts) {
                window.renderApiProducts(allProducts);
            }
            
            Utils.showToast('Cập nhật sản phẩm thành công!', 'success');
            return true;
        } catch (error) {
            Utils.showToast(error.message || 'Không thể cập nhật sản phẩm!', 'error');
            return false;
        }
    }
}

// =================================================================
// ENHANCED MODAL MANAGER
// =================================================================

class ModalManager {
    static initAuthModal() {
        const authModal = document.getElementById('authModal');
        const loginButton = document.getElementById('loginButton');
        
        if (!authModal || !loginButton) return;
        
        const showModal = () => {
            authModal.style.display = 'flex';
            setTimeout(() => authModal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        };
        
        const hideModal = () => {
            authModal.classList.remove('show');
            setTimeout(() => {
                authModal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        };
        
        loginButton.addEventListener('click', showModal);
        
        authModal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', hideModal);
        });
        
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) hideModal();
        });
        
        this.setupAuthTabs(authModal);
        this.setupAuthForms(authModal, hideModal);
    }

    static setupAuthTabs(authModal) {
        const tabs = authModal.querySelectorAll('.modal-tab');
        const forms = authModal.querySelectorAll('.modal-form');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                forms.forEach(f => {
                    f.classList.toggle('active', f.id === `${tab.dataset.tab}Form`);
                });
            });
        });
        
        authModal.querySelectorAll('.switch-to-register, .switch-to-login').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = e.target.classList.contains('switch-to-register') ? 'register' : 'login';
                authModal.querySelector(`.modal-tab[data-tab="${targetTab}"]`)?.click();
            });
        });
    }

    static setupAuthForms(authModal, hideModal) {
        this.setupLoginForm(authModal.querySelector('#loginForm'), hideModal);
        this.setupRegisterForm(authModal.querySelector('#registerForm'), hideModal);
    }

    static setupLoginForm(form, onSuccess) {
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.btn-submit');
            const spinner = submitBtn.querySelector('.spinner');
            
            this.setLoadingState(submitBtn, spinner, true);
            
            try {
                const email = form.email.value.trim();
                const password = form.password.value;
                const rememberMe = form.rememberMe.checked; // Get rememberMe value
                
                if (!email || !password) {
                    throw new Error('Vui lòng nhập đủ thông tin!');
                }
                
                const user = await AuthManager.login(email, password, rememberMe); // Pass rememberMe
                Utils.showToast(`Chào mừng ${AuthManager.getDisplayName(user)}!`, 'success');
                
                onSuccess();
                form.reset();
                
                setTimeout(() => ProductManager.loadProducts(), 500);
            } catch (error) {
                Utils.showToast(error.message || 'Đăng nhập thất bại!', 'error');
            } finally {
                this.setLoadingState(submitBtn, spinner, false);
            }
        });
    }

    static setupRegisterForm(form, onSuccess) {
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.btn-submit');
            const spinner = submitBtn.querySelector('.spinner');
            
            this.setLoadingState(submitBtn, spinner, true);
            
            try {
                const name = form.name.value.trim();
                const email = form.email.value.trim();
                const password = form.password.value;
                const confirmPassword = form.confirmPassword.value;
                
                if (!name || !email || !password || !confirmPassword) {
                    throw new Error('Vui lòng nhập đủ thông tin!');
                }
                
                if (password.length < 6) {
                    throw new Error('Mật khẩu ít nhất 6 ký tự!');
                }
                
                if (password !== confirmPassword) {
                    throw new Error('Mật khẩu không khớp!');
                }
                
                const user = await AuthManager.register(name, email, password, confirmPassword);
                Utils.showToast(`Chào mừng ${AuthManager.getDisplayName(user)}!`, 'success');
                
                onSuccess();
                form.reset();
                
                setTimeout(() => ProductManager.loadProducts(), 500);
            } catch (error) {
                Utils.showToast(error.message || 'Đăng ký thất bại!', 'error');
            } finally {
                this.setLoadingState(submitBtn, spinner, false);
            }
        });
    }

    static setLoadingState(submitBtn, spinner, isLoading) {
        if (isLoading) {
            submitBtn.classList.add('loading');
            if (spinner) spinner.style.display = 'inline-block';
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            if (spinner) spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }
}

// =================================================================
// IMAGE UPLOAD HANDLER
// =================================================================

class ImageUploadHandler {
    static async uploadToImgBB(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data.data.url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            throw new Error('Không thể upload hình ảnh!');
        }
    }

    static createImagePreview(file, container) {
        const reader = new FileReader();
        reader.onload = (e) => {
            container.innerHTML = `
                <div style="text-align: center; margin: 1rem 0;">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Preview</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// =================================================================
// APPLICATION INITIALIZATION
// =================================================================

class App {
    static async init() {
        // Initialize security
        SecurityManager.obfuscateConsole();
        
        // Initialize UI components
        Utils.getToastContainer();
        ModalManager.initAuthModal();
        
        // Setup logout handlers
        document.querySelectorAll('#logoutButton, #sidebarLogoutBtn').forEach(btn => {
            if (btn) btn.addEventListener('click', AuthManager.logout);
        });
        
        // Check authentication
        await AuthManager.checkAutoLogin();
        
        // Initialize current page
        await App.initCurrentPage();
        
        // Initialize floating buttons
        setTimeout(() => FloatingButtonsManager.init(), 500);
        
        // Setup global error handling
        window.addEventListener('error', App.handleGlobalError);
        window.addEventListener('unhandledrejection', App.handleGlobalError);
    }

    static async initCurrentPage() {
        const path = window.location.pathname.split("/").pop() || 'index.html';
        
        switch (path) {
            case 'index.html':
            case '':
                await App.initIndexPage();
                break;
            case 'account.html':
                await App.initAccountPage();
                break;
            case 'cart.html':
                await App.initCartPage();
                break;
            case 'favorite.html':
                await App.initFavoritePage();
                break;
        }
    }

    static async initIndexPage() {
        await ProductManager.loadProducts();
        
        const filterButton = document.getElementById('filterButton');
        const resetButton = document.getElementById('resetButton');
        
        if (filterButton) {
            filterButton.addEventListener('click', Utils.debounce(() => {
                window.filterProducts?.();
            }, 300));
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => window.resetFilters?.());
        }
    }

    static async initAccountPage() {
        if (!currentUser) {
            Utils.showToast('Vui lòng đăng nhập để truy cập trang này!', 'warning');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    static async initCartPage() {
        if (!currentUser) {
            Utils.showToast('Vui lòng đăng nhập để truy cập giỏ hàng!', 'warning');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    static async initFavoritePage() {
        if (!currentUser) {
            Utils.showToast('Vui lòng đăng nhập để xem danh sách yêu thích!', 'warning');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    static handleGlobalError(event) {
        const error = event.error || event.reason;
        if (error && error.message && !error.message.includes('Script error')) {
            Utils.showToast('Đã xảy ra lỗi. Vui lòng thử lại!', 'error');
        }
    }
}

// =================================================================
// GLOBAL EXPORTS AND CLEANUP
// =================================================================

// Export essential classes and functions to window
window.Utils = Utils;
window.CartManager = CartManager;
window.FavoriteManager = FavoriteManager;
window.PermissionManager = PermissionManager;
window.ProductManager = ProductManager;
// window.StorageManager = StorageManager; // XÓA
window.ApiManager = ApiManager;
window.SecurityManager = SecurityManager;
window.ImageUploadHandler = ImageUploadHandler;

// Export update function for favorites
window.updateAllFavoriteButtons = async () => {
    if (!currentUser) return;
    try {
        const favorites = await FavoriteManager.get();
        favorites.forEach(fav => FavoriteManager.updateStatus(fav.productId, true));
    } catch (error) {
        // Silent fail for favorites update
    }
};

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    // Clear sensitive data if needed
    if (!currentUser) {
        // StorageManager.clearAll(); // XÓA
    }
});

// 1. Chặn DevTools cho non-admin
let _devToolsKeydownHandler = null;
let _devToolsContextMenuHandler = null;

function isAdminEmail(email) {
    return CONFIG.AUTHORIZED_EMAILS.includes(email);
}

function setupDevToolsProtection() {
    // Remove old listeners if exist
    if (_devToolsKeydownHandler) document.removeEventListener('keydown', _devToolsKeydownHandler);
    if (_devToolsContextMenuHandler) document.removeEventListener('contextmenu', _devToolsContextMenuHandler);

    _devToolsKeydownHandler = function(e) {
        if (!window.currentUser || !isAdminEmail(window.currentUser.email)) {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                Utils.showToast('Chức năng này đã bị vô hiệu hóa!', 'warning');
                return false;
            }
        }
    };
    _devToolsContextMenuHandler = function(e) {
        if (!window.currentUser || !isAdminEmail(window.currentUser.email)) {
            e.preventDefault();
            Utils.showToast('Chuột phải đã bị vô hiệu hóa!', 'warning');
            return false;
        }
    };
    document.addEventListener('keydown', _devToolsKeydownHandler);
    document.addEventListener('contextmenu', _devToolsContextMenuHandler);
}

function updateDevToolsProtection() {
    setupDevToolsProtection();
}

// 4. Remember Me khi đăng nhập
// Trong AuthManager.login:
// Thêm tham số rememberMe, nếu true thì lưu token vào localStorage, nếu false thì lưu vào sessionStorage
// Trong ModalManager.setupAuthForms, truyền giá trị rememberMe từ form đăng nhập vào AuthManager.login
// 5. Không tự động đăng xuất trừ khi token hết hạn hoặc user logout

// =================================================================
// APPLICATION START
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(error => {
        Utils.showToast('Không thể khởi tạo ứng dụng!', 'error');
    });
});
