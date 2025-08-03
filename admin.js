"use strict";

class AdminPanel {
    constructor() {
        this.products = [];
        this.editingProductId = null;
        
        // --- !!! CẢNH BÁO BẢO MẬT !!! ---
        // KHÔNG BAO GIỜ sử dụng mật khẩu cố định trong code cho môi trường thực tế.
        // Đây chỉ là VÍ DỤ cho môi trường phát triển.
        this.ADMIN_USER = 'admin';
        this.ADMIN_PASS = '123456';

        this.cacheDOMElements();
    }

    cacheDOMElements() {
        // Screens
        this.loginScreen = document.getElementById('adminLoginScreen');
        this.dashboard = document.getElementById('adminDashboard');
        
        // Login elements
        this.loginForm = document.getElementById('adminLoginForm');
        this.loginError = document.getElementById('loginError');
        this.logoutBtn = document.getElementById('adminLogoutBtn');

        // Main form elements
        this.form = document.getElementById('productForm');
        this.formTitle = document.getElementById('formTitle');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitBtnText = document.getElementById('submitBtnText');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        
        // Product list
        this.productListBody = document.getElementById('productList');
        
        // Dynamic fields
        this.imagesInput = document.getElementById('images');
        this.imagePreview = document.getElementById('imagePreview');
        this.featuresContainer = document.getElementById('featuresContainer');
        this.addFeatureBtn = document.getElementById('addFeatureBtn');
    }

