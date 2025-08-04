// main.js - Fixed version với logging và debugging tốt hơn
"use strict";

// =================================================================
// CÀI ĐẶT & BIẾN TOÀN CỤC
// =================================================================

const API_BASE_URL = 'https://shop-4mlk.onrender.com/api/v1';
let currentUser = null;

// Danh sách email được ủy quyền đăng sản phẩm (MOVED HERE FROM SCRIPT.JS)
const AUTHORIZED_EMAILS = [
    'chinhan20917976549a@gmail.com',
    'manager@shopgrowgarden.com', 
    'seller@shopgrowgarden.com',
    'test@example.com',
    'greensvn@gmail.com'
];

// =================================================================
// LỚP TIỆN ÍCH (UTILS)
// =================================================================

class Utils {
    static formatPrice(price) {
        const num = typeof price === 'string' ? parseInt(price, 10) : price;
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    static formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('vi-VN');
        } catch (error) {
            return 'N/A';
        }
    }

    static showToast(message, type = 'success', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        const iconClass = icons[type] || icons.info;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas ${iconClass}" style="margin-right: 8px;"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: 10px;">×</button>
        `;
        
        const bgColors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        Object.assign(toast.style, {
            background: bgColors[type] || bgColors.info,
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
            zIndex: '9999'
        });

        toastContainer.appendChild(toast);
        
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

    static createToastContainer() {
        let container = document.getElementById('toastContainer');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'toastContainer';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10003'
        });
        document.body.appendChild(container);
        return container;
    }
    
    static showLoading(element, message = 'Đang tải...') {
        if (!element) return;
        element.innerHTML = `
            <div class="loading-placeholder" style="text-align: center; padding: 50px; color: #888; grid-column: 1 / -1;">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p style="margin-top: 10px;">${message}</p>
            </div>
        `;
    }

    static showError(element, message = 'Có lỗi xảy ra.') {
        if (!element) return;
        element.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 50px; color: #ef4444; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p style="margin-top: 10px;">${message}</p>
            </div>
        `;
    }
}

// =================================================================
// KIỂM TRA QUYỀN ĐĂNG SẢN PHẨM - FIXED VERSION
// =================================================================

function checkPostPermission() {
    console.log('🔍 Checking post permission...');
    console.log('📧 Current user object:', currentUser);
    
    if (!currentUser) {
        console.log('❌ No current user found');
        return false;
    }
    
    const userEmail = currentUser.email;
    console.log('📧 User email from currentUser:', userEmail);
    
    if (!userEmail || typeof userEmail !== 'string') {
        console.log('❌ No valid email found in user object');
        console.log('📋 Available user properties:', Object.keys(currentUser));
        return false;
    }
    
    const normalizedEmail = userEmail.toLowerCase().trim();
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('📋 Authorized emails:', AUTHORIZED_EMAILS);
    
    const hasPermission = AUTHORIZED_EMAILS.map(email => email.toLowerCase()).includes(normalizedEmail);
    console.log('✅ Has permission result:', hasPermission);
    
    return hasPermission;
}

// =================================================================
// QUẢN LÝ FLOATING BUTTONS - ENHANCED VERSION
// =================================================================

