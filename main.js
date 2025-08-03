// main.js - Phiên bản kết hợp và nâng cấp toàn diện
// Tệp "bộ não" trung tâm cho trang web Shop Grow A Garden, sử dụng kiến trúc API-driven.

"use strict";

// =================================================================
// CÀI ĐẶT & BIẾN TOÀN CỤC
// =================================================================

const API_BASE_URL = 'https://shop-4mlk.onrender.com/api/v1';
let currentUser = null;

// =================================================================
// LỚP TIỆN ÍCH (UTILS) - NÂNG CẤP
// Cung cấp các hàm hỗ trợ chung cho toàn bộ trang web.
// =================================================================

class Utils {
    // Định dạng giá tiền sang chuẩn Việt Nam.
    static formatPrice(price) {
        const num = typeof price === 'string' ? parseInt(price, 10) : price;
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    // Định dạng ngày tháng sang chuẩn Việt Nam.
    static formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('vi-VN');
        } catch (error) {
            return 'N/A';
        }
    }

    // Hiển thị thông báo nhanh (toast) cho người dùng.
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
        toast.style.cssText = `
            background: ${bgColors[type] || bgColors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            z-index: 9999;
        `;

        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 100);

        const close = () => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        };
        
        const timer = setTimeout(close, duration);
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            close();
        });
    }

    // Tạo vùng chứa cho các toast message nếu chưa có.
    static createToastContainer() {
        let container = document.getElementById('toastContainer');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10003;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    // Hiển thị trạng thái đang tải bên trong một phần tử.
    static showLoading(element, message = 'Đang tải...') {
        if (!element) return;
        element.innerHTML = `<div class="loading-placeholder" style="text-align: center; padding: 50px; color: #888; grid-column: 1 / -1;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">${message}</p></div>`;
    }

    // Hiển thị trạng thái lỗi bên trong một phần tử.
    static showError(element, message = 'Có lỗi xảy ra.') {
        if (!element) return;
        element.innerHTML = `<div class="error-state" style="text-align: center; padding: 50px; color: #ef4444; grid-column: 1 / -1;"><i class="fas fa-exclamation-triangle fa-2x"></i><p style="margin-top: 10px;">${message}</p></div>`;
    }
}

// =================================================================
// GỌI API - NÂNG CẤP
// Hàm trung tâm để thực hiện các yêu cầu đến máy chủ.
// =================================================================

async function callApi(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 204) return true; // Xử lý cho các request không trả về nội dung (vd: DELETE)

        const data = await response.json();
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
// QUẢN LÝ GIỎ HÀNG (CART MANAGER) - API DRIVEN
// =================================================================

const CartManager = {
    async get() {
        try {
            const result = await callApi('/cart');
            return result.data.cart || [];
        } catch (error) {
            // Nếu người dùng chưa đăng nhập hoặc có lỗi, trả về giỏ hàng rỗng.
            return [];
        }
    },
    async add(productId, quantity = 1) {
        await callApi('/cart', 'POST', { productId, quantity });
        await updateCartCount();
    },
    async remove(productId) {
        await callApi(`/cart/${productId}`, 'DELETE');
        await updateCartCount();
        // Nếu đang ở trang giỏ hàng, tải lại trang.
        if (window.location.pathname.includes('cart.html')) await loadCartPage();
    },
    async updateQuantity(productId, quantity) {
        // API này được giả định là có thể cập nhật một phần của giỏ hàng
        // Gửi một mảng chứa chỉ sản phẩm cần cập nhật.
        await callApi('/cart', 'PATCH', { cart: [{ product: productId, quantity }] });
        // Tải lại toàn bộ trang giỏ hàng để cập nhật tổng tiền và các thông tin khác.
        if (window.location.pathname.includes('cart.html')) await loadCartPage();
    },
    async clear() {
        // Gửi một mảng rỗng để xóa toàn bộ giỏ hàng
        await callApi('/cart', 'PATCH', { cart: [] });
        await updateCartCount();
        if (window.location.pathname.includes('cart.html')) await loadCartPage();
    }
};

// =================================================================
// QUẢN LÝ YÊU THÍCH (FAVORITE MANAGER) - API DRIVEN
// =================================================================

