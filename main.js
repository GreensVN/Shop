// main.js - FIXED Authentication System
"use strict";

// =================================================================
// CONFIGURATION & GLOBAL VARIABLES
// =================================================================

const CONFIG = {
    API_BASE_URL: 'https://shop-4mlk.onrender.com/api/v1',
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
let isInitialized = false;

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
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(timer);
                closeToast();
            });
        }
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
// API MANAGER
// =================================================================

class ApiManager {
    static getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || 
               sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    static async call(endpoint, method = 'GET', body = null, requireAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        
        if (token && requireAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`🌐 API Call: ${method} ${CONFIG.API_BASE_URL}${endpoint}`);
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 204) return { success: true };
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (response.status === 401 && requireAuth) {
                console.log('🔒 Unauthorized - clearing auth data');
                this.clearAuthData();
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }
            
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static clearAuthData() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        currentUser = null;
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
        return await this.call('/products', 'GET', null, false);
    }
}

// =================================================================
// PERMISSION MANAGER (FIXED)
// =================================================================

class PermissionManager {
    static checkPostPermission() {
        console.log('🔍 Checking post permission...');
        
        if (!currentUser) {
            console.log('❌ No current user');
            return false;
        }
        
        const userRole = currentUser.role;
        console.log('User role:', userRole);
        
        if (!userRole) {
            console.log('❌ No user role found');
            return false;
        }
        
        const hasPermission = userRole === 'admin';
        console.log('Has admin permission:', hasPermission);
        
        return hasPermission;
    }

    static checkDeletePermission(product) {
        if (!currentUser) return false;
        
        // Admin có thể xóa tất cả
        if (this.checkPostPermission()) return true;
        
        // Người tạo có thể xóa sản phẩm của mình
        return product.createdBy === currentUser._id;
    }

    static checkAdminPermission() {
        return this.checkPostPermission();
    }

    static debugPermissions() {
        console.log('=== PERMISSION DEBUG ===');
        console.log('Current User:', currentUser);
        console.log('User Role:', currentUser?.role);
        console.log('Has Post Permission:', this.checkPostPermission());
        console.log('Is Admin:', currentUser?.role === 'admin');
        console.log('========================');
    }
}

// =================================================================
// AUTHENTICATION MANAGER (COMPLETELY FIXED) 🔥
// =================================================================

