"use strict";

class AdminPanel {
    constructor() {
        this.products = [];
        this.editingProductId = null;

        // Sử dụng Data URI cho ảnh placeholder để không phụ thuộc vào mạng và tránh lỗi kết nối
        this.placeholderImg50 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpeGU9IjEwcHgiIGZpbGw9IiM5OTkiPk5vIEltZzwvdGV4dD48L3N2Zz4=';
        this.placeholderImg80Error = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpeGU9IjEycHgiIGZpbGw9IiM5OTkiPkxỗi+TảiẢnhPC90ZXh0Pjwvc3ZnPg==';

        this.cacheDOMElements();
    }

    cacheDOMElements() {
        this.loginScreen = document.getElementById('adminLoginScreen');
        this.dashboard = document.getElementById('adminDashboard');
        this.loginForm = document.getElementById('adminLoginForm');
        this.loginError = document.getElementById('loginError');
        this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
        this.logoutBtn = document.getElementById('adminLogoutBtn');
        this.form = document.getElementById('productForm');
        this.formTitle = document.getElementById('formTitle');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitBtnText = document.getElementById('submitBtnText');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.productListBody = document.getElementById('productList');
        this.imagesInput = document.getElementById('images');
        this.imagePreview = document.getElementById('imagePreview');
        this.featuresContainer = document.getElementById('featuresContainer');
        this.addFeatureBtn = document.getElementById('addFeatureBtn');
    }

    init() {
        this.bindEventListeners();
        if (window.currentUser && window.currentUser.role === 'admin') {
            this.showDashboard();
        } else {
            this.showLoginScreen();
        }
    }

    // Gán tất cả event listener một lần duy nhất để tránh rò rỉ bộ nhớ
    bindEventListeners() {
        this.loginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.productListBody.addEventListener('click', this.handleProductListClick.bind(this));
        this.cancelEditBtn.addEventListener('click', () => this.resetForm());
        this.imagesInput.addEventListener('input', this.renderImagePreviews.bind(this));
        this.addFeatureBtn.addEventListener('click', () => this.addFeatureInput());
        this.logoutBtn.addEventListener('click', () => window.logout());
    }
    
    showLoginScreen() {
        this.loginScreen.style.display = 'flex';
        this.dashboard.style.display = 'none';
        this.logoutBtn.style.display = 'none';
    }
    