const FavoriteManager = {
    async get() {
        try {
            const result = await callApi('/favorites');
            return result.data.favorites || [];
        } catch (error) {
            return [];
        }
    },
    async add(productId) {
        await callApi('/favorites', 'POST', { productId });
        await updateFavoriteStatus(productId, true);
    },
    async remove(productId) {
        await callApi(`/favorites/${productId}`, 'DELETE');
        await updateFavoriteStatus(productId, false);
        // Nếu đang ở trang yêu thích, tải lại danh sách.
        if (window.location.pathname.includes('favorite.html')) await loadFavoritesPage();
    },
    async getStatus() {
        const favorites = await this.get();
        const status = {};
        favorites.forEach(fav => {
            if (fav && fav._id) { // Đảm bảo fav là một object hợp lệ
                status[fav._id] = true;
            }
        });
        return status;
    }
};

// =================================================================
// XÁC THỰC NGƯỜI DÙNG - NÂNG CẤP
// Xử lý đăng nhập, đăng ký, đăng xuất và tự động đăng nhập.
// =================================================================

async function authenticate(email, password) {
    const data = await callApi('/users/login', 'POST', { email, password });
    localStorage.setItem('token', data.token);
    currentUser = data.data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    await updateUIAfterLogin();
    return currentUser;
}

async function register(name, email, password, passwordConfirm) {
    const data = await callApi('/users/signup', 'POST', { name, email, password, passwordConfirm });
    localStorage.setItem('token', data.token);
    currentUser = data.data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    await updateUIAfterLogin();
    return currentUser;
}

function logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateUIAfterLogout();
    Utils.showToast('Đăng xuất thành công!', 'success');

    // Chuyển về trang chủ nếu đang ở các trang cần đăng nhập
    if (['account.html', 'cart.html', 'favorite.html'].some(page => window.location.pathname.includes(page))) {
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

async function checkAutoLogin() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Xác thực token với server để lấy thông tin người dùng mới nhất
            const data = await callApi('/users/me');
            currentUser = data.data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await updateUIAfterLogin();
        } catch (error) {
            console.error('Auto-login failed, token might be expired:', error);
            // Xóa token và dữ liệu cũ nếu không hợp lệ
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateUIAfterLogout();
        }
    }
}

// =================================================================
// CẬP NHẬT GIAO DIỆN NGƯỜI DÙNG (UI) - NÂNG CẤP
// =================================================================

async function updateUIAfterLogin() {
    if (!currentUser) return;

    const loginButton = document.getElementById('loginButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loginButton) loginButton.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'flex';
    
    // FIX: Thêm kiểm tra currentUser.email tồn tại để tránh lỗi runtime
    const userName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Người dùng');
    const firstLetter = userName.charAt(0).toUpperCase();
    
    document.querySelectorAll('.user-name, #userName').forEach(el => { el.textContent = userName; });
    document.querySelectorAll('.user-avatar, #userAvatar').forEach(el => { el.textContent = firstLetter; });

    // Cập nhật số lượng giỏ hàng và trạng thái các nút yêu thích
    await updateCartCount();
    await updateAllFavoriteButtons();
}

function updateUIAfterLogout() {
    const loginButton = document.getElementById('loginButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loginButton) loginButton.style.display = 'flex';
    if (userDropdown) userDropdown.style.display = 'none';

    // Reset số lượng giỏ hàng
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = '0';
        el.style.display = 'none';
    });
    // Reset các nút yêu thích
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.querySelector('i').className = 'far fa-heart';
    });
}

async function updateCartCount() {
    if (!currentUser) return; // Chỉ cập nhật nếu đã đăng nhập
    const cart = await CartManager.get();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// =================================================================
// LOGIC MODAL XÁC THỰC - TÁI CẤU TRÚC
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
            forms.forEach(f => f.classList.toggle('active', f.id === `${tab.dataset.tab}Form`));
        });
    });

    document.querySelectorAll('.switch-to-register, .switch-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = e.target.classList.contains('switch-to-register') ? 'register' : 'login';
            authModal.querySelector(`.modal-tab[data-tab="${targetTab}"]`).click();
        });
    });
    
    handleLoginForm(hideModal);
    handleRegisterForm(hideModal);
}

