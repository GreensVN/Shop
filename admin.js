"use strict";

class AdminPanel {
    constructor() {
        this.products = [];
        this.editingProductId = null;
        
        this.cacheDOMElements();
    }

    cacheDOMElements() {
        // Screens
        this.loginScreen = document.getElementById('adminLoginScreen');
        this.dashboard = document.getElementById('adminDashboard');
        
        // Login elements
        this.loginForm = document.getElementById('adminLoginForm');
        this.loginError = document.getElementById('loginError');
        this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
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
        if (window.currentUser && window.currentUser.role === 'admin') {
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
        this.cancelEditBtn.addEventListener('click', () => this.resetForm());
        this.imagesInput.addEventListener('input', this.renderImagePreviews.bind(this));
        this.addFeatureBtn.addEventListener('click', () => this.addFeatureInput());
        this.logoutBtn.addEventListener('click', () => window.logout());
    }

    // =======================================================
    // HÀM ĐĂNG NHẬP ĐƯỢC TỐI ƯU HÓA
    // =======================================================
    async handleAdminLogin(e) {
        e.preventDefault();
        this.loginError.textContent = '';
        this.toggleButtonLoading(this.loginSubmitBtn, true);

        const email = this.loginForm.querySelector('#adminEmail').value;
        const pass = this.loginForm.querySelector('#adminPass').value;

        try {
            const user = await window.authenticate(email, pass);
            
            if (user && user.role === 'admin') {
                window.Utils.showToast(`Chào mừng Admin ${user.name}!`, 'success');
                this.showDashboard();
            } else {
                // Đăng xuất "thầm lặng" mà không hỏi người dùng.
                // Vì họ đăng nhập thành công nhưng không có quyền.
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.currentUser = null;
                this.loginError.textContent = 'Tài khoản không có quyền truy cập Admin.';
            }
        } catch (error) {
            this.loginError.textContent = error.message || 'Email hoặc mật khẩu không đúng.';
        } finally {
            this.toggleButtonLoading(this.loginSubmitBtn, false);
        }
    }
    // =======================================================

    async fetchAndRenderProducts() {
        this.productListBody.innerHTML = `<tr><td colspan="5" class="loading-spinner-container"><div class="spinner" style="display:inline-block; border-top-color: var(--primary-color);"></div></td></tr>`;
        try {
            const response = await window.callApi('/products');
            this.products = response.data.products;
            this.renderProductList();
        } catch (error) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Lỗi khi tải danh sách sản phẩm. ${error.message}</td></tr>`;
        }
    }

    renderProductList() {
        if (!this.products || this.products.length === 0) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>`;
            return;
        }
        
        this.productListBody.innerHTML = this.products.map(p => `
            <tr id="product-row-${p._id}">
                <td><img src="${p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/50'}" alt="${p.title}"></td>
                <td>${p.title}</td>
                <td>${window.Utils.formatPrice(p.price)}</td>
                <td>${p.stock}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning" data-action="edit" data-id="${p._id}" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p._id}" title="Xóa"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.toggleButtonLoading(this.submitBtn, true);

        const productData = this.getFormData();
        if (!productData) {
            this.toggleButtonLoading(this.submitBtn, false);
            return;
        }

        try {
            const endpoint = this.editingProductId ? `/products/${this.editingProductId}` : '/products';
            const method = this.editingProductId ? 'PATCH' : 'POST';
            
            await window.callApi(endpoint, method, productData);
            
            window.Utils.showToast(this.editingProductId ? 'Cập nhật thành công!' : 'Đăng sản phẩm thành công!', 'success');
            this.resetForm();
            await this.fetchAndRenderProducts();
        } catch (error) {
            window.Utils.showToast(error.message || 'Thao tác thất bại.', 'error');
        } finally {
            this.toggleButtonLoading(this.submitBtn, false);
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

        this.resetForm();
        this.editingProductId = id;
        
        this.form.querySelector('#title').value = product.title || '';
        this.form.querySelector('#category').value = product.category || '';
        this.form.querySelector('#price').value = product.price || 0;
        this.form.querySelector('#oldPrice').value = product.oldPrice || '';
        this.form.querySelector('#stock').value = product.stock || 0;
        this.form.querySelector('#badge').value = product.badge || '';
        this.imagesInput.value = (product.images || []).join(', ');
        this.form.querySelector('#description').value = product.description || '';
        this.form.querySelector('#detailedDescription').value = product.detailedDescription || '';
        (product.features || []).forEach(feature => this.addFeatureInput(feature));
        
        this.renderImagePreviews();

        this.formTitle.innerHTML = `<i class="fas fa-edit"></i> Chỉnh sửa sản phẩm`;
        this.submitBtnText.textContent = 'Lưu thay đổi';
        this.cancelEditBtn.style.display = 'inline-flex';
        document.getElementById(`product-row-${id}`).classList.add('editing');
        
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    async handleDelete(id) {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.')) {
            try {
                await window.callApi(`/products/${id}`, 'DELETE');
                window.Utils.showToast('Đã xóa sản phẩm.', 'success');
                this.products = this.products.filter(p => p._id !== id);
                this.renderProductList();
            } catch (error) {
                window.Utils.showToast(error.message || 'Xóa thất bại.', 'error');
            }
        }
    }

    getFormData() {
        const data = {
            title: this.form.querySelector('#title').value.trim(),
            category: this.form.querySelector('#category').value.trim(),
            price: parseInt(this.form.querySelector('#price').value, 10),
            stock: parseInt(this.form.querySelector('#stock').value, 10),
            description: this.form.querySelector('#description').value.trim(),
            images: this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean),
            detailedDescription: this.form.querySelector('#detailedDescription').value.trim(),
            features: Array.from(this.featuresContainer.querySelectorAll('input')).map(input => input.value.trim()).filter(Boolean),
        };
        
        const oldPrice = this.form.querySelector('#oldPrice').value;
        if (oldPrice) data.oldPrice = parseInt(oldPrice, 10);
        
        const badge = this.form.querySelector('#badge').value.trim();
        if (badge) data.badge = badge.toUpperCase();

        if (!data.title || isNaN(data.price) || isNaN(data.stock)) {
            window.Utils.showToast('Vui lòng điền các trường bắt buộc: Tên, Giá, Tồn kho.', 'error');
            return null;
        }
        return data;
    }

    renderImagePreviews() {
        this.imagePreview.innerHTML = '';
        const urls = this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean);
        urls.forEach(url => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'preview-img-wrapper';
            const img = document.createElement('img');
            img.src = url;
            img.className = 'preview-img';
            img.onerror = () => { img.src = 'https://via.placeholder.com/80?text=Lỗi' };
            imgWrapper.appendChild(img);
            this.imagePreview.appendChild(imgWrapper);
        });
    }

    addFeatureInput(value = '') {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.innerHTML = `
            <input type="text" class="form-control" value="${value}" placeholder="VD: Thân thiện với người dùng">
            <button type="button" class="btn btn-sm btn-danger" title="Xóa tính năng"><i class="fas fa-times"></i></button>
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

    toggleButtonLoading(button, isLoading) {
        if(!button) return;
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
        const spinner = button.querySelector('.spinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const adminPanel = new AdminPanel();
        adminPanel.init();
    }, 100); 
});
