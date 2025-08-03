"use strict";

class';
        if (this.logoutBtn) this.logoutBtn.style.display = 'inline-flex';
        await this.fetchAndRenderProducts();
    }

    async handleAdminLogin(e) {
 AdminPanel {
    constructor() {
        // Mảng state để lưu trữ danh sách sản phẩm, là nguồn dữ liệu chính (source of truth).
        this.products = [];
        this.editingProductId = null;

        // Sử dụng Data URI cho ảnh placeholder để không phụ thuộc vào mạng và tránh lỗi kết nối.
        this.placeholderImg        e.preventDefault();
        if (this.loginError) this.loginError.textContent = '';
        this.toggleButtonLoading(this.loginSubmitBtn, true);

        const email = this.loginForm.50 = 'data:image/svg+xml;base64,PHN2ZyB3aWRquerySelector('#adminEmail').value;
        const pass = this.loginForm.querySelector('#adminPass').value;0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPS

        try {
            const user = await window.authenticate?.(email, pass);
            if (user?.role === 'admin') {
                window.Utils?.showToast(`Chào mừng Admin ${this.escapeHTML(user.name)}JodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2!`, 'success');
                this.showDashboard();
            } else {
                localStorage.removeItem('tokenZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9');
                localStorage.removeItem('currentUser');
                window.currentUser = null;
                if (this.loginIjUwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lError) this.loginError.textContent = 'Tài khoản không có quyền truy cập Admin.';
            }
        } catch (error) {
            if (this.loginError) this.loginError.textContent = error.message || 'EmailPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250 hoặc mật khẩu không đúng.';
        } finally {
            this.toggleButtonLoading(this.loginSubmitBtnLXNpeGU9IjEwcHgiIGZpbGw9IiM5OTkiPk5vIEltZ, false);
        }
    }

    async fetchAndRenderProducts() {
        this.productListBodyzwvdGV4dD48L3N2Zz4=';
        this.placeholderImg80Error = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD.innerHTML = `<tr><td colspan="5" class="loading-spinner-container"><div class="${this.0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOiCSS_CLASSES.SPINNER}"></div></td></tr>`;
        try {
            // **FIX:** Sử dụng optional8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJl chaining để tránh lỗi nếu window.callApi không tồn tại.
            const response = await window.callApi?.('/products');Y3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAl
            this.products = response?.data?.products || [];
            this.renderProductList();
        } catch (error) {
            this.productListBody.innerHTML = `<tr><td colspan="5" class="error-message">Lỗi khi tải danh sách sản phẩm. ${this.escapeHTML(error.message)}</td></tr>`;
IiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPS        }
    }

    renderProductList() {
        if (!this.products || this.products.JtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGlength === 0) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>`;
            return;
        }ZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb25

        this.productListBody.innerHTML = this.products.map(p => {
            // **IMPRO0LXNpeGU9IjEycHgiIGZpbGw9IiM5OTkiPkzỗiIFRhuqNpIMOhbmggPC90ZXh0Pjwvc3ZnPg==';
VEMENT & SECURITY:** Escape tất cả các giá trị động trước khi đưa vào HTML.
            const imgSrc = p.images?.        
        // Các hằng số cho class CSS để dễ quản lý và tránh lỗi chính tả.
        this.CSS_length > 0 ? this.escapeHTML(p.images[0]) : this.placeholderImg50;CLASSES = {
            LOADING: 'loading',
            EDITING: 'editing',
            SPINNER: '
            const title = this.escapeHTML(p.title);
            const id = this.escapeHTML(p._id);
            // **NÂNG CẤP BẢO MẬT:** Luôn escape mọispinner',
            HIDDEN: 'hidden',
        };

        this.cacheDOMElements();
         dữ liệu từ server, kể cả số.
            const stock = this.escapeHTML(p.stock);

            return // Kiểm tra các element quan trọng sau khi cache để đảm bảo an toàn.
        this.validateDOMElements();
    `
                <tr id="product-row-${id}">
                    <td><img src="${imgSrc}" alt="${}

    /**
     * Cache các element DOM thường xuyên sử dụng để tối ưu hiệu suất.
     */title}" onerror="this.onerror=null;this.src='${this.placeholderImg50}';">
    cacheDOMElements() {
        this.loginScreen = document.getElementById('adminLoginScreen');
</td>
                    <td>${title}</td>
                    <td>${window.Utils.formatPrice(p.price)}</td>        this.dashboard = document.getElementById('adminDashboard');
        this.loginForm = document.getElementById('admin
                    <td>${stock}</td>
                    <td class="actions">
                        <button class="btn btn-LoginForm');
        this.loginError = document.getElementById('loginError');
        this.loginSubmitBtn =sm btn-warning" data-action="edit" data-id="${id}" title="Sửa"><i class document.getElementById('loginSubmitBtn');
        this.logoutBtn = document.getElementById('adminLogoutBtn');
="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger"        this.form = document.getElementById('productForm');
        this.formTitle = document.getElementById('form data-action="delete" data-id="${id}" title="Xóa"><i class="fas fa-trashTitle');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitBtnText ="></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

     document.getElementById('submitBtnText');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');async handleFormSubmit(e) {
        e.preventDefault();
        const productData = this.getFormData
        this.productListBody = document.getElementById('productList');
        this.imagesInput = document.getElementById('images');
        this.imagePreview = document.getElementById('imagePreview');
        this.featuresContainer = document();
        if (!productData) return; // Dừng lại nếu dữ liệu không hợp lệ

        this.toggle.getElementById('featuresContainer');
        this.addFeatureBtn = document.getElementById('addFeatureBtn');
    ButtonLoading(this.submitBtn, true);
        try {
            const endpoint = this.editingProductId ? `/products/${this.editingProductId}` : '/products';
            const method = this.editingProductId ? 'PATCH' : '}

    /**
     * Kiểm tra sự tồn tại của các DOM element cốt lõi. Nếu thiếu, sẽPOST';

            await window.callApi?.(endpoint, method, productData);

            window.Utils?.showToast( báo lỗi sớm.
     */
    validateDOMElements() {
        const requiredElements = {
            this.editingProductId ? 'Cập nhật thành công!' : 'Đăng sản phẩm thành công!', 'success');loginScreen: this.loginScreen,
            dashboard: this.dashboard,
            loginForm: this.login
            this.resetForm();
            await this.fetchAndRenderProducts(); // Tải lại danh sách đểForm,
            form: this.form,
            productListBody: this.productListBody,
        };
 đảm bảo đồng bộ
        } catch (error) {
            const errorMessage = error.response?.data?.message ||        for (const [name, el] of Object.entries(requiredElements)) {
            if (!el) {
                throw new Error(`Critical DOM element not found: #${name}. Admin panel cannot initialize.`);
            }
        }
    }

    /**
     * Khởi tạo trang quản trị, gán event listener và kiểm error.message || 'Thao tác thất bại.';
            window.Utils?.showToast(`Lỗi API: ${this.escapeHTML(errorMessage)}`, 'error');
        } finally {
            this.toggleButtonLoading(this. tra trạng thái đăng nhập.
     */
    init() {
        this.bindEventListeners();
        // Kiểm trasubmitBtn, false);
        }
    }

    handleProductListClick(e) {
        const `window.currentUser` một cách an toàn.
        if (window.currentUser?.role === 'admin') {
             button = e.target.closest('button[data-action]');
        if (!button) return;

        this.showDashboard();
        } else {
            this.showLoginScreen();
        }
    }const { action, id } = button.dataset;

        if (action === 'edit') this.populateForm

    /**
     * Gán tất cả event listener một lần duy nhất để tránh rò rỉ bộ nhớ.
     */
    bindEventListeners() {
        this.loginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));ForEdit(id);
        else if (action === 'delete') this.handleDelete(id, button);
    }

    populateFormForEdit(id) {
        const product = this.products.find(p => p._id === id);
        if (!product) {
            window.Utils?.showToast('Không tìm thấy sản phẩm để chỉnh sửa.', 'error');
            return;
        }

        this.reset
        // Sử dụng event delegation cho các nút trong danh sách sản phẩm.
        this.productListBody.addEventListener('click',Form();
        this.editingProductId = id;

        // Điền dữ liệu vào form
        this.form.querySelector('#title').value = product.title || '';
        this.form.querySelector('#category').value = product. this.handleProductListClick.bind(this));
        
        // Kiểm tra button tồn tại trước khi gcategory || '';
        this.form.querySelector('#price').value = product.price ?? 0;
        this.form.querySelector('#oldPrice').value = product.oldPrice ?? '';
        this.form.querySelectorán event listener.
        this.cancelEditBtn?.addEventListener('click', () => this.resetForm());
        this.imagesInput?.addEventListener('input', this.renderImagePreviews.bind(this));
        this.addFeatureBtn('#stock').value = product.stock ?? 0;
        this.form.querySelector('#badge').value =?.addEventListener('click', () => this.addFeatureInput());
        this.logoutBtn?.addEventListener('click', () => window.logout());
    }
    
    showLoginScreen() {
        this.loginScreen.style product.badge || '';
        this.imagesInput.value = product.images?.join(', ') || '';
        this.form.querySelector('#description').value = product.description || '';
        this.form.querySelector('#.display = 'flex';
        this.dashboard.style.display = 'none';
        this.logoutBtn?.detailedDescription').value = product.detailedDescription || '';

        if (this.featuresContainer) this.featuresContainer.innerHTML = '';
        product.features?.forEach(feature => this.addFeatureInput(feature));

        this.renderImagePreviews();

        // Cập nhật giao diện form
        this.formTitle.innerHTML = `<i classclassList.add(this.CSS_CLASSES.HIDDEN);
    }
    
    async showDashboard() {
        this.loginScreen.style.display = 'none';
        this.dashboard.style.display = 'block="fas fa-edit"></i> Chỉnh sửa sản phẩm`;
        this.submitBtnText.textContent = '';
        this.logoutBtn?.classList.remove(this.CSS_CLASSES.HIDDEN);
        await this.fetchAndRenderProducts();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        ifLưu thay đổi';
        this.cancelEditBtn.style.display = 'inline-flex';

        const productRow = document.getElementById(`product-row-${this.escapeHTML(id)}`);
        if (productRow (this.loginError) this.loginError.textContent = '';
        this.toggleButtonLoading(this.loginSubmitBtn, true);

        const email = this.loginForm.querySelector('#adminEmail').value;
) productRow.classList.add(this.CSS_CLASSES.EDITING);

        this.form.scroll        const pass = this.loginForm.querySelector('#adminPass').value;

        try {
            const userIntoView({ behavior: 'smooth' });
    }

    async handleDelete(id, button) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.')) return;

 = await window.authenticate(email, pass);
            if (user?.role === 'admin') {
                window.Utils.showToast(`Chào mừng Admin ${this.escapeHTML(user.name)}!`, 'success');
        this.toggleButtonLoading(button, true);
        try {
            await window.callApi?.(`/products/${id}`, 'DELETE');
            window.Utils?.showToast('Đã xóa sản phẩm.', 'success                this.showDashboard();
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.currentUser = null;
                if (this.loginError) this.loginError');

            // **NÂNG CẤP UX:** Xóa sản phẩm khỏi mảng state và render lại list ngay lập tức
            const productIndex = this.products.findIndex(p => p._id === id);
.textContent = 'Tài khoản không có quyền truy cập Admin.';
            }
        } catch (error) {
            if (this.loginError) this.loginError.textContent = error.message || 'Email hoặc mật khẩu không            if (productIndex > -1) {
                this.products.splice(productIndex, 1);
                this.renderProductList(); // Render lại từ dữ liệu đã cập nhật, nhanh hơn fetch
            } else {
                // Nếu không tìm thấy, fetch lại từ server để đảm bảo đồng bộ
                await this.fetchAndRenderProducts();
            }

        } catch (error) {
            window.Utils?.showToast(error đúng.';
        } finally {
            this.toggleButtonLoading(this.loginSubmitBtn, false);
        }
    }

    async fetchAndRenderProducts() {
        this.productListBody.innerHTML = .message || 'Xóa thất bại.', 'error');
        } finally {
            // **FIX:** Đ`<tr><td colspan="5" class="loading-spinner-container"><div class="${this.CSS_CLASSES.SPINNER}"></div></td></tr>`;
        try {
            // Sử dụng optional chaining để tránh lỗi nếu window.callApi không tồn tại.
            const response = await window.callApi?.('/products');
            this.products = response?.data?.products || [];
            this.renderProductList();
        } catch (error)ảm bảo button được bật lại dù thành công hay thất bại.
            this.toggleButtonLoading(button, false); {
            const errorMessage = error.response?.data?.message || error.message || "Lỗi không xác định.";
            this.productListBody.innerHTML = `<tr><td colspan="5" class="error-message">Lỗi
        }
    }
    
    // **NÂNG CẤP CẤU TRÚC:** T khi tải danh sách sản phẩm: ${this.escapeHTML(errorMessage)}</td></tr>`;
        }
    }

    renderProductList() {
        this.productListBody.innerHTML = ''; // Xóa sạch nội dung cũ
ách logic validate ra khỏi hàm getFormData
    validateFormData(data) {
        if (!data.title || !data.description) {
            window.Utils?.showToast('Vui lòng điền đầy đủ Tên và Mô tả ngắn.', 'error');
            return false;
        }
        if (isNaN(data.price) || is        if (!this.products || this.products.length === 0) {
            this.productListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>NaN(data.stock) || (data.oldPrice !== undefined && isNaN(data.oldPrice))) {
            window.Utils?.showToast('Giá, Giá cũ và Tồn kho phải là số.', 'error');`;
            return;
        }
        
        // Sử dụng DocumentFragment để tối ưu hiệu suất render
        const fragment = document.createDocumentFragment();
        this.products.forEach(p => {
            const row = document
            return false;
        }
        if (data.images.length === 0) {
            .createElement('tr');
            row.id = `product-row-${this.escapeHTML(p._id)}`;window.Utils?.showToast('Vui lòng cung cấp ít nhất một link hình ảnh.', 'error');
            return false;
        }
        for (const url of data.images) {
            try {
                new
            row.innerHTML = this.createProductRowHTML(p);
            fragment.appendChild(row);
        });
        this.productListBody.appendChild(fragment);
    }
    
    /**
     * URL(url); // Kiểm tra URL hợp lệ bằng constructor URL.
            } catch (_) {
                window.Utils?.showToast(`Link ảnh "${this.escapeHTML(url.slice(0, 30))}..." Tạo chuỗi HTML cho một dòng sản phẩm (tr).
     * @param {object} p - Đối tượng sản phẩm. không hợp lệ.`, 'error');
                return false;
            }
        }
        
        const MAX_INT_VALUE = 2147483647; // Max value cho kiểu INT 32-bit signed
        if (data.price > MAX_INT_VALUE || (data.oldPrice
     * @returns {string} - Chuỗi HTML của các thẻ <td>.
     */
    createProductRowHTML && data.oldPrice > MAX_INT_VALUE) || data.stock > MAX_INT_VALUE) {
            window.Utils?.showToast(`Giá hoặc tồn kho không được vượt quá ${MAX_INT_VALUE.(p) {
        const imgSrc = p.images?.length > 0 ? this.escapeHTML(p.images[0]) : this.placeholderImg50;
        const title = this.escapeHTML(ptoLocaleString('vi-VN')}.`, 'error');
            return false;
        }

        return true;
.title);
        const id = this.escapeHTML(p._id);

        return `
            <td>    }

    getFormData() {
        const price = Number(this.form.querySelector('#price').value);
        const stock = Number(this.form.querySelector('#stock').value);
        const oldPriceValue = this.form.querySelector('#oldPrice').value;
        const oldPrice = oldPriceValue ? Number(<img src="${imgSrc}" alt="${title}" class="product-thumb" onerror="this.onerror=null;this.src='${this.placeholderImg50}';"></td>
            <td data-cell="title">${title}</td>
            <td data-cell="price">${window.Utils.formatPrice(p.price)}</td>oldPriceValue) : undefined;

        const data = {
            title: this.form.querySelector('#title').value.trim(),
            category: this.form.querySelector('#category').value.trim(),
            price,
            stock,
            description: this.form.querySelector('#description').value.trim(),
            images
            <td data-cell="stock">${p.stock}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning" data-action="edit" data-id="${id: this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean),
            detailed}" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${id}" title="Xóa"><i class="fas fa-trash"></i></button>
            </td>
        `;
    }

    async handleFormDescription: this.form.querySelector('#detailedDescription').value.trim(),
            features: Array.from(this.featuresContainer.querySelectorAll('input')).map(input => input.value.trim()).filter(Boolean),
        Submit(e) {
        e.preventDefault();
        const productData = this.getFormData();
        if (!productData) return;

        this.toggleButtonLoading(this.submitBtn, true);
        };

        if (oldPrice !== undefined) data.oldPrice = oldPrice;

        const badgeValue = this.formconst isEditing = !!this.editingProductId;

        try {
            const endpoint = isEditing ? `/products/${this..querySelector('#badge').value.trim();
        if (badgeValue) data.badge = badgeValue.toUpperCaseeditingProductId}` : '/products';
            const method = isEditing ? 'PATCH' : 'POST';
            ();
        
        if (!this.validateFormData(data)) {
            return null; // Trả về null nếu
            const response = await window.callApi?.(endpoint, method, productData);
            const savedProduct = response. dữ liệu không hợp lệ
        }

        return data;
    }

    renderImagePreviews() {
        if (!this.imagePreview) return;
        this.imagePreview.innerHTML = '';
        const urlsdata.product;

            if (isEditing) {
                // **TỐI ƯU:** Cập nhật sản = this.imagesInput.value.split(',').map(url => url.trim()).filter(Boolean);

        urls phẩm trong mảng state và chỉ render lại dòng đó.
                const index = this.products.findIndex(p.forEach(url => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = ' => p._id === this.editingProductId);
                if (index !== -1) {
                    this.preview-img-wrapper';
            const img = document.createElement('img');
            img.className = 'products[index] = savedProduct;
                    const row = document.getElementById(`product-row-${this.editingpreview-img';

            const safeUrl = this.escapeHTML(url);

            img.src = safeUrlProductId}`);
                    if (row) {
                        row.innerHTML = this.createProductRowHTML(savedProduct;
            img.alt = 'Ảnh xem trước';
            img.onerror = () => {
                img);
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    // Nếu không tìm thấy (ví dụ: bị xóa bởi người khác), thì tải lại toàn bộ.src = this.placeholderImg80Error;
                img.title = `Không thể tải hoặc link không hợp lệ: ${safeUrl}`;
            };

            imgWrapper.appendChild(img);
            this.imagePreview.appendChild(imgWrapper);
        });
    }

    addFeatureInput(value = '') {
        const div.
                    await this.fetchAndRenderProducts();
                }
            } else {
                // **T = document.createElement('div');
        div.className = 'feature-item';

        const input = documentỐI ƯU:** Thêm sản phẩm mới vào state và chèn dòng mới vào bảng.
                this..createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.value = this.escapeHTML(value);
        input.placeholder = 'VD: Thproducts.unshift(savedProduct); // Thêm vào đầu mảng
                if(this.products.length === 1) { // Nếu đây là sản phẩm đầu tiên
                     this.renderProductList();
                } else {ân thiện với người dùng';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-danger';
        button.title = 'Xóa tính năng';
        button.innerHTML = '<i class="fas fa-times"></i>'; // Gi
                     const row = document.createElement('tr');
                     row.id = `product-row-${savedProduct._id}`;
                     row.innerHTML = this.createProductRowHTML(savedProduct);
                     this.productListBody.prepend(row);
                }
            }
            
            window.Utils.showToast(isEditing ? 'ữ lại vì cần render icon HTML
        button.addEventListener('click', () => div.remove());

        div.appendChild(input);
        div.appendChild(button);
        this.featuresContainer.appendChild(div);
Cập nhật thành công!' : 'Đăng sản phẩm thành công!', 'success');
            this.resetForm();

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.    }

    resetForm() {
        if (this.editingProductId) {
            // **FIX:** Kiểm tra xem hàng (row) có thực sự tồn tại trong DOM không trước khi xóa class
            const row =message || 'Thao tác thất bại.';
            window.Utils.showToast(`Lỗi: ${this.escapeHTML(errorMessage)}`, 'error');
        } finally {
            this.toggleButtonLoading(this.submitBtn, false);
        }
    }
    
    handleProductListClick(e) {
        const button = document.getElementById(`product-row-${this.escapeHTML(this.editingProductId)}`);
            if (row e.target.closest('button[data-action]');
        if (!button) return;
        
        const { action, id } = button.dataset;
        
        if (action === 'edit') this.) row.classList.remove(this.CSS_CLASSES.EDITING);
        }

        this.editingProductId = null;
        this.form.reset();
        if (this.featuresContainer) this.featurespopulateFormForEdit(id);
        else if (action === 'delete') this.handleDelete(id, button);
    }

    populateFormForEdit(id) {
        const product = this.products.Container.innerHTML = '';
        if (this.imagePreview) this.imagePreview.innerHTML = '';
        if (this.formTitle) this.formTitle.innerHTML = `<i class="fas fa-plus-circle"></i> Đăng sản phẩm mới`;
        if (this.submitBtnText) this.submitBtnText.textContent = 'Đăng sản phẩm';
        if (this.cancelEditBtn) this.cancelEditBtn.find(p => p._id === id);
        if (!product) {
            window.Utils.showToast('Không tìm thấy sản phẩm để chỉnh sửa.', 'error');
            return;
        }

        thisstyle.display = 'none';
    }

    toggleButtonLoading(button, isLoading) {
        if.resetForm(); // Dọn dẹp form trước khi điền dữ liệu mới
        this.editingProductId = id;
        
        this.form.querySelector('#title').value = product.title || '';
        this.form. (!button) return;

        button.disabled = isLoading;
        button.classList.toggle(this.CSS_CLASSES.LOADING, isLoading);

        // **FIX:** Kiểm tra icon tồn tại trước khi thay đổi style.querySelector('#category').value = product.category || '';
        this.form.querySelector('#price').value = product.price ?? 0;
        this.form.querySelector('#oldPrice').value = product.oldPrice ??
        const icon = button.querySelector('i');
        if (icon) {
            icon.style.display = isLoading ? 'none' : '';
        }

        let spinner = button.querySelector(`.${this. '';
        this.form.querySelector('#stock').value = product.stock ?? 0;
        this.form.querySelector('#badge').value = product.badge || '';
        this.imagesInput.value = product.CSS_CLASSES.SPINNER}`);
        if (isLoading && !spinner) {
            spinner = document.createElement('div');
            spinner.className = this.CSS_CLASSES.SPINNER;
            button.prepend(spinner);
images?.join(', ') || '';
        this.form.querySelector('#description').value = product.description || '';
        this.form.querySelector('#detailedDescription').value = product.detailedDescription || '';
        
        this        } else if (spinner) {
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        }
    }

    escapeHTML(str) {
        // **FIX & NÂNG CẤP:** Xử lý trường hợp đầu vào không phải là chuỗi (null, undefined, number).
        const text.featuresContainer.innerHTML = '';
        product.features?.forEach(feature => this.addFeatureInput(feature));
        
        this.renderImagePreviews();

        this.formTitle.innerHTML = `<i class=" = String(str ?? '');
        const p = document.createElement('p');
        p.textContent = text;
        return p.innerHTML;
    }
}

// **NÂNG CẤP:** Bfas fa-edit"></i> Chỉnh sửa sản phẩm`;
        this.submitBtnText.textContent = 'Lưu thay đổi';
        this.cancelEditBtn.style.display = 'inline-flex';
        
ọc toàn bộ khối khởi tạo trong try...catch để bắt các lỗi nghiêm trọng
document.addEventListener('DOMContentLoaded', () => {
    try {
        const adminPanel = new AdminPanel();
        adminPanel.init();
            const productRow = document.getElementById(`product-row-${this.escapeHTML(id)}`);
        productRow?.} catch (error) {
        console.error("Failed to initialize Admin Panel:", error);
        // HiclassList.add(this.CSS_CLASSES.EDITING);
        
        this.form.scrollIntoViewển thị một thông báo lỗi thân thiện cho người dùng trên UI.
        document.body.innerHTML = `<div({ behavior: 'smooth' });
    }

    async handleDelete(id, button) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.')) return; class="critical-error">Lỗi nghiêm trọng khi khởi tạo trang quản trị. Vui lòng kiểm tra Console (
        
        this.toggleButtonLoading(button, true);
        try {
            await window.callF12) để biết chi tiết.</div>`;
    }
});
Api?.(`/products/${id}`, 'DELETE');
            window.Utils.showToast('Đã xóa sản phẩm.', 'success');
            
            // **TỐI ƯU:** Xóa sản phẩm khỏi mảng state và xóa dòng khỏi DOM.
            const productIndex = this.products.findIndex(p => p._id === id);
            if (productIndex > -1) {
                this.products.splice(productIndex, 1);
                document.getElementById(`product-row-${id}`)?.remove();
                 if (this.products.length === 0) { // Nếu xóa sản phẩm cuối cùng
                    this.renderProductList();
                }
            ```