// Hàm xử lý submit form chung, tránh lặp code
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
            Utils.showToast(`Chào mừng ${user.name}!`, 'success');
            onSuccess();
            form.reset();
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
        if (!email || !password) throw new Error('Vui lòng nhập đầy đủ thông tin!');
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

        if (!name || !email || !password || !confirmPassword) throw new Error('Vui lòng nhập đầy đủ thông tin!');
        if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
        if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp!');
        
        return register(name, email, password, confirmPassword);
    }, onSuccess);
}


// =================================================================
// LOGIC RIÊNG CHO CÁC TRANG - API-DRIVEN
// =================================================================

// --- Tải sản phẩm và gắn các event listeners ---
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    Utils.showLoading(productsGrid, 'Đang tải sản phẩm...');
    try {
        const data = await callApi('/products');
        const products = data.data.products;
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Không có sản phẩm nào để hiển thị.</p>';
            return;
        }
        productsGrid.innerHTML = products.map(createProductCardHTML).join('');
        attachProductEventListeners();
        if (currentUser) {
            await updateAllFavoriteButtons();
        }
    } catch (error) {
        Utils.showError(productsGrid, 'Không thể tải sản phẩm. Vui lòng thử lại sau.');
    }
}

function createProductCardHTML(product) {
    return `
        <div class="product-card" data-id="${product._id}" data-price="${product.price}" data-note="${product.description || ''}">
            <div class="product-image">
                <img src="${product.images[0] || 'https://via.placeholder.com/300'}" alt="${product.title}" loading="lazy">
                ${product.badge ? `<span class="product-badge ${String(product.badge).toLowerCase()}">${product.badge}</span>` : ''}
                <div class="product-overlay">
                    <button class="btn-icon favorite-btn" data-id="${product._id}" title="Thêm vào yêu thích">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description || ''}</p>
                 <div class="product-price">${Utils.formatPrice(product.price)}đ</div>
            </div>
            <div class="product-actions">
                <button class="btn btn-primary add-to-cart" data-id="${product._id}">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Thêm vào giỏ</span>
                </button>
            </div>
        </div>
    `;
}

function attachProductEventListeners() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!currentUser) {
                Utils.showToast('Vui lòng đăng nhập để mua hàng!', 'info');
                document.getElementById('loginButton').click(); // Mở modal đăng nhập
                return;
            }
            const productId = e.currentTarget.dataset.id;
            try {
                await CartManager.add(productId);
                Utils.showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
            } catch (error) {
                Utils.showToast(error.message || 'Không thể thêm vào giỏ hàng.', 'error');
            }
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Ngăn sự kiện click lan ra các phần tử cha
            e.stopPropagation(); 
            e.preventDefault();

            if (!currentUser) {
                Utils.showToast('Vui lòng đăng nhập để yêu thích!', 'info');
                document.getElementById('loginButton').click();
                return;
            }
            const productId = e.currentTarget.dataset.id;
            const isFavorite = e.currentTarget.classList.contains('active');
            try {
                if (isFavorite) {
                    await FavoriteManager.remove(productId);
                    Utils.showToast('Đã xóa khỏi danh sách yêu thích!', 'info');
                } else {
                    await FavoriteManager.add(productId);
                    Utils.showToast('Đã thêm vào danh sách yêu thích!', 'success');
                }
            } catch (error) {
                Utils.showToast(error.message || 'Thao tác thất bại.', 'error');
            }
        });
    });
}

// --- Cập nhật trạng thái nút yêu thích ---
async function updateFavoriteStatus(productId, isFavorite) {
    document.querySelectorAll(`.favorite-btn[data-id="${productId}"]`).forEach(btn => {
        btn.classList.toggle('active', isFavorite);
        const icon = btn.querySelector('i');
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    });
}

async function updateAllFavoriteButtons() {
    if(!currentUser) return;
    const favoriteStatus = await FavoriteManager.getStatus();
    Object.keys(favoriteStatus).forEach(productId => {
        updateFavoriteStatus(productId, true);
    });
}