function addFloatingButtonStyles() {
    if (document.getElementById('floatingButtonStyles')) {
        console.log('💫 Floating button styles already exist');
        return;
    }

    console.log('🎨 Adding floating button styles...');
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
            animation: bounceIn 0.8s ease-out;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            white-space: nowrap;
        }

        .floating-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            transition: all 0.6s ease;
            transform: translate(-50%, -50%);
        }

        .floating-btn:hover::before {
            width: 300px;
            height: 300px;
        }

        .floating-btn:hover {
            transform: translateY(-3px) scale(1.05);
        }

        .floating-btn:active {
            transform: translateY(-1px) scale(1.02);
        }

        .floating-btn i {
            font-size: 1.1rem;
            animation: pulse 2s infinite;
        }

        .messenger-btn {
            background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%) !important;
            color: white !important;
        }

        .messenger-btn:hover {
            box-shadow: 0 12px 35px rgba(0, 132, 255, 0.4) !important;
            color: white !important;
            text-decoration: none !important;
        }

        .post-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            color: white !important;
        }

        .post-btn:hover {
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4) !important;
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

        @keyframes bounceIn {
            0% {
                transform: scale(0.3);
                opacity: 0;
            }
            50% {
                transform: scale(1.05);
            }
            70% {
                transform: scale(0.9);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }

        @media (max-width: 768px) {
            #floatingButtonsContainer {
                bottom: 1rem !important;
                right: 1rem !important;
            }
            
            .floating-btn {
                padding: 0.875rem 1.25rem !important;
                font-size: 13px !important;
            }
        }
    `;
    document.head.appendChild(styles);
    console.log('✅ Floating button styles added');
}

function createFloatingButtons() {
    console.log('🚀 Creating floating buttons...');
    
    // Add styles first
    addFloatingButtonStyles();
    
    // Remove existing buttons
    const existingContainer = document.getElementById('floatingButtonsContainer');
    if (existingContainer) {
        console.log('🗑️ Removing existing floating buttons');
        existingContainer.remove();
    }

    // Create container
    const floatingContainer = document.createElement('div');
    floatingContainer.id = 'floatingButtonsContainer';
    
    // Create Messenger button (always visible)
    const messengerBtn = document.createElement('a');
    messengerBtn.id = 'messengerButton';
    messengerBtn.href = 'https://m.me/100063758577070';
    messengerBtn.target = '_blank';
    messengerBtn.rel = 'noopener noreferrer';
    messengerBtn.className = 'floating-btn messenger-btn';
    messengerBtn.innerHTML = `
        <i class="fab fa-facebook-messenger"></i>
        <span>Liên hệ</span>
    `;
    messengerBtn.title = 'Liên hệ qua Facebook Messenger';

    // Create post button (conditional)
    const postBtn = document.createElement('button');
    postBtn.id = 'postProductButton';
    postBtn.className = 'floating-btn post-btn';
    postBtn.innerHTML = `
        <i class="fas fa-plus"></i>
        <span>Đăng tin</span>
    `;
    postBtn.title = 'Đăng sản phẩm mới';
    postBtn.addEventListener('click', () => {
        console.log('📝 Post button clicked');
        if (window.showAddProductModal) {
            window.showAddProductModal();
        } else {
            Utils.showToast('Chức năng đăng tin chưa sẵn sàng!', 'error');
        }
    });

    // Add buttons to container
    floatingContainer.appendChild(messengerBtn);
    
    // FIXED: Check permission properly
    const hasPermission = checkPostPermission();
    console.log('🔐 Permission check result:', hasPermission);
    
    if (hasPermission) {
        console.log('✅ User has permission - adding post button');
        floatingContainer.appendChild(postBtn);
    } else {
        console.log('❌ User has no permission - post button not added');
    }
    
    // Add container to page
    document.body.appendChild(floatingContainer);
    
    console.log('✅ Floating buttons created and added to page');
    console.log('📦 Container element:', floatingContainer);
    console.log('💬 Messenger button:', messengerBtn);
    if (hasPermission) {
        console.log('➕ Post button:', postBtn);
    } else {
        console.log('➕ Post button: Not added due to insufficient permissions');
    }
}

function updateFloatingButtons() {
    console.log('🔄 Updating floating buttons...');
    console.log('👤 Current user when updating buttons:', currentUser);
    
    // Always recreate to ensure fresh state
    setTimeout(() => {
        createFloatingButtons();
    }, 100);
}

// =================================================================
// GỌI API
// =================================================================

async function callApi(endpoint, method = 'GET', body = null, requireAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    
    if (token && requireAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 204) return true;

        const data = await response.json();
        
        if (response.status === 401 && !requireAuth) {
            console.log('401 on optional auth endpoint, returning empty data');
            return { data: { products: [], favorites: [], cart: [] } };
        }

        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra từ máy chủ.');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

// =================================================================
// QUẢN LÝ GIỎ HÀNG & YÊU THÍCH
// =================================================================

const CartManager = {
    async get() {
        if (!currentUser) return [];
        try {
            const result = await callApi('/cart');
            return result.data.cart || [];
        } catch (error) {
            console.log('Cart access requires login:', error.message);
            return [];
        }
    },

    async add(productId, quantity = 1) {
        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
        }
        await callApi('/cart', 'POST', { productId, quantity });
        await updateCartCount();
    }
};

const FavoriteManager = {
    async get() {
        if (!currentUser) return [];
        try {
            const result = await callApi('/favorites');
            return result.data.favorites || [];
        } catch (error) {
            console.log('Favorites access requires login:', error.message);
            return [];
        }
    },

    async add(productId) {
        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập để thêm vào yêu thích!');
        }
        await callApi('/favorites', 'POST', { productId });
        await updateFavoriteStatus(productId, true);
    },

    async remove(productId) {
        if (!currentUser) return;
        await callApi(`/favorites/${productId}`, 'DELETE');
        await updateFavoriteStatus(productId, false);
    }
};

// =================================================================
// XÁC THỰC NGƯỜI DÙNG - ENHANCED VERSION
// =================================================================

async function authenticate(email, password) {
    console.log('🔐 Authenticating user:', email);
    const data = await callApi('/users/login', 'POST', { email, password });
    localStorage.setItem('token', data.token);
    
    // FIXED: Ensure we store complete user data
    currentUser = {
        ...data.data.user,
        email: data.data.user.email || email // Fallback to provided email
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('✅ Authentication successful');
    console.log('👤 User data:', currentUser);
    console.log('📧 User email:', currentUser.email);
    
    await updateUIAfterLogin();
    return currentUser;
}

async function register(name, email, password, passwordConfirm) {
    console.log('📝 Registering user:', email);
    const data = await callApi('/users/signup', 'POST', { name, email, password, passwordConfirm });
    localStorage.setItem('token', data.token);
    
    // FIXED: Ensure we store complete user data
    currentUser = {
        ...data.data.user,
        name: data.data.user.name || name,
        email: data.data.user.email || email // Fallback to provided email
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('✅ Registration successful');
    console.log('👤 User data:', currentUser);
    console.log('📧 User email:', currentUser.email);
    
    await updateUIAfterLogin();
    return currentUser;
}

function logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
    
    console.log('👋 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateUIAfterLogout();
    Utils.showToast('Đăng xuất thành công!', 'success');

    const protectedPages = ['account.html', 'cart.html', 'favorite.html'];
    if (protectedPages.some(page => window.location.pathname.includes(page))) {
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

async function checkAutoLogin() {
    console.log('🔍 Checking auto login...');
    const token = localStorage.getItem('token');
    
    if (token) {
        console.log('🎫 Token found, checking validity...');
        try {
            const data = await callApi('/users/me');
            currentUser = data.data.user;
            
            if (!currentUser.email) {
                throw new Error('Invalid user data: missing email');
            }
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('✅ Auto login successful');
            console.log('👤 User data:', currentUser);
            console.log('📧 User email:', currentUser.email);
            
            await updateUIAfterLogin();
        } catch (error) {
            console.error('❌ Auto-login failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateUIAfterLogout();
        }
    } else {
        console.log('❌ No token found');
        // Try to load from localStorage as fallback
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData && userData.email) {
                    currentUser = userData;
                    console.log('📱 Using stored user data:', currentUser);
                    await updateUIAfterLogin();
                } else {
                    localStorage.removeItem('currentUser');
                }
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }
}

// =================================================================
// CẬP NHẬT GIAO DIỆN
// =================================================================

function getDisplayName(user) {
    if (!user) return 'User';
    
    if (user.name && user.name.trim() !== '') {
        return user.name.trim();
    }
    
    if (user.email && typeof user.email === 'string' && user.email.includes('@')) {
        return user.email.split('@')[0];
    }
    
    return 'User';
}

async function updateUIAfterLogin() {
    console.log('🎨 Updating UI after login...');
    if (!currentUser) return;

    const loginButton = document.getElementById('loginButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loginButton) loginButton.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'flex';
    
    const displayName = getDisplayName(currentUser);
    const firstLetter = displayName.charAt(0).toUpperCase();
    
    document.querySelectorAll('.user-name, #userName').forEach(el => {
        if (el) el.textContent = displayName;
    });
    
    document.querySelectorAll('.user-avatar, #userAvatar').forEach(el => {
        if (el) el.textContent = firstLetter;
    });

    await updateCartCount();
    
    // **CRITICAL: Update floating buttons after login**
    console.log('🔄 Updating floating buttons after successful login...');
    updateFloatingButtons();
}

function updateUIAfterLogout() {
    console.log('🎨 Updating UI after logout...');
    const loginButton = document.getElementById('loginButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loginButton) loginButton.style.display = 'flex';
    if (userDropdown) userDropdown.style.display = 'none';

    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = '0';
        el.style.display = 'none';
    });

    // **Update floating buttons after logout**
    console.log('🔄 Updating floating buttons after logout...');
    updateFloatingButtons();
}

async function updateCartCount() {
    if (!currentUser) return;
    
    const cart = await CartManager.get();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

async function updateFavoriteStatus(productId, isFavorite) {
    document.querySelectorAll(`.favorite-btn[data-id="${productId}"]`).forEach(btn => {
        btn.classList.toggle('active', isFavorite);
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        }
    });
}

async function updateAllFavoriteButtons() {
    if (!currentUser) return;
    
    const favoriteStatus = await FavoriteManager.getStatus();
    Object.keys(favoriteStatus).forEach(productId => {
        updateFavoriteStatus(productId, true);
    });
}

// =================================================================
// MODAL XÁC THỰC
// =================================================================

function initAuthModal() {
    const authModal = document.getElementById('authModal');
    const loginButton = document.getElementById('loginButton');
    const closeModalButtons = document.querySelectorAll('.modal-close');

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
    closeModalButtons.forEach(btn => btn.addEventListener('click', hideModal));
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) hideModal();
    });

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

    document.querySelectorAll('.switch-to-register, .switch-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = e.target.classList.contains('switch-to-register') ? 'register' : 'login';
            const targetTabElement = authModal.querySelector(`.modal-tab[data-tab="${targetTab}"]`);
            if (targetTabElement) targetTabElement.click();
        });
    });
    
    handleLoginForm(hideModal);
    handleRegisterForm(hideModal);
}

function handleFormSubmit(form, submitAction, onSuccess) {
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.btn-submit');
        const spinner = submitBtn.querySelector('.spinner');

        submitBtn.classList.add('loading');
        if (spinner) spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            const user = await submitAction();
            const displayName = getDisplayName(user);
            Utils.showToast(`Chào mừng ${displayName}!`, 'success');
            onSuccess();
            form.reset();
            
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                setTimeout(() => {
                    if (window.loadProducts) window.loadProducts();
                }, 500);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Thao tác thất bại, vui lòng thử lại.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            if (spinner) spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function handleLoginForm(onSuccess) {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    handleFormSubmit(form, () => {
        const email = form.email.value.trim();
        const password = form.password.value;
        
        if (!email || !password) {
            throw new Error('Vui lòng nhập đầy đủ thông tin!');
        }
        
        return authenticate(email, password);
    }, onSuccess);
}

function handleRegisterForm(onSuccess) {
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    handleFormSubmit(form, () => {
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (!name || !email || !password || !confirmPassword) {
            throw new Error('Vui lòng nhập đầy đủ thông tin!');
        }
        
        if (password.length < 6) {
            throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
        }
        
        if (password !== confirmPassword) {
            throw new Error('Mật khẩu xác nhận không khớp!');
        }
        
        return register(name, email, password, confirmPassword);
    }, onSuccess);
}

// =================================================================
// LOAD PRODUCTS
// =================================================================

async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (window.renderApiProducts) {
        console.log('Using renderApiProducts from script.js for index page');
        
        Utils.showLoading(productsGrid, 'Đang tải sản phẩm...');
        
        try {
            const data = await callApi('/products', 'GET', null, true); // Require auth for products
            const products = data.data.products || [];
            
            window.allProducts = products;
            window.renderApiProducts(products);
            
            if (currentUser) {
                await updateAllFavoriteButtons();
            }
            
        } catch (error) {
            console.error('Failed to load products:', error);
            
            productsGrid.innerHTML = `
                <div class="auth-required-message" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: #6366f1; margin-bottom: 1rem;"></i>
                    <h3 style="color: #1f2937; margin-bottom: 1rem;">Cần đăng nhập để xem sản phẩm</h3>
                    <p style="color: #64748b; margin-bottom: 2rem;">Vui lòng đăng nhập để truy cập danh sách sản phẩm của chúng tôi</p>
                    <button class="btn btn-primary" onclick="document.getElementById('loginButton').click()">
                        <i class="fas fa-user"></i>
                        <span>Đăng nhập ngay</span>
                    </button>
                </div>
            `;
        }
        return;
    }
}

function initIndexPage() {
    loadProducts();
    
    const filterButton = document.getElementById('filterButton');
    const resetButton = document.getElementById('resetButton');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            if (window.filterProducts) {
                window.filterProducts();
            }
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (window.resetFilters) {
                window.resetFilters();
            }
        });
    }
}

// =================================================================
// EXPORTS
// =================================================================

window.Utils = Utils;
window.CartManager = CartManager;
window.FavoriteManager = FavoriteManager;
window.callApi = callApi;
window.currentUser = currentUser;
window.updateAllFavoriteButtons = updateAllFavoriteButtons;
window.updateFavoriteStatus = updateFavoriteStatus;
window.loadProducts = loadProducts;
window.checkPostPermission = checkPostPermission;
window.updateFloatingButtons = updateFloatingButtons;

// =================================================================
// KHỞI CHẠY CHÍNH - ENHANCED VERSION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Starting Shop Grow A Garden initialization...');
        
        // 1. Khởi tạo các thành phần chung
        Utils.createToastContainer();
        initAuthModal();
        
        // 2. Gắn sự kiện đăng xuất
        document.querySelectorAll('#logoutButton, #sidebarLogoutBtn').forEach(btn => {
            if (btn) btn.addEventListener('click', logout);
        });
        
        // 3. Kiểm tra và tự động đăng nhập nếu có token hợp lệ
        await checkAutoLogin();

        // 4. Chạy logic riêng cho trang hiện tại
        const path = window.location.pathname.split("/").pop() || 'index.html';
        console.log('📄 Current page:', path);
        
        switch (path) {
            case 'index.html':
            case '':
                initIndexPage();
                break;
            case 'account.html':
                // initAccountPage(); // Implement if needed
                break;
            case 'cart.html':
                // await loadCartPage(); // Implement if needed
                break;
            case 'favorite.html':
                // await loadFavoritesPage(); // Implement if needed
                break;
        }
        
        // 5. Tạo floating buttons sau khi mọi thứ đã sẵn sàng
        console.log('🎯 Creating floating buttons after initialization...');
        setTimeout(() => {
            createFloatingButtons();
        }, 500);
        
        console.log('✅ Shop Grow A Garden initialized successfully');
        console.log('🔍 Current user after init:', currentUser);
        
    } catch (error) {
        console.error('❌ Critical error during initialization:', error);
        Utils.showToast('Có lỗi xảy ra khi khởi tạo trang web', 'error');
    }
});