    async showDashboard() {
        this.loginScreen.style.display = 'none';
        this.dashboard.style.display = 'block';
        this.logoutBtn.style.display = 'inline-flex';
        await this.fetchAndRenderProducts();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        this.loginError.textContent = '';
        this.toggleButtonLoading(this.loginSubmitBtn, true);

        const email = this.loginForm.querySelector('#adminEmail').value;
        const pass = this.loginForm.querySelector('#adminPass').value;

        try {
            const user = await window.authenticate(email, pass);
            if (user && user.role === 'admin') {
                window.Utils.showToast(`Chào mừng Admin ${this.escapeHTML(user.name)}!`, 'success');
                this.showDashboard();
            } else {
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

    async fetchAndRenderProducts() {
        this.productListBody.innerHTML = `<tr><td colspan="5" class="loading-spinner-container"><div class="spinner"></div></td></tr>`;
        try {
            const response = await window.callApi('/products');
            this.products = response.data.products;
            this.renderProductList();
        } catch (error) {
            this.productListBody.innerHTML = `<tr><td colspan="5" class="error-message">Lỗi khi tải danh sách sản phẩm. ${this.escapeHTML(error.message)}</td></tr>`;
        }
    }

    renderProductList() {
        if (!this.products || this.products.length === 0) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>`;
            return;
        }
        
        this.productListBody.innerHTML = this.products.map(p => {
            const imgSrc = p.images && p.images.length > 0 ? this.escapeHTML(p.images[0]) : this.placeholderImg50;
            const title = this.escapeHTML(p.title);
            return `
                <tr id="product-row-${p._id}">
                    <td><img src="${imgSrc}" alt="${title}" onerror="this.onerror=null;this.src='${this.placeholderImg50}';"></td>
                    <td>${title}</td>
                    <td>${window.Utils.formatPrice(p.price)}</td>
                    <td>${p.stock}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-warning" data-action="edit" data-id="${p._id}" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p._id}" title="Xóa"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const productData = this.getFormData();
        if (!productData) return;

        this.toggleButtonLoading(this.submitBtn, true);
        try {
            const endpoint = this.editingProductId ? `/products/${this.editingProductId}` : '/products';
            const method = this.editingProductId ? 'PATCH' : 'POST';
            
            await window.callApi(endpoint, method, productData);
            
            window.Utils.showToast(this.editingProductId ? 'Cập nhật thành công!' : 'Đăng sản phẩm thành công!', 'success');
            this.resetForm();
            await this.fetchAndRenderProducts();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Thao tác thất bại.';
            window.Utils.showToast(`Lỗi API: ${this.escapeHTML(errorMessage)}`, 'error');
        } finally {
            this.toggleButtonLoading(this.submitBtn, false);
        }
    }
    
    handleProductListClick(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const id = button.dataset.id;
        
        if (action === 'edit') this.populateFormForEdit(id);
        else if (action === 'delete') this.handleDelete(id, button);
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

    async handleDelete(id, button) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.')) return;
        
        this.toggleButtonLoading(button, true);
        try {
            await window.callApi(`/products/${id}`, 'DELETE');
            window.Utils.showToast('Đã xóa sản phẩm.', 'success');
            // Cải tiến: Chỉ xóa khỏi mảng và render lại khi API thành công
            this.products = this.products.filter(p => p._id !== id);
            this.renderProductList();
        } catch (error) {
            window.Utils.showToast(error.message || 'Xóa thất bại.', 'error');
            this.toggleButtonLoading(button, false);
        }
        // Không cần `finally` ở đây vì button sẽ bị xóa khỏi DOM sau khi render lại
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

        if (!data.title || isNaN(data.price) || isNaN(data.stock) || !data.description) {
            window.Utils.showToast('Vui lòng điền đầy đủ Tên, Giá, Tồn kho, và Mô tả ngắn.', 'error');
            return null;
        }
        
        if (data.images.length === 0) {
            window.Utils.showToast('Vui lòng cung cấp ít nhất một link hình ảnh.', 'error');
            return null;
        }
        for (const url of data.images) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                window.Utils.showToast(`Link ảnh "${this.escapeHTML(url.slice(0, 30))}..." không hợp lệ.`, 'error');
                return null;
            }
        }

        const MAX_INT_VALUE = 2147483647;
        if (data.price > MAX_INT_VALUE || (data.oldPrice && data.oldPrice > MAX_INT_VALUE) || data.stock > MAX_INT_VALUE) {
            window.Utils.showToast(`Giá hoặc tồn kho không được vượt quá ${MAX_INT_VALUE.toLocaleString('vi-VN')}.`, 'error');
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
            img.className = 'preview-img';

            const safeUrl = this.escapeHTML(url);
            if (url.startsWith('http://') || url.startsWith('https://')) {
                img.src = safeUrl;
                img.onerror = () => { 
                    img.src = this.placeholderImg80Error;
                    img.title = `Không thể tải ảnh từ: ${safeUrl}`;
                };
            } else {
                img.src = this.placeholderImg80Error;
                img.title = `Link không hợp lệ: ${safeUrl}`;
            }
            
            imgWrapper.appendChild(img);
            this.imagePreview.appendChild(imgWrapper);
        });
    }

    addFeatureInput(value = '') {
        const div = document.createElement('div');
        div.className = 'feature-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.value = this.escapeHTML(value);
        input.placeholder = 'VD: Thân thiện với người dùng';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-danger';
        button.title = 'Xóa tính năng';
        button.innerHTML = '<i class="fas fa-times"></i>';
        button.addEventListener('click', () => div.remove());

        div.appendChild(input);
        div.appendChild(button);
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
        if (!button) return;
        const icon = button.querySelector('i');
        if (icon) icon.style.display = isLoading ? 'none' : '';
        
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
        // Thêm spinner vào nếu chưa có
        let spinner = button.querySelector('.spinner');
        if (isLoading && !spinner) {
            spinner = document.createElement('div');
            spinner.className = 'spinner';
            button.prepend(spinner);
        }
        if (spinner) {
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        }
    }

    // Tiện ích chống XSS
    escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Không cần setTimeout, khởi tạo ngay khi DOM sẵn sàng
    const adminPanel = new AdminPanel();
    adminPanel.init();
});