// --- Trang chủ (index.html) ---
function initIndexPage() {
    loadProducts(); // Tải sản phẩm từ API
    
    // Logic bộ lọc giữ nguyên vì nó hoạt động trên các sản phẩm đã được tải ra
    const filterButton = document.getElementById('filterButton');
    const resetButton = document.getElementById('resetButton');
    
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            const id = (document.getElementById('searchId')?.value || '').toLowerCase();
            const priceRange = document.getElementById('searchPrice')?.value || '';
            const note = (document.getElementById('searchNote')?.value || '').toLowerCase();
            
            document.querySelectorAll('.product-card').forEach(card => {
                const cardId = (card.dataset.id || '').toLowerCase();
                const cardPrice = parseInt(card.dataset.price || '0');
                const cardNote = (card.dataset.note || '').toLowerCase();
                let isVisible = true;
                if (id && !cardId.includes(id)) isVisible = false;
                if (note && !cardNote.includes(note)) isVisible = false;
                if (priceRange) {
                    const ranges = { 'duoi-50k': [0, 49999], 'tu-50k-200k': [50000, 200000], 'tren-200k': [200001, Infinity] };
                    const [min, max] = ranges[priceRange] || [0, Infinity];
                    if (cardPrice < min || cardPrice > max) isVisible = false;
                }
                card.style.display = isVisible ? 'block' : 'none';
            });
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.getElementById('searchId').value = '';
            document.getElementById('searchPrice').value = '';
            document.getElementById('searchNote').value = '';
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'block';
            });
        });
    }
}

// --- Trang tài khoản (account.html) ---
function initAccountPage() {
    const accountLayout = document.getElementById('accountLayout');
    const loginPrompt = document.getElementById('loginPrompt');
    if (!accountLayout) return;

    if (!currentUser) {
        if (accountLayout) accountLayout.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        return;
    }
    
    if (accountLayout) accountLayout.style.display = 'grid';
    if (loginPrompt) loginPrompt.style.display = 'none';

    const userName = currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Người dùng');
    const userId = currentUser._id || 'N/A';
    
    document.getElementById('accountName').textContent = userName;
    // FIX: Cải thiện logic hiển thị ID để tránh lỗi runtime với .slice()
    document.getElementById('accountId').textContent = userId !== 'N/A' ? `ID: ${userId.slice(-6)}` : 'ID: Không xác định';
    document.getElementById('accountAvatar').textContent = userName.charAt(0).toUpperCase();
    document.getElementById('userFullName').textContent = userName;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userRegisterDate').textContent = Utils.formatDate(currentUser.createdAt);
    document.getElementById('userAccountId').textContent = userId;
    // Lấy số dư từ đối tượng currentUser, an toàn hơn
    document.getElementById('balanceAmount').textContent = `${Utils.formatPrice(currentUser.balance || 0)}đ`;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => {
                t.classList.toggle('active', t.id === `${item.dataset.tab}Tab`);
            });
        });
    });
}

// --- Hàm hiển thị thông báo yêu cầu đăng nhập chung ---
function displayLoginPrompt(container, message, title) {
    container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
            <i class="fas fa-sign-in-alt" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="font-size: 22px; margin-bottom: 10px;">${title}</h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <button class="btn btn-primary" id="promptLoginButton">Đăng nhập ngay</button>
        </div>
    `;
    document.getElementById('promptLoginButton').addEventListener('click', () => {
        document.getElementById('loginButton').click();
    });
}

// --- Trang yêu thích (favorite.html) ---
async function loadFavoritesPage() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (!favoritesGrid) return;
    if (!currentUser) {
        displayLoginPrompt(favoritesGrid, 'Bạn cần đăng nhập để xem danh sách sản phẩm yêu thích của mình.', 'Vui lòng đăng nhập');
        return;
    }
    Utils.showLoading(favoritesGrid, 'Đang tải danh sách yêu thích...');
    try {
        const favorites = await FavoriteManager.get();
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                    <i class="far fa-heart" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Danh sách yêu thích trống</h3>
                    <p style="margin-bottom: 20px;">Hãy khám phá và thêm những sản phẩm bạn yêu thích vào đây nhé!</p>
                    <a href="index.html" class="btn btn-primary">Khám phá ngay</a>
                </div>
            `;
            return;
        }
        favoritesGrid.innerHTML = favorites.map(createProductCardHTML).join('');
        attachProductEventListeners();
        await updateAllFavoriteButtons();
    } catch (error) {
        Utils.showError(favoritesGrid, 'Lỗi khi tải danh sách yêu thích.');
    }
}