class AuthManager {
    static async login(email, password, rememberMe = true) {
        console.log('🔐 Attempting login for:', email);
        
        try {
            const data = await ApiManager.call('/users/login', 'POST', { email, password }, false);
            
            console.log('✅ Login successful, received data:', data);
            
            // Lưu token
            if (rememberMe) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
                sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
            } else {
                sessionStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
            }
            
            // Lưu thông tin user
            currentUser = {
                _id: data.data.user._id || data.data.user.id,
                name: data.data.user.name,
                email: data.data.user.email || email,
                role: data.data.user.role || 'user',
                ...data.data.user
            };
            
            console.log('👤 Setting currentUser with role:', currentUser);
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
            
            // Cập nhật UI
            await this.updateUIAfterLogin();
            
            return currentUser;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw new Error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        }
    }

    static async register(name, email, password, passwordConfirm) {
        console.log('📝 Attempting registration for:', email);
        
        try {
            const data = await ApiManager.call('/users/signup', 'POST', {
                name, email, password, passwordConfirm
            }, false);
            
            console.log('✅ Registration successful:', data);
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
            
            currentUser = {
                _id: data.data.user._id || data.data.user.id,
                name: data.data.user.name || name,
                email: data.data.user.email || email,
                role: data.data.user.role || 'user',
                ...data.data.user
            };
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
            await this.updateUIAfterLogin();
            
            return currentUser;
        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw new Error(error.message || 'Đăng ký thất bại. Vui lòng thử lại!');
        }
    }

    static logout() {
        if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
        
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        currentUser = null;
        
        this.updateUIAfterLogout();
        Utils.showToast('Đăng xuất thành công!', 'success');
        
        const protectedPages = ['account.html', 'cart.html', 'favorite.html'];
        if (protectedPages.some(page => window.location.pathname.includes(page))) {
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }

    static async checkAutoLogin() {
        console.log('🔍 Checking auto login...');
        
        let token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        if (!token) token = sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        
        if (token) {
            console.log('🎫 Found token, verifying...');
            try {
                const data = await ApiManager.call('/users/me');
                
                currentUser = {
                    _id: data.data.user._id || data.data.user.id,
                    name: data.data.user.name,
                    email: data.data.user.email,
                    role: data.data.user.role || 'user',
                    ...data.data.user
                };
                
                console.log('✅ Auto login successful with role:', currentUser);
                
                if (!currentUser.email) {
                    throw new Error('Invalid user data - no email');
                }
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
                await this.updateUIAfterLogin();
            } catch (error) {
                console.log('❌ Auto login failed:', error);
                ApiManager.clearAuthData();
                this.updateUIAfterLogout();
            }
        } else {
            console.log('📤 No token found');
            this.updateUIAfterLogout();
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
        
        console.log('🎨 Updating UI after login for:', currentUser);
        
        const loginButton = document.getElementById('loginButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (loginButton) loginButton.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'flex';
        
        const displayName = this.getDisplayName(currentUser);
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        document.querySelectorAll('.user-name, #userName').forEach(el => {
            if (el) el.textContent = displayName;
        });
        
        document.querySelectorAll('.user-avatar, #userAvatar').forEach(el => {
            if (el) el.textContent = firstLetter;
        });
        
        // Update global variable
        window.currentUser = currentUser;
        
        if (window.FloatingButtonsManager) {
            window.FloatingButtonsManager.update();
        }
    }

    static updateUIAfterLogout() {
        const loginButton = document.getElementById('loginButton');
        const userDropdown = document.getElementById('userDropdown');
        
        if (loginButton) loginButton.style.display = 'flex';
        if (userDropdown) userDropdown.style.display = 'none';
        
        // Clear global variable
        window.currentUser = null;
        
        if (window.FloatingButtonsManager) {
            window.FloatingButtonsManager.update();
        }
    }
}

// =================================================================
// UI CONTROLLER (FIXED MODAL SYSTEM) 🔥
// =================================================================

class UIController {
    static init() {
        console.log('🎨 Initializing UI Controller...');
        this.initAuthModal();
        this.initEventListeners();
        console.log('✅ UI Controller initialized');
    }

    static initAuthModal() {
        // Tìm modal có sẵn trong HTML
        const modal = document.getElementById('authModal');
        if (!modal) {
            console.error('❌ Auth modal not found in HTML');
            return;
        }

        console.log('✅ Found auth modal in HTML');

        // Setup modal event listeners
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAuthModal());
        }

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideAuthModal();
            }
        });

        // Setup tab switching
        const tabs = modal.querySelectorAll('.modal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchAuthTab(targetTab);
            });
        });

        // Setup form switching links
        const switchToRegister = modal.querySelector('.switch-to-register');
        const switchToLogin = modal.querySelector('.switch-to-login');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab('register');
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab('login');
            });
        }

        // Setup forms
        this.initLoginForm();
        this.initRegisterForm();
    }

    static initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) {
            console.error('❌ Login form not found');
            return;
        }

        console.log('✅ Initializing login form');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Login form submitted');

            const formData = new FormData(loginForm);
            const email = formData.get('email')?.trim();
            const password = formData.get('password');
            const rememberMe = formData.get('rememberMe') === 'on';

            console.log('Login data:', { email, rememberMe });

            // Validation
            if (!email || !password) {
                Utils.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const spinner = submitBtn.querySelector('.spinner');
            const btnText = submitBtn.querySelector('span');

            // Set loading state
            submitBtn.disabled = true;
            spinner.style.display = 'inline-block';
            btnText.textContent = 'Đang đăng nhập...';

            try {
                const user = await AuthManager.login(email, password, rememberMe);
                
                Utils.showToast(`Chào mừng ${user.name || user.email}!`, 'success');
                this.hideAuthModal();
                
                // Reset form
                loginForm.reset();
                
            } catch (error) {
                console.error('Login error:', error);
                Utils.showToast(error.message, 'error');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                spinner.style.display = 'none';
                btnText.textContent = 'Đăng nhập';
            }
        });
    }

    static initRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) {
            console.error('❌ Register form not found');
            return;
        }

        console.log('✅ Initializing register form');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Register form submitted');

            const formData = new FormData(registerForm);
            const name = formData.get('name')?.trim();
            const email = formData.get('email')?.trim();
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            console.log('Register data:', { name, email });

            // Validation
            if (!name || !email || !password || !confirmPassword) {
                Utils.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
                return;
            }

            if (password !== confirmPassword) {
                Utils.showToast('Mật khẩu xác nhận không khớp!', 'error');
                return;
            }

            if (password.length < 6) {
                Utils.showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const spinner = submitBtn.querySelector('.spinner');
            const btnText = submitBtn.querySelector('span');

            // Set loading state
            submitBtn.disabled = true;
            spinner.style.display = 'inline-block';
            btnText.textContent = 'Đang đăng ký...';

            try {
                const user = await AuthManager.register(name, email, password, confirmPassword);
                
                Utils.showToast(`Đăng ký thành công! Chào mừng ${user.name}!`, 'success');
                this.hideAuthModal();
                
                // Reset form
                registerForm.reset();
                
            } catch (error) {
                console.error('Register error:', error);
                Utils.showToast(error.message, 'error');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                spinner.style.display = 'none';
                btnText.textContent = 'Đăng ký';
            }
        });
    }

    static initEventListeners() {
        // Login button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                console.log('🔑 Login button clicked');
                this.showAuthModal('login');
            });
        }

        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                console.log('🚪 Logout button clicked');
                AuthManager.logout();
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
            }
        });
    }

    static showAuthModal(tab = 'login') {
        console.log('🎭 Showing auth modal, tab:', tab);
        
        const modal = document.getElementById('authModal');
        if (!modal) {
            console.error('❌ Auth modal not found');
            return;
        }

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Switch to correct tab
        this.switchAuthTab(tab);
    }

    static hideAuthModal() {
        console.log('🎭 Hiding auth modal');
        
        const modal = document.getElementById('authModal');
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);

        // Reset forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
    }

    static switchAuthTab(tab) {
        console.log('🔄 Switching to tab:', tab);
        
        const modal = document.getElementById('authModal');
        if (!modal) return;

        // Update tabs
        modal.querySelectorAll('.modal-tab').forEach(tabEl => {
            tabEl.classList.toggle('active', tabEl.dataset.tab === tab);
        });

        // Update forms
        modal.querySelectorAll('.modal-form').forEach(form => {
            form.classList.toggle('active', form.id === (tab + 'Form'));
        });
    }
}

