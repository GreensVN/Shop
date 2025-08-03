// main.js (Hoàn thiện & Tương thích)
// Tệp "bộ não" trung tâm cho toàn bộ trang web Shop Grow A Garden

// =================================================================
// CÀI ĐẶT & BIẾN TOÀN CỤC
// =================================================================

const API_BASE_URL = 'https://shop-4mlk.onrender.com/api/v1';

let currentUser = null;
let userBalance = 0;

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
            <div class="toast-message">
                <i class="fas ${iconClass}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">×</button>
        `;

        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 100);

        const close = () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        };
        
        const timer = setTimeout(close, duration);
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            close();
        });
    }

    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
        return container;
    }

    static showLoading(text = 'Đang xử lý...') {
        document.getElementById('loadingOverlay')?.classList.add('show');
    }

    static hideLoading() {
        document.getElementById('loadingOverlay')?.classList.remove('show');
    }

    static validateInput(input, message, pattern) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup ? formGroup.querySelector('.error-message') : null;

        if (!input.value.trim() || (pattern && !pattern.test(input.value.trim()))) {
            if (formGroup && errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                formGroup.classList.add('has-error');
            }
            return false;
        }

        if (formGroup && errorElement) {
            errorElement.style.display = 'none';
            formGroup.classList.remove('has-error');
        }
        return true;
    }
}

// =================================================================
// GỌI API & MÔ PHỎNG DỮ LIỆU
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
            body: body ? JSON.stringify(body) : null,
            credentials: 'include'
        });

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

// Mô phỏng dữ liệu giỏ hàng & yêu thích bằng localStorage
const CartManager = {
    async get() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },
    async add(productId, quantity = 1) {
        let cart = await this.get();
        const existingItem = cart.find(item => item.product._id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            // Trong ứng dụng thực tế, bạn sẽ gọi API để lấy thông tin sản phẩm
            // Ở đây, chúng ta tạo một sản phẩm giả
            const product = { _id: productId, title: `Sản phẩm ${productId}`, price: Math.floor(Math.random() * 500000), images: ['https://via.placeholder.com/100'] };
            cart.push({ product, quantity });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartCount();
    },
    async remove(productId) {
        let cart = await this.get();
        cart = cart.filter(item => item.product._id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartCount();
        if (typeof loadCart === 'function') loadCart(); // Tải lại giỏ hàng nếu ở trang giỏ hàng
    },
    async updateQuantity(productId, quantity) {
        let cart = await this.get();
        const item = cart.find(item => item.product._id === productId);
        if (item) {
            item.quantity = quantity;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartCount();
        if (typeof loadCart === 'function') loadCart(); // Tải lại giỏ hàng
    },
    async clear() {
        localStorage.removeItem('cart');
        await updateCartCount();
    }
};

const FavoriteManager = {
    async get() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    },
    async add(product) {
        let favorites = await this.get();
        if (!favorites.find(p => p._id === product._id)) {
            favorites.push(product);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    },
    async remove(productId) {
        let favorites = await this.get();
        favorites = favorites.filter(p => p._id !== productId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
         if (typeof loadFavorites === 'function') loadFavorites(); // Tải lại nếu ở trang yêu thích
    },
    async isFavorite(productId) {
        let favorites = await this.get();
        return favorites.some(p => p._id === productId);
    }
};


// =================================================================
// XÁC THỰC NGƯỜI DÙNG
// =================================================================

async function authenticate(email, password) {
    Utils.showLoading('Đang đăng nhập...');
    try {
        const data = await callApi('/users/login', 'POST', { email, password });
        localStorage.setItem('token', data.token);
        currentUser = data.data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        await updateUIAfterLogin();
        return currentUser;
    } catch (error) {
        throw error;
    } finally {
        Utils.hideLoading();
    }
}

async function register(name, email, password, passwordConfirm) {
    Utils.showLoading('Đang tạo tài khoản...');
    try {
        const data = await callApi('/users/signup', 'POST', { name, email, password, passwordConfirm });
        localStorage.setItem('token', data.token);
        currentUser = data.data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        await updateUIAfterLogin();
        return currentUser;
    } catch (error) {
        throw error;
    } finally {
        Utils.hideLoading();
    }
}

function logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userBalance');
    localStorage.removeItem('rememberMe');
    
    currentUser = null;
    updateUIAfterLogout();
    Utils.showToast('Đăng xuất thành công!', 'success');

    // Nếu đang ở trang tài khoản, chuyển về trang chủ
    if (window.location.pathname.includes('account.html')) {
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

async function checkAutoLogin() {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    if (token && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            // Có thể thêm một lệnh gọi API nhẹ để xác thực token ở đây
            // Ví dụ: await callApi('/users/me');
            await updateUIAfterLogin();
        } catch (error) {
            console.error('Auto-login failed:', error);
            logout(); // Đăng xuất nếu token hoặc dữ liệu không hợp lệ
        }
    }
}


// =================================================================
// CẬP NHẬT GIAO DIỆN NGƯỜI DÙNG (UI)
// =================================================================

async function updateUIAfterLogin() {
    if (!currentUser) return;
    
    // Ẩn nút đăng nhập, hiện dropdown người dùng
    document.getElementById('loginButton')?.setAttribute('style', 'display: none !important');
    document.getElementById('userDropdown')?.setAttribute('style', 'display: flex !important');
    
    // Cập nhật tên và avatar
    const firstLetter = currentUser.name.charAt(0).toUpperCase();
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser.name);
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = firstLetter);

    // Cập nhật số lượng giỏ hàng
    await updateCartCount();
}

function updateUIAfterLogout() {
    document.getElementById('loginButton')?.removeAttribute('style');
    document.getElementById('userDropdown')?.removeAttribute('style');

    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = '0';
        el.style.display = 'none';
    });
}

async function updateCartCount() {
    const cart = await CartManager.get();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// =================================================================
// LOGIC MODAL XÁC THỰC
// =================================================================

function initAuthModal() {
    const authModal = document.getElementById('authModal');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const loginButton = document.getElementById('loginButton');
    const closeModalButtons = document.querySelectorAll('.modal-close');

    if (!authModal || !loginButton) return;

    const showModal = (modal) => {
        if(modal) modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };
    
    const hideModal = (modal) => {
        if(modal) modal.classList.remove('show');
        document.body.style.overflow = '';
    };

    loginButton.addEventListener('click', () => showModal(authModal));
    closeModalButtons.forEach(btn => btn.addEventListener('click', () => {
        hideModal(authModal);
        hideModal(forgotModal);
    }));

    // Chuyển tab trong modal
    const tabs = authModal.querySelectorAll('.modal-tab');
    const forms = authModal.querySelectorAll('.modal-form');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            forms.forEach(f => {
                f.classList.toggle('active', f.id === `${tabName}Form`);
            });
        });
    });

    // Chuyển form
    document.querySelector('.switch-to-register')?.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.modal-tab[data-tab="register"]')?.click();
    });
    document.querySelectorAll('.switch-to-login').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            hideModal(forgotModal);
            showModal(authModal);
            document.querySelector('.modal-tab[data-tab="login"]')?.click();
        });
    });
    
    // Form handlers
    handleLoginForm();
    handleRegisterForm();
    handleForgotPasswordForm();
}

function handleLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.email.value;
        const password = form.password.value;
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        try {
            const user = await authenticate(email, password);
            Utils.showToast(`Chào mừng ${user.name} trở lại!`, 'success');
            form.closest('.modal')?.classList.remove('show');
            document.body.style.overflow = '';
        } catch (error) {
            Utils.showToast(error.message || 'Email hoặc mật khẩu không đúng', 'error');
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
}

function handleRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (password !== confirmPassword) {
            Utils.showToast('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.classList.add('loading');

        try {
            const user = await register(name, email, password, confirmPassword);
            Utils.showToast(`Đăng ký thành công! Chào mừng ${user.name}!`, 'success');
            form.closest('.modal')?.classList.remove('show');
            document.body.style.overflow = '';
        } catch (error) {
            Utils.showToast(error.message || 'Đăng ký thất bại, vui lòng thử lại.', 'error');
        } finally {
             submitBtn.classList.remove('loading');
        }
    });
}

function handleForgotPasswordForm() {
    const form = document.getElementById('forgotPasswordForm');
     if (!form) return;
     form.addEventListener('submit', e => {
         e.preventDefault();
         Utils.showToast('Tính năng này đang được phát triển.', 'info');
     });
}


// =================================================================
// LOGIC RIÊNG CHO TỪNG TRANG
// =================================================================

// --- Trang chủ (index.html) ---
function initIndexPage() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    const localSampleProducts = [
        { _id: '001', title: "Raccoon", description: "Thú cưng gấu mèo dễ thương...", price: 250000, images: ["https://i.imgur.com/ZoX9VKo.png"], note: 'thú cưng dễ thương' },
        { _id: '002', title: "Mimic Octopus", description: "Bạch tuộc mimic độc đáo...", price: 70000, images: ["https://i.imgur.com/8pYhB3m.png"], note: 'thú cưng biển độc đáo' }
    ];

    function renderProducts(products) {
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product._id}" data-price="${product.price}" data-note="${product.note || ''}">
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
                    <div class="product-overlay">
                         <button class="btn-favorite" title="Thêm vào yêu thích" data-id="${product._id}"><i class="far fa-heart"></i></button>
                         <a href="product.html?id=${product._id}" class="btn-view" title="Xem chi tiết"><i class="fas fa-eye"></i></a>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${Utils.formatPrice(product.price)}đ</div>
                    <div class="product-id">ID: #${product._id}</div>
                    <button class="btn btn-primary add-to-cart" data-id="${product._id}">
                        <i class="fas fa-shopping-cart"></i><span>Mua Ngay</span>
                    </button>
                </div>
            </div>
        `).join('');
        attachProductEventListeners();
    }
    
    function attachProductEventListeners() {
        document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', e => {
            const id = e.currentTarget.dataset.id;
            CartManager.add(id);
            Utils.showToast('Đã thêm vào giỏ hàng!', 'success');
        }));
        document.querySelectorAll('.btn-favorite').forEach(btn => btn.addEventListener('click', async e => {
            const id = e.currentTarget.dataset.id;
            const isFav = await FavoriteManager.isFavorite(id);
            const product = localSampleProducts.find(p => p._id === id);

            if (isFav) {
                await FavoriteManager.remove(id);
                Utils.showToast('Đã xóa khỏi yêu thích.', 'info');
                e.currentTarget.classList.remove('active');
                 e.currentTarget.querySelector('i').classList.replace('fas', 'far');
            } else {
                await FavoriteManager.add(product);
                Utils.showToast('Đã thêm vào yêu thích!', 'success');
                e.currentTarget.classList.add('active');
                e.currentTarget.querySelector('i').classList.replace('far', 'fas');
            }
        }));
    }

    // Lọc sản phẩm
    document.getElementById('filterButton')?.addEventListener('click', () => {
        const id = document.getElementById('searchId').value.toLowerCase();
        const priceRange = document.getElementById('searchPrice').value;
        const note = document.getElementById('searchNote').value.toLowerCase();
        
        document.querySelectorAll('.product-card').forEach(card => {
            const cardId = card.dataset.id.toLowerCase();
            const cardPrice = parseInt(card.dataset.price);
            const cardNote = card.dataset.note.toLowerCase();

            let isVisible = true;
            if (id && !cardId.includes(id)) isVisible = false;
            if (note && !cardNote.includes(note)) isVisible = false;
            if (priceRange) {
                const [min, max] = {
                    'duoi-50k': [0, 49999],
                    'tu-50k-200k': [50000, 200000],
                    'tu-200k-500k': [200001, 500000],
                    'tu-500k-1-trieu': [500001, 1000000],
                    'tren-1-trieu': [1000001, Infinity]
                }[priceRange] || [0, Infinity];
                if (cardPrice < min || cardPrice > max) isVisible = false;
            }
            card.style.display = isVisible ? 'block' : 'none';
        });
    });

    document.getElementById('resetButton')?.addEventListener('click', () => {
        document.getElementById('searchId').value = '';
        document.getElementById('searchPrice').value = '';
        document.getElementById('searchNote').value = '';
        document.querySelectorAll('.product-card').forEach(card => card.style.display = 'block');
    });

    renderProducts(localSampleProducts);
}