    init() {
        if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
            this.showDashboard();
        } else {
            this.showLoginScreen();
        }
    }
    
    showLoginScreen() {
        this.loginScreen.style.display = 'flex';
        this.dashboard.style.display = 'none';
        this.logoutBtn.style.display = 'none';
        this.loginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
    }
    
    async showDashboard() {
        this.loginScreen.style.display = 'none';
        this.dashboard.style.display = 'block';
        this.logoutBtn.style.display = 'inline-flex';
        
        this.setupDashboardEventListeners();
        await this.fetchAndRenderProducts();
    }
    
    setupDashboardEventListeners() {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.productListBody.addEventListener('click', this.handleProductListClick.bind(this));
        this.cancelEditBtn.addEventListener('click', this.resetForm.bind(this));
        this.imagesInput.addEventListener('input', this.renderImagePreviews.bind(this));
        this.addFeatureBtn.addEventListener('click', () => this.addFeatureInput());
        this.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    handleAdminLogin(e) {
        e.preventDefault();
        const user = this.loginForm.querySelector('#adminUser').value;
        const pass = this.loginForm.querySelector('#adminPass').value;

        if (user === this.ADMIN_USER && pass === this.ADMIN_PASS) {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            this.showDashboard();
        } else {
            this.loginError.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        }
    }
    
    handleLogout() {
        sessionStorage.removeItem('isAdminAuthenticated');
        location.reload();
    }

    async fetchAndRenderProducts() {
        this.productListBody.innerHTML = `<tr><td colspan="5" class="loading-spinner-container"><div class="spinner" style="display:inline-block; border-top-color: var(--primary-color);"></div></td></tr>`;
        try {
            const response = await this.callAdminApi('/products');
            this.products = response.data.products;
            this.renderProductList();
        } catch (error) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Lỗi khi tải danh sách sản phẩm.</td></tr>`;
        }
    }

    renderProductList() {
        if (this.products.length === 0) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>`;
            return;
        }
        
        this.productListBody.innerHTML = this.products.map(p => `
            <tr id="product-row-${p._id}">
                <td><img src="${p.images[0] || 'https://via.placeholder.com/50'}" alt="${p.title}"></td>
                <td>${p.title}</td>
                <td>${window.Utils.formatPrice(p.price)}đ</td>
                <td>${p.stock}</td>
                <td class="actions" style="text-align: right;">
                    <button class="btn btn-sm btn-warning" data-action="edit" data-id="${p._id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p._id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.toggleLoading(true);

        const productData = this.getFormData();
        if (!productData) {
            this.toggleLoading(false);
            return;
        }

        try {
            const endpoint = this.editingProductId ? `/products/${this.editingProductId}` : '/products';
            const method = this.editingProductId ? 'PATCH' : 'POST';
            
            await this.callAdminApi(endpoint, method, productData);
            
            window.Utils.showToast(this.editingProductId ? 'Cập nhật thành công!' : 'Đăng sản phẩm thành công!', 'success');
            this.resetForm();
            await this.fetchAndRenderProducts();
        } catch (error) {
            window.Utils.showToast(error.message || 'Thao tác thất bại.', 'error');
        } finally {
            this.toggleLoading(false);
        }
    }
    
    handleProductListClick(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const action = button.dataset.action;
        const id = button.dataset.id;
        
        if (action === 'edit') this.populateFormForEdit(id);
        else if (action === 'delete') this.handleDelete(id);
    }

    populateFormForEdit(id) {
        const product = this.products.find(p => p._id === id);
        if (!product) return;

        this.resetForm(); // Reset previous states
        this.editingProductId = id;
        
        // Fill form
        this.form.querySelector('#title').value = product.title;
        // ... (fill other fields similarly)
        this.form.querySelector('#category').value = product.category || '';
        this.form.querySelector('#price').value = product.price;
        this.form.querySelector('#oldPrice').value = product.oldPrice || '';
        this.form.querySelector('#stock').value = product.stock;
        this.form.querySelector('#badge').value = product.badge || '';
        this.imagesInput.value = (product.images || []).join(', ');
        this.form.querySelector('#description').value = product.description || '';
        this.form.querySelector('#detailedDescription').value = product.detailedDescription || '';
        (product.features || []).forEach(feature => this.addFeatureInput(feature));
        
        this.renderImagePreviews();

        // Update UI
        this.formTitle.innerHTML = `<i class="fas fa-edit"></i> Chỉnh sửa sản phẩm`;
        this.submitBtnText.textContent = 'Lưu thay đổi';
        this.cancelEditBtn.style.display = 'inline-flex';
        document.getElementById(`product-row-${id}`).classList.add('editing');
        
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    async handleDelete(id) {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await this.callAdminApi(`/products/${id}`, 'DELETE');
                window.Utils.showToast('Đã xóa sản phẩm.', 'success');
                await this.fetchAndRenderProducts();
            } catch (error) {
                window.Utils.showToast(error.message || 'Xóa thất bại.', 'error');
            }
        }
    }

    getFormData() {
        const data = {
            title: this.form.querySelector('#title').value.trim(),
            category: this.form.querySelector('#category').value.trim(),
            price: parseInt(this.form.querySelector('#price').value),
            stock: parseInt(this.form.querySelector('#stock').value),
            description: this.form.querySelector('#description').value.trim(),
            images: this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean),
            detailedDescription: this.form.querySelector('#detailedDescription').value.trim(),
            features: Array.from(this.featuresContainer.querySelectorAll('input')).map(input => input.value.trim()).filter(Boolean),
        };
        
        const oldPrice = this.form.querySelector('#oldPrice').value;
        if (oldPrice) data.oldPrice = parseInt(oldPrice);
        
        const badge = this.form.querySelector('#badge').value.trim();
        if (badge) data.badge = badge.toUpperCase();

        if (!data.title || !data.price || !data.stock) {
            window.Utils.showToast('Vui lòng điền các trường bắt buộc: Tên, Giá, Tồn kho.', 'error');
            return null;
        }
        return data;
    }

    renderImagePreviews() {
        this.imagePreview.innerHTML = '';
        const urls = this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean);
        urls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'preview-img';
            img.onerror = () => { img.src = 'https://via.placeholder.com/80?text=Lỗi' };
            this.imagePreview.appendChild(img);
        });
    }

    addFeatureInput(value = '') {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.innerHTML = `
            <input type="text" value="${value}" placeholder="VD: Thân thiện với người">
            <button type="button" class="btn btn-sm btn-danger"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('button').addEventListener('click', () => div.remove());
        this.featuresContainer.appendChild(div);
    }
    
    resetForm() {
        if (this.editingProductId) {
            const row = document.getElementById(`product-row-${this.editingProductId}`);
            if (row) row.classList.remove('editing');
        }
        
        this.editingProductId = null;
        this.form.reset();
        this.featuresContainer.innerHTML = '';
        this.imagePreview.innerHTML = '';
        
        this.formTitle.innerHTML = `<i class="fas fa-plus-circle"></i> Đăng sản phẩm mới`;
        this.submitBtnText.textContent = 'Đăng sản phẩm';
        this.cancelEditBtn.style.display = 'none';
    }

    toggleLoading(isLoading) {
        this.submitBtn.classList.toggle('loading', isLoading);
        this.submitBtn.disabled = isLoading;
    }

    async callAdminApi(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        
        // Gửi thông tin xác thực admin qua header
        // Backend cần được cấu hình để đọc và xác minh các header này
        headers['X-Admin-User'] = this.ADMIN_USER;
        headers['X-Admin-Pass'] = this.ADMIN_PASS;

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            if (response.status === 204) return { status: 'success' };
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Có lỗi từ máy chủ.');
            }
            return data;
        } catch (error) {
            console.error(`Admin API Error on ${endpoint}:`, error);
            throw error;
        }
    }
}

// Initialize and run the admin panel logic
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    adminPanel.init();
});