// --- Trang giỏ hàng (cart.html) ---
async function loadCartPage() {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;
    if (!currentUser) {
        displayLoginPrompt(cartContainer, 'Bạn cần đăng nhập để xem giỏ hàng và tiến hành thanh toán.', 'Giỏ hàng của bạn');
        return;
    }
    Utils.showLoading(cartContainer, 'Đang tải giỏ hàng...');
    try {
        const cart = await CartManager.get();
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-shopping-bag" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Giỏ hàng của bạn đang trống</h3>
                    <p style="margin-bottom: 20px;">Hãy lựa chọn những sản phẩm tuyệt vời và thêm vào giỏ hàng nhé.</p>
                    <a href="index.html" class="btn btn-primary">Tiếp tục mua sắm</a>
                </div>`;
            return;
        }

        let subtotal = 0;
        const itemsHTML = cart.map(item => {
            const product = item.product;
            if (!product) return ''; // Bỏ qua nếu sản phẩm không có dữ liệu
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="cart-item" data-id="${product._id}">
                    // FIX: Thêm ảnh placeholder để tránh lỗi ảnh hỏng nếu product.images[0] không tồn tại
                    <img src="${product.images[0] || 'https://via.placeholder.com/150'}" alt="${product.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${product.title}</h3>
                        <div class="cart-item-price">${Utils.formatPrice(product.price)}đ</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="btn-quantity minus" data-id="${product._id}">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${product._id}" data-product-id="${product._id}">
                        <button class="btn-quantity plus" data-id="${product._id}">+</button>
                    </div>
                    <div class="cart-item-total">${Utils.formatPrice(itemTotal)}đ</div>
                    <button class="btn-remove" data-id="${product._id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');

        cartContainer.innerHTML = `
            <div class="cart-layout">
                <div class="cart-items-list">${itemsHTML}</div>
                <div class="cart-summary">
                    <h3>Tổng Cộng</h3>
                    <div class="summary-row"><span>Tạm tính</span><span id="subtotal">${Utils.formatPrice(subtotal)}đ</span></div>
                    <div class="summary-row"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
                    <div class="summary-divider"></div>
                    <div class="summary-row total"><span>Thành tiền</span><span id="total">${Utils.formatPrice(subtotal)}đ</span></div>
                    <button class="btn btn-primary btn-block" id="checkoutButton">Tiến Hành Thanh Toán</button>
                </div>
            </div>`;
        
        attachCartPageEventListeners();

    } catch (error) {
        Utils.showError(cartContainer, 'Không thể tải giỏ hàng.');
    }
}

function attachCartPageEventListeners() {
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            Utils.showToast('Đang xóa sản phẩm...', 'info');
            CartManager.remove(productId);
        });
    });

    // Tạo một hàm debounce để tránh gọi API liên tục khi người dùng thay đổi số lượng
    let debounceTimer;
    const debouncedUpdateQuantity = (productId, newQuantity) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
             CartManager.updateQuantity(productId, newQuantity);
        }, 500); // Chờ 500ms sau lần thay đổi cuối cùng mới gọi API
    };

    document.querySelectorAll('.plus, .minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.currentTarget.parentElement.querySelector('input');
            let quantity = parseInt(input.value);
            quantity += e.currentTarget.classList.contains('plus') ? 1 : -1;
            if (quantity > 0) {
                input.value = quantity;
                debouncedUpdateQuantity(input.dataset.productId, quantity);
            }
        });
    });

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const quantity = Math.max(1, parseInt(e.currentTarget.value));
            e.currentTarget.value = quantity;
            debouncedUpdateQuantity(e.currentTarget.dataset.productId, quantity);
        });
    });
    
    const checkoutButton = document.getElementById('checkoutButton');
    if(checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            Utils.showToast('Tính năng thanh toán đang được phát triển.', 'info');
        });
    }
}

// =================================================================
// KHỞI CHẠY CHÍNH
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Khởi tạo các thành phần chung (luôn chạy)
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
        
        switch (path) {
            case 'index.html':
            case '':
                initIndexPage();
                break;
            case 'account.html':
                initAccountPage();
                break;
            case 'cart.html':
                await loadCartPage();
                break;
            case 'favorite.html':
                await loadFavoritesPage();
                break;
        }
    } catch (error) {
        console.error('Lỗi nghiêm trọng khi khởi tạo trang:', error);
        Utils.showToast('Có lỗi xảy ra khi khởi tạo trang web', 'error');
    }
});
