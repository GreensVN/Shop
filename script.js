// script.js - Enhanced UI Controller for Index Page (Production Ready)
"use strict";

// =================================================================
// CONFIGURATION
// =================================================================

const UI_CONFIG = {
    ANIMATION_DELAY: 0.08,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    MAX_PRODUCT_TITLE: 100,
    MAX_PRODUCT_DESC: 500,
    MIN_PRODUCT_PRICE: 1000,
    MAX_PRODUCT_PRICE: 50000000
};

// =================================================================
// ENHANCED PRODUCT MODAL MANAGER
// =================================================================

const ProductModal = {
    modal: null,
    isSubmitting: false,

    /**
     * Tạo và khởi tạo modal nếu chưa tồn tại
     */
    init() {
        if (this.modal) return;

        const modalElement = document.createElement('div');
        modalElement.id = 'addProductModal';
        modalElement.className = 'modal';
        modalElement.innerHTML = `
            <div class="modal-content add-product-modal-content">
                <button class="modal-close" aria-label="Đóng">×</button>
                <h2 class="modal-title"><i class="fas fa-plus-circle"></i> Đăng Sản Phẩm Mới</h2>
                <form id="addProductForm" class="add-product-form">
                    <div class="form-grid-2col">
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-tag"></i> Tên sản phẩm 
                                <span class="required">*</span>
                                <span class="char-count" id="titleCharCount">0/${UI_CONFIG.MAX_PRODUCT_TITLE}</span>
                            </label>
                            <input type="text" id="productTitle" class="form-input" required 
                                   maxlength="${UI_CONFIG.MAX_PRODUCT_TITLE}" 
                                   placeholder="Nhập tên sản phẩm...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-hashtag"></i> Badge/Tag
                            </label>
                            <select id="productBadge" class="form-input">
                                <option value="">-- Không có --</option>
                                <option value="HOT">🔥 HOT</option>
                                <option value="SALE">💰 SALE</option>
                                <option value="NEW">✨ NEW</option>
                                <option value="BEST">⭐ BEST</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-money-bill-wave"></i> Giá bán 
                                <span class="required">*</span>
                            </label>
                            <input type="number" id="productPrice" class="form-input" required 
                                   min="${UI_CONFIG.MIN_PRODUCT_PRICE}" 
                                   max="${UI_CONFIG.MAX_PRODUCT_PRICE}"
                                   step="1000" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-users"></i> Số lượng đã bán
                            </label>
                            <input type="number" id="productSales" class="form-input" 
                                   min="0" value="0" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-align-left"></i> Mô tả sản phẩm 
                            <span class="required">*</span>
                            <span class="char-count" id="descCharCount">0/${UI_CONFIG.MAX_PRODUCT_DESC}</span>
                        </label>
                        <textarea id="productDescription" class="form-textarea" required 
                                  maxlength="${UI_CONFIG.MAX_PRODUCT_DESC}"
                                  placeholder="Mô tả chi tiết về sản phẩm..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-image"></i> URL Hình ảnh 
                            <span class="required">*</span>
                        </label>
                        <input type="url" id="productImage" class="form-input" required 
                               placeholder="https://example.com/image.jpg">
                        <div id="imagePreview" class="image-preview"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-link"></i> Link sản phẩm 
                            <span class="required">*</span>
                        </label>
                        <input type="url" id="productLink" class="form-input" required 
                               placeholder="https://greensvn.github.io/Shop/product.html?id=123">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelProductBtn">
                            <i class="fas fa-times"></i><span>Hủy</span>
                        </button>
                        <button type="submit" class="btn btn-success" id="submitProductBtn">
                            <i class="fas fa-plus"></i><span>Đăng sản phẩm</span>
                            <div class="spinner" style="display: none;"></div>
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalElement);
        this.modal = modalElement;

        // Attach event listeners
        this.attachEventListeners();
        this.setupFormValidation();
    },

    /**
     * Gắn các event listeners cho modal
     */
    attachEventListeners() {
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('#cancelProductBtn').addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => { 
            if (e.target === this.modal) this.hide(); 
        });
        this.modal.querySelector('#addProductForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Image URL preview
        this.modal.querySelector('#productImage').addEventListener('blur', (e) => {
            this.previewImage(e.target.value);
        });
    },

    /**
     * Thiết lập validation cho form
     */
    setupFormValidation() {
        const titleInput = this.modal.querySelector('#productTitle');
        const descInput = this.modal.querySelector('#productDescription');
        const titleCount = this.modal.querySelector('#titleCharCount');
        const descCount = this.modal.querySelector('#descCharCount');

        // Character count for title
        titleInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            titleCount.textContent = `${count}/${UI_CONFIG.MAX_PRODUCT_TITLE}`;
            titleCount.style.color = count > UI_CONFIG.MAX_PRODUCT_TITLE * 0.9 ? '#ef4444' : '#6b7280';
        });

        // Character count for description
        descInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            descCount.textContent = `${count}/${UI_CONFIG.MAX_PRODUCT_DESC}`;
            descCount.style.color = count > UI_CONFIG.MAX_PRODUCT_DESC * 0.9 ? '#ef4444' : '#6b7280';
        });
    },

    /**
     * Preview hình ảnh từ URL
     */
    previewImage(url) {
        const preview = this.modal.querySelector('#imagePreview');
        if (!url || !Utils.validateURL(url)) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = `
            <div style="text-align: center; margin: 1rem 0;">
                <img src="${url}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <p style="display: none; color: #ef4444; font-size: 0.9rem;">Không thể tải hình ảnh</p>
            </div>
        `;
    },

    /**
     * Hiển thị modal
     */
    show() {
        if (!window.PermissionManager?.checkPostPermission()) {
            window.Utils?.showToast('Bạn không có quyền đăng sản phẩm!', 'error');
            return;
        }
        
        this.init();
        this.modal.style.display = 'flex';
        setTimeout(() => this.modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
        
        // Reset form
        this.modal.querySelector('#addProductForm').reset();
        this.modal.querySelector('#imagePreview').innerHTML = '';
        this.modal.querySelector('#titleCharCount').textContent = `0/${UI_CONFIG.MAX_PRODUCT_TITLE}`;
        this.modal.querySelector('#descCharCount').textContent = `0/${UI_CONFIG.MAX_PRODUCT_DESC}`;
    },

    /**
     * Ẩn modal
     */
    hide() {
        if (!this.modal) return;
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    },

    /**
     * Xử lý submit form
     * @param {Event} e 
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        const submitBtn = this.modal.querySelector('#submitProductBtn');
        const spinner = submitBtn.querySelector('.spinner');

        const formData = {
            title: this.modal.querySelector('#productTitle').value.trim(),
            description: this.modal.querySelector('#productDescription').value.trim(),
            price: this.modal.querySelector('#productPrice').value,
            image: this.modal.querySelector('#productImage').value.trim(),
            badge: this.modal.querySelector('#productBadge').value,
            sales: this.modal.querySelector('#productSales').value,
            link: this.modal.querySelector('#productLink').value.trim(),
        };

        // Validation
        const errors = this.validateFormData(formData);
        if (errors.length > 0) {
            window.Utils?.showToast(errors.join('\n'), 'error');
            return;
        }

        // Set loading state
        this.isSubmitting = true;
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';

        try {
            const success = await window.ProductManager?.createProduct(formData);
            if (success) {
                this.hide();
                window.Utils?.showToast('Đăng sản phẩm thành công!', 'success');
            }
        } catch (error) {
            window.Utils?.showToast(error.message || 'Có lỗi xảy ra khi đăng sản phẩm!', 'error');
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            spinner.style.display = 'none';
        }
    },

    /**
     * Validate form data
     */
    validateFormData(data) {
        const errors = [];

        if (!data.title || data.title.length < 5) {
            errors.push('Tên sản phẩm phải có ít nhất 5 ký tự');
        }

        if (!data.description || data.description.length < 10) {
            errors.push('Mô tả phải có ít nhất 10 ký tự');
        }

        const price = parseInt(data.price);
        if (isNaN(price) || price < UI_CONFIG.MIN_PRODUCT_PRICE || price > UI_CONFIG.MAX_PRODUCT_PRICE) {
            errors.push(`Giá phải từ ${Utils.formatPrice(UI_CONFIG.MIN_PRODUCT_PRICE)} đến ${Utils.formatPrice(UI_CONFIG.MAX_PRODUCT_PRICE)}`);
        }

        if (!Utils.validateURL(data.image)) {
            errors.push('URL hình ảnh không hợp lệ');
        }

        if (!Utils.validateURL(data.link)) {
            errors.push('Link sản phẩm không hợp lệ');
        }

        return errors;
    }
};

// =================================================================
// ENHANCED PRODUCT RENDERING
// =================================================================

/**
 * Hiển thị danh sách sản phẩm lên lưới sản phẩm.
 * @param {Array} products Mảng các đối tượng sản phẩm.
 */
function renderApiProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products-found" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p style="color: #64748b; font-size: 1.1rem;">Không tìm thấy sản phẩm nào.</p>
            </div>
        `;
        hideFilterResult();
        return;
    }
    
    products.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsGrid.appendChild(productCard);
    });
    
    attachProductEventListeners();
}