// =================================================================
// FLOATING BUTTONS MANAGER
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
            
            .messenger-btn {
                background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%) !important;
                color: #fff !important;
            }
            
            .post-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                color: #fff !important;
            }
            
            .post-btn.disabled {
                background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
                cursor: not-allowed !important;
                opacity: 0.6;
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
        `;
        document.head.appendChild(styles);
    }

    static create() {
        const existingContainer = document.getElementById('floatingButtonsContainer');
        if (existingContainer) existingContainer.remove();
        
        const container = document.createElement('div');
        container.id = 'floatingButtonsContainer';
        
        // Luôn thêm nút Messenger
        container.appendChild(this.createMessengerButton());
        
        // Chỉ thêm nút đăng tin nếu user có quyền admin
        const postButton = this.createPostButton();
        if (postButton) {
            container.appendChild(postButton);
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
        const hasPermission = PermissionManager.checkPostPermission();
        
        if (!hasPermission) {
            console.log('🔒 User không có role admin - ẩn nút đăng tin');
            return null;
        }
        
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
// PRODUCT MANAGER
// =================================================================

class ProductManager {
    static async loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        Utils.showLoading(productsGrid, 'Đang tải sản phẩm...');
        
        try {
            const data = await ApiManager.getProducts();
            let products = data.data?.products || [];
            
            console.log('📦 Loaded products:', products.length);
            
            // Sort products by creation date (newest first)
            products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            allProducts = products;
            window.allProducts = products;
            
            // Render products using the global function
            if (window.renderApiProducts) {
                window.renderApiProducts(products);
            } else {
                this.renderProductsBasic(products, productsGrid);
            }
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            Utils.showError(productsGrid, 'Không thể tải sản phẩm. Vui lòng thử lại.');
            Utils.showToast('Lỗi tải sản phẩm: ' + error.message, 'error');
        }
    }

    static renderProductsBasic(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="no-products-found" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #64748b; margin-bottom: 1rem;">Không có sản phẩm nào</h3>
                    <p style="color: #9ca3af; font-size: 1rem;">Hiện tại chưa có sản phẩm nào được đăng.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        products.forEach(product => {
            const productCard = this.createBasicProductCard(product);
            container.appendChild(productCard);
        });
    }

    static createBasicProductCard(product) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.images?.[0] || product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.title}" loading="lazy">
                ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    <span class="product-current-price">${Utils.formatPrice(product.price)}</span>
                </div>
                <div class="product-actions">
                    <a href="${product.link || '#'}" class="add-to-cart-link" target="_blank">
                        <i class="fas fa-shopping-cart"></i><span>Mua Ngay</span>
                    </a>
                </div>
            </div>
        `;
        return productCard;
    }

    static async createProduct(productData) {
        try {
            console.log('🚀 Creating product:', productData);
            
            if (!currentUser) {
                throw new Error('Vui lòng đăng nhập để đăng sản phẩm!');
            }

            if (!PermissionManager.checkPostPermission()) {
                throw new Error('Bạn không có quyền đăng sản phẩm!');
            }

            // Prepare data for API
            const apiData = {
                title: productData.title,
                description: productData.description,
                price: parseInt(productData.price),
                category: 'services', // Default category
                images: [productData.image], // Convert single image to array
                badge: productData.badge || undefined,
                sales: parseInt(productData.sales) || 0,
                link: productData.link
            };

            console.log('📡 Sending to API:', apiData);

            const result = await ApiManager.createProduct(apiData);
            
            console.log('✅ Product created successfully:', result);

            // Reload products to show new product
            await this.loadProducts();
            
            return true;
        } catch (error) {
            console.error('❌ Error creating product:', error);
            throw error;
        }
    }

    static async updateProduct(productId, productData) {
        try {
            console.log('📝 Updating product:', productId, productData);
            
            const result = await ApiManager.updateProduct(productId, productData);
            
            console.log('✅ Product updated successfully:', result);
            
            // Reload products
            await this.loadProducts();
            
            return result;
        } catch (error) {
            console.error('❌ Error updating product:', error);
            throw error;
        }
    }

    static async deleteProduct(productId) {
        try {
            console.log('🗑️ Deleting product:', productId);
            
            const product = allProducts.find(p => p._id === productId);
            if (!PermissionManager.checkDeletePermission(product)) {
                throw new Error('Bạn không có quyền xóa sản phẩm này!');
            }

            await ApiManager.deleteProduct(productId);
            
            console.log('✅ Product deleted successfully');
            
            Utils.showToast('Xóa sản phẩm thành công!', 'success');
            
            // Remove from UI immediately
            const productCard = document.querySelector(`[data-id="${productId}"]`);
            if (productCard) {
                productCard.style.transition = 'all 0.3s ease';
                productCard.style.transform = 'scale(0)';
                productCard.style.opacity = '0';
                setTimeout(() => productCard.remove(), 300);
            }
            
            // Reload products
            setTimeout(() => this.loadProducts(), 500);
            
            return true;
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            throw error;
        }
    }
}