// --- Trang tài khoản (account.html) ---
function initAccountPage() {
    const accountLayout = document.getElementById('accountLayout');
    const loginPrompt = document.getElementById('loginPrompt');
    if (!accountLayout) return;

    if (!currentUser) {
        accountLayout.style.display = 'none';
        loginPrompt.style.display = 'block';
        return;
    }
    
    accountLayout.style.display = 'grid';
    loginPrompt.style.display = 'none';

    // Đổ dữ liệu người dùng
    document.getElementById('accountName').textContent = currentUser.name;
    document.getElementById('accountId').textContent = `ID: ${currentUser._id.slice(-6)}`;
    document.getElementById('accountAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('userFullName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userRegisterDate').textContent = Utils.formatDate(currentUser.createdAt);
    document.getElementById('userAccountId').textContent = currentUser._id;
    document.getElementById('balanceAmount').textContent = `${Utils.formatPrice(userBalance)}đ`;
    
    // Xử lý chuyển tab
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.tab-content');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            tabs.forEach(t => t.classList.toggle('active', t.id === `${tabId}Tab`));
        });
    });
    
    // Gắn sự kiện cho các nút
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', logout);
    document.getElementById('depositBtn')?.addEventListener('click', () => showModal('depositModal'));
    document.getElementById('withdrawBtn')?.addEventListener('click', () => showModal('withdrawModal'));
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => showModal('changePasswordModal'));
    document.getElementById('toggle2faBtn')?.addEventListener('click', () => Utils.showToast('Tính năng đang phát triển', 'info'));
    document.getElementById('manageDevicesBtn')?.addEventListener('click', () => showModal('deviceManagerModal'));

    // Xử lý các form trong modal
    const depositForm = document.getElementById('depositForm');
    if(depositForm) {
        depositForm.addEventListener('submit', e => {
            e.preventDefault();
            Utils.showToast('Tính năng nạp tiền đang được phát triển.', 'info');
        });
    }

    const withdrawForm = document.getElementById('withdrawForm');
    if(withdrawForm) {
        withdrawForm.addEventListener('submit', e => {
            e.preventDefault();
            Utils.showToast('Tính năng rút tiền đang được phát triển.', 'info');
        });
    }
}