/**
 * Tạo thẻ sản phẩm
 */
function createProductCard(product, index) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card fade-in';
    productCard.dataset.id = product._id;
    productCard.dataset.price = product.price;
    productCard.dataset.note = product.description || '';
    productCard.dataset.category = product.category || '';
    
    // Tạo nút xóa chỉ khi có quyền
    let deleteButtonHTML = '';
    if (window.PermissionManager?.checkDeletePermission(product)) {
        deleteButtonHTML = `
            <button class="btn-icon btn-delete" title="Xóa sản phẩm" data-id="${product._id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
    }

    productCard.innerHTML = `
        <div class="product-image">
            <img src="${product.images?.[0] || 'placeholder.jpg'}" alt="${product.title}" 
                 loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
            ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
            <div class="product-overlay">
                <button class="btn-favorite btn-icon" title="Thêm vào yêu thích" data-id="${product._id}">
                    <i class="far fa-heart"></i>
                </button>
                <a href="${product.link || '#'}" class="btn-view btn-icon" title="Xem chi tiết" 
                   target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-eye"></i>
                </a>
                ${deleteButtonHTML} 
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">
                <span class="product-current-price">${Utils.formatPrice(product.price)}</span>
            </div>
            <div class="product-meta">
                <span class="product-sales"><i class="fas fa-user"></i> ${product.sales || 0}</span>
                <span class="product-stock"><i class="fas fa-box"></i> ${product.stock !== undefined ? product.stock : 'N/A'}</span>
            </div>
            <p class="product-id">ID: #${product._id.slice(-6)}</p>
            <div class="product-actions">
                <a href="${product.link || '#'}" class="add-to-cart-link" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-shopping-cart"></i><span>Mua Ngay</span>
                </a>
            </div>
        </div>
    `;

    productCard.style.animationDelay = `${index * UI_CONFIG.ANIMATION_DELAY}s`;
    return productCard;
}

/**
 * Gắn các trình xử lý sự kiện cho các nút trên thẻ sản phẩm.
 */
function attachProductEventListeners() {
    // Nút "Yêu thích"
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            if (!window.currentUser) {
                window.Utils?.showToast('Vui lòng đăng nhập!', 'info');
                document.getElementById('loginButton')?.click();
                return;
            }
            
            const productId = e.currentTarget.dataset.id;
            const isFavorite = btn.classList.contains('active');
            btn.disabled = true;
            
            try {
                if (isFavorite) {
                    await window.FavoriteManager?.remove(productId);
                    window.Utils?.showToast('Đã xóa khỏi yêu thích', 'info');
                } else {
                    await window.FavoriteManager?.add(productId);
                    window.Utils?.showToast('Đã thêm vào yêu thích!', 'success');
                }
            } catch (error) {
                window.Utils?.showToast(error.message, 'error');
            } finally {
                btn.disabled = false;
            }
        });
    });

    // Nút xóa sản phẩm
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            const productId = e.currentTarget.dataset.id;
            
            if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                try {
                    await window.ProductManager?.deleteProduct(productId);
                } catch (error) {
                    window.Utils?.showToast(error.message || 'Không thể xóa sản phẩm!', 'error');
                }
            }
        });
    });
}

// =================================================================
// ENHANCED FILTER SYSTEM
// =================================================================

function filterProducts() {
    const searchId = document.getElementById('searchId')?.value.toLowerCase().trim() || '';
    const searchPrice = document.getElementById('searchPrice')?.value || '';
    const searchNote = document.getElementById('searchNote')?.value.toLowerCase().trim() || '';
    
    let visibleCount = 0;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const cardId = card.dataset.id?.toLowerCase() || '';
        const cardPrice = parseInt(card.dataset.price) || 0;
        const cardNote = card.dataset.note?.toLowerCase() || '';
        
        let isVisible = true;
        
        if (searchId && !cardId.includes(searchId)) isVisible = false;
        if (searchNote && !cardNote.includes(searchNote)) isVisible = false;
        
        if (searchPrice) {
            const ranges = {
                'duoi-50k': [0, 49999], 
                'tu-50k-200k': [50000, 200000], 
                'tren-200k': [200001, Infinity]
            };
            const [min, max] = ranges[searchPrice] || [0, Infinity];
            if (cardPrice < min || cardPrice > max) isVisible = false;
        }
        
        card.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });
    
    showFilterResult(visibleCount);
}

function resetFilters() {
    const searchId = document.getElementById('searchId');
    const searchPrice = document.getElementById('searchPrice');
    const searchNote = document.getElementById('searchNote');
    
    if (searchId) searchId.value = '';
    if (searchPrice) searchPrice.value = '';
    if (searchNote) searchNote.value = '';
    
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'block';
    });
    
    hideFilterResult();
}

function showFilterResult(count) {
    let resultMessage = document.getElementById('filterResult');
    if (!resultMessage) {
        resultMessage = document.createElement('div');
        resultMessage.id = 'filterResult';
        Object.assign(resultMessage.style, {
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px', 
            marginBottom: '20px', 
            borderLeft: '4px solid #6366f1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            animation: 'fadeInUp 0.5s'
        });
        document.getElementById('productsGrid')?.prepend(resultMessage);
    }
    
    if (resultMessage) {
        resultMessage.innerHTML = `
            <i class="fas fa-search" style="margin-right: 8px; color: #6366f1;"></i>
            <strong>Kết quả lọc:</strong> Tìm thấy <strong>${count}</strong> sản phẩm phù hợp
        `;
        resultMessage.style.display = 'block';
    }
}

function hideFilterResult() {
    const resultMessage = document.getElementById('filterResult');
    if (resultMessage) {
        resultMessage.style.display = 'none';
    }
}

// =================================================================
// INITIALIZATION AND EXPORTS
// =================================================================

function initIndexPageScript() {
    // Add CSS for delete button
    if (!document.getElementById('deleteButtonStyles')) {
        const style = document.createElement('style');
        style.id = 'deleteButtonStyles';
        style.innerHTML = `
            .btn-delete { 
                color: #fff; 
                background: #ef4444; 
            } 
            .btn-delete:hover { 
                background: #dc2626; 
                transform: scale(1.1);
            }
            .char-count {
                font-size: 0.8rem;
                color: #6b7280;
                margin-left: auto;
            }
            .image-preview {
                margin-top: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Global Exports
window.renderApiProducts = renderApiProducts;
window.filterProducts = filterProducts;
window.resetFilters = resetFilters;
window.ProductModal = ProductModal;

document.addEventListener('DOMContentLoaded', initIndexPageScript);