// =================================================================
// CART & FAVORITES MANAGERS
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
// MAIN INITIALIZATION
// =================================================================

class MainApp {
    static async init() {
        console.log('🚀 Initializing Main Application...');
        
        try {
            // Initialize UI first
            UIController.init();
            
            // Check auto login
            await AuthManager.checkAutoLogin();
            
            // Initialize floating buttons
            FloatingButtonsManager.init();
            
            // Load products
            if (document.getElementById('productsGrid')) {
                await ProductManager.loadProducts();
            }
            
            // Setup filter handlers
            this.setupFilterHandlers();
            
            // Mark as initialized
            isInitialized = true;
            window.isInitialized = true;
            
            console.log('✅ Main Application initialized successfully');
            
        } catch (error) {
            console.error('💥 Failed to initialize application:', error);
            Utils.showToast('Lỗi khởi tạo ứng dụng: ' + error.message, 'error');
        }
    }

    static setupFilterHandlers() {
        const filterButton = document.getElementById('filterButton');
        const resetButton = document.getElementById('resetButton');
        
        if (filterButton && window.filterProducts) {
            filterButton.addEventListener('click', window.filterProducts);
        }
        
        if (resetButton && window.resetFilters) {
            resetButton.addEventListener('click', window.resetFilters);
        }
    }
}

// =================================================================
// GLOBAL EXPORTS
// =================================================================

// Export to window object
window.Utils = Utils;
window.ApiManager = ApiManager;
window.AuthManager = AuthManager;
window.PermissionManager = PermissionManager;
window.UIController = UIController;
window.ProductManager = ProductManager;
window.FloatingButtonsManager = FloatingButtonsManager;
window.CartManager = CartManager;
window.FavoriteManager = FavoriteManager;
window.currentUser = currentUser;
window.allProducts = allProducts;

// Debug function for permissions
window.debugPermissions = () => PermissionManager.debugPermissions();

// =================================================================
// AUTO INITIALIZATION
// =================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => MainApp.init(), 100);
    });
} else {
    // DOM already loaded
    setTimeout(() => MainApp.init(), 100);
}

// Also listen for page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isInitialized) {
        // Page became visible, refresh data
        if (currentUser && document.getElementById('productsGrid')) {
            ProductManager.loadProducts();
        }
    }
});

console.log('📦 Main.js loaded successfully');