// --- Trang giỏ hàng (cart.html) ---
async function loadCart() {
    const cartItemsElement = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');

    if (!cartItemsElement) return;

    const cart = await CartManager.get();
    if (cart.length === 0) {
        cartItemsElement.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <a href="index.html" class="btn btn-primary">Tiếp tục mua sắm</a>
            </div>`;
        subtotalElement.textContent = '0đ';
        totalElement.textContent = '0đ';
        return;
    }

    let subtotal = 0;
    cartItemsElement.innerHTML = cart.map(item => {
        const totalPrice = item.product.price * item.quantity;
        subtotal += totalPrice;
        return `
            <div class="cart-item" data-id="${item.product._id}">
                <img src="${item.product.images[0]}" alt="${item.product.title}">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.product.title}</h3>
                    <div class="cart-item-price">${Utils.formatPrice(item.product.price)}đ</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="btn-quantity minus" data-id="${item.product._id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.product._id}">
                    <button class="btn-quantity plus" data-id="${item.product._id}">+</button>
                </div>
                <div class="cart-item-total">${Utils.formatPrice(totalPrice)}đ</div>
                <button class="btn-remove" data-id="${item.product._id}"><i class="fas fa-trash"></i></button>
            </div>`;
    }).join('');
    
    subtotalElement.textContent = `${Utils.formatPrice(subtotal)}đ`;
    totalElement.textContent = `${Utils.formatPrice(subtotal)}đ`;

    // Gắn sự kiện cho các nút trong giỏ hàng
    document.querySelectorAll('.btn-remove').forEach(btn => btn.addEventListener('click', e => CartManager.remove(e.currentTarget.dataset.id)));
    document.querySelectorAll('.plus').forEach(btn => btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        const input = e.currentTarget.previousElementSibling;
        const newQuantity = parseInt(input.value) + 1;
        CartManager.updateQuantity(id, newQuantity);
    }));
    document.querySelectorAll('.minus').forEach(btn => btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        const input = e.currentTarget.nextElementSibling;
        const newQuantity = Math.max(1, parseInt(input.value) - 1);
        CartManager.updateQuantity(id, newQuantity);
    }));
}

// --- Trang yêu thích (favorite.html) ---
async function loadFavorites() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (!favoritesGrid) return;
    
    const favorites = await FavoriteManager.get();
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-heart"></i>
                <h3>Chưa có sản phẩm yêu thích</h3>
                <a href="index.html" class="btn btn-primary">Khám phá sản phẩm</a>
            </div>`;
        return;
    }

    favoritesGrid.innerHTML = favorites.map(product => `
        <div class="product-card">
            <div class="product-image"><img src="${product.images[0]}" alt="${product.title}"></div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">${Utils.formatPrice(product.price)}đ</div>
            </div>
            <div class="product-actions">
                <button class="btn btn-outline add-to-cart" data-id="${product._id}"><i class="fas fa-shopping-cart"></i></button>
                <button class="btn btn-icon favorite-btn active" data-id="${product._id}"><i class="fas fa-heart"></i></button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.favorite-btn').forEach(btn => btn.addEventListener('click', e => FavoriteManager.remove(e.currentTarget.dataset.id)));
    document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', e => {
        CartManager.add(e.currentTarget.dataset.id);
        Utils.showToast('Đã thêm vào giỏ hàng!', 'success');
    }));
}


// =================================================================
// KHỞI CHẠY CHÍNH
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo các thành phần chung
    initAuthModal();
    const logoutButtons = document.querySelectorAll('#logoutButton, #sidebarLogoutBtn');
    logoutButtons.forEach(btn => btn?.addEventListener('click', logout));
    
    // 2. Kiểm tra đăng nhập
    await checkAutoLogin();

    // 3. Chạy logic cho trang cụ thể
    const path = window.location.pathname.split("/").pop();
    if (path === 'index.html' || path === '') {
        initIndexPage();
    } else if (path === 'account.html') {
        initAccountPage();
    } else if (path === 'cart.html') {
        await loadCart();
        document.getElementById('checkoutButton')?.addEventListener('click', () => Utils.showToast('Tính năng đang phát triển', 'info'));
    } else if (path === 'favorite.html') {
        await loadFavorites();
    } else if (path === 'product.html') {
        // Logic cho trang sản phẩm đã nằm trong file product.html
    }
});```
