// script.js - Phiên bản đã sửa lỗi với chức năng đăng sản phẩm
// Tương thích hoàn toàn với main.js mới, sử dụng floating buttons

"use strict";

// =================================================================
// QUẢN LÝ QUYỀN ĐĂNG SẢN PHẨM
// =================================================================

// Danh sách email được ủy quyền đăng sản phẩm
const AUTHORIZED_EMAILS = [
    'chinhan20917976549a@gmail.com',
    'manager@shopgrowgarden.com', 
    'seller@shopgrowgarden.com',
    'test@example.com', // Email test cho demo
    'greensvn@gmail.com', // Thêm email chủ shop
    // Thêm email được ủy quyền ở đây
];

/**
 * Kiểm tra xem người dùng hiện tại có quyền đăng sản phẩm không
 */
function checkPostPermission() {
    if (!window.currentUser || !window.currentUser.email) {
        return false;
    }
    
    const userEmail = window.currentUser.email.toLowerCase();
    return AUTHORIZED_EMAILS.includes(userEmail);
}

/**
 * Cập nhật quyền đăng sản phẩm (sẽ được gọi bởi main.js)
 * LƯU Ý: Hàm này đã được thay thế bằng floating buttons trong main.js
 */
function updatePostProductButton() {
    // Hàm này đã được di chuyển vào main.js với tên updateFloatingButtons()
    if (window.updateFloatingButtons) {
        window.updateFloatingButtons();
    }
}

/**
 * Hiển thị modal đăng sản phẩm
 */
function showAddProductModal() {
    // Kiểm tra quyền trước khi hiển thị modal
    if (!checkPostPermission()) {
        window.Utils?.showToast('Bạn không có quyền đăng sản phẩm!', 'error');
        return;
    }

    // Tạo modal nếu chưa có
    let modal = document.getElementById('addProductModal');
    if (!modal) {
        modal = createAddProductModal();
        document.body.appendChild(modal);
    }
    
    // Hiển thị modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

/**
 * Ẩn modal đăng sản phẩm
 */
function hideAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

/**
 * Tạo modal đăng sản phẩm
 */
function createAddProductModal() {
    const modal = document.createElement('div');
    modal.id = 'addProductModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content add-product-modal-content">
            <button class="modal-close" onclick="hideAddProductModal()" aria-label="Đóng">×</button>
            <h2 class="modal-title">
                <i class="fas fa-plus-circle"></i> 
                Đăng Sản Phẩm Mới
            </h2>
            
            <form id="addProductForm" class="add-product-form">
                <div class="form-grid-2col">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tag"></i>
                            Tên sản phẩm <span class="required">*</span>
                        </label>
                        <input type="text" id="productTitle" class="form-input" required 
                               placeholder="Nhập tên sản phẩm...">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-hashtag"></i>
                            Badge/Tag
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
                            <i class="fas fa-money-bill-wave"></i>
                            Giá bán <span class="required">*</span>
                        </label>
                        <input type="number" id="productPrice" class="form-input" required 
                               min="0" step="1000" placeholder="0">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-users"></i>
                            Số lượng đã bán
                        </label>
                        <input type="number" id="productSales" class="form-input" 
                               min="0" value="0" placeholder="0">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-align-left"></i>
                        Mô tả sản phẩm <span class="required">*</span>
                    </label>
                    <textarea id="productDescription" class="form-textarea" required 
                              placeholder="Mô tả chi tiết về sản phẩm..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-image"></i>
                        URL Hình ảnh <span class="required">*</span>
                    </label>
                    <input type="url" id="productImage" class="form-input" required 
                           placeholder="https://example.com/image.jpg">
                    <div class="form-help">Nhập URL hình ảnh sản phẩm</div>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-link"></i>
                        Link sản phẩm <span class="required">*</span>
                    </label>
                    <input type="url" id="productLink" class="form-input" required 
                           placeholder="https://greensvn.github.io/Shop/product.html?id=123">
                    <div class="form-help">Link đến trang chi tiết sản phẩm</div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideAddProductModal()">
                        <i class="fas fa-times"></i>
                        <span>Hủy</span>
                    </button>
                    <button type="submit" class="btn btn-success" id="submitProductBtn">
                        <i class="fas fa-plus"></i>
                        <span>Đăng sản phẩm</span>
                        <div class="spinner" style="display: none;"></div>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Xử lý form submit
    const form = modal.querySelector('#addProductForm');
    form.addEventListener('submit', handleAddProductSubmit);
    
    // Đóng modal khi click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideAddProductModal();
        }
    });
    
    return modal;
}

/**
 * Xử lý submit form đăng sản phẩm
 */
async function handleAddProductSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitProductBtn');
    const spinner = submitBtn.querySelector('.spinner');
    
    // Lấy dữ liệu form
    const formData = {
        title: document.getElementById('productTitle').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value.trim(),
        badge: document.getElementById('productBadge').value || null,
        sales: parseInt(document.getElementById('productSales').value) || 0,
        link: document.getElementById('productLink').value.trim()
    };
    
    // Validate
    if (!formData.title || !formData.description || !formData.price || !formData.image || !formData.link) {
        window.Utils?.showToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
        return;
    }
    
    // Hiển thị loading
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    spinner.style.display = 'inline-block';
    
    try {
        // Tạo sản phẩm mới
        const newProduct = {
            _id: 'local_' + Date.now(), // ID tạm thời
            title: formData.title,
            description: formData.description,
            price: formData.price,
            oldPrice: null,
            images: [formData.image],
            badge: formData.badge,
            sales: formData.sales,
            stock: 999,
            category: 'custom',
            link: formData.link
        };
        
        // Thêm vào danh sách sản phẩm hiện tại
        if (window.allProducts) {
            window.allProducts.unshift(newProduct); // Thêm vào đầu danh sách
        } else {
            window.allProducts = [newProduct];
        }
        
        // Render lại danh sách sản phẩm
        if (window.renderApiProducts) {
            window.renderApiProducts(window.allProducts);
        }
        
        // Thông báo thành công
        window.Utils?.showToast('Đăng sản phẩm thành công!', 'success');
        
        // Reset form và đóng modal
        document.getElementById('addProductForm').reset();
        hideAddProductModal();
        
        // Scroll đến sản phẩm mới và highlight
        setTimeout(() => {
            const firstProduct = document.querySelector('.product-card');
            if (firstProduct) {
                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstProduct.style.animation = 'highlightProduct 2s ease-out';
            }
        }, 500);
        
    } catch (error) {
        console.error('Error adding product:', error);
        window.Utils?.showToast('Có lỗi xảy ra khi đăng sản phẩm!', 'error');
    } finally {
        // Tắt loading
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        spinner.style.display = 'none';
    }
}

// =================================================================
// HÀM RENDER VÀ QUẢN LÝ SẢN PHẨM (Sử dụng dữ liệu API)
// =================================================================

/**
 * Hiển thị danh sách sản phẩm từ API lên lưới sản phẩm.
 * @param {Array} products Mảng các đối tượng sản phẩm từ API.
 */
function renderApiProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.warn('Products grid not found on this page.');
        return;
    }

    console.log('Rendering', products.length, 'products from API');

    // Xóa nội dung cũ hoặc spinner tải trang
    productsGrid.innerHTML = '';

    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products-found" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p style="color: #64748b; font-size: 1.1rem;">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
        `;
        hideFilterResult(); // Ẩn thông báo kết quả lọc nếu có
        return;
    }
    
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.dataset.id = product._id; // Sử dụng _id từ API
        productCard.dataset.price = product.price;
        productCard.dataset.note = product.description || '';
        productCard.dataset.category = product.category || '';
        
        const discountPercent = product.oldPrice ? 
            Math.round((product.oldPrice - product.price) / product.oldPrice * 100) : 0;
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.title}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                <div class="product-overlay">
                    <button class="btn-favorite btn-icon" title="Thêm vào yêu thích" data-id="${product._id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <a href="${product.link || `product.html?id=${encodeURIComponent(product._id)}`}" 
                       class="btn-view btn-icon" title="Xem chi tiết" 
                       ${product.link && product.link.startsWith('http') ? 'target="_blank"' : ''}>
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    <div class="price-container">
                        <span class="product-current-price">${window.Utils ? window.Utils.formatPrice(product.price) : `${product.price.toLocaleString('vi-VN')}đ`}</span>
                        ${product.oldPrice ? `<span class="product-old-price">${window.Utils ? window.Utils.formatPrice(product.oldPrice) : `${product.oldPrice.toLocaleString('vi-VN')}đ`}</span>` : ''}
                    </div>
                    <div class="product-meta">
                        <span class="product-sales"><i class="fas fa-user"></i> ${product.sales || 0}</span>
                        <span class="product-stock"><i class="fas fa-box"></i> ${product.stock !== undefined ? product.stock : 'N/A'}</span>
                    </div>
                </div>
                <div class="product-id">ID: #${product._id.slice(-6)}</div>
                <div class="product-actions">
                    <a href="${product.link || `product.html?id=${encodeURIComponent(product._id)}`}" 
                       class="btn btn-primary add-to-cart-link" 
                       ${product.link && product.link.startsWith('http') ? 'target="_blank"' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        <span>Mua Ngay</span>
                    </a>
                </div>
            </div>
        `;
        
        productCard.style.animationDelay = `${index * 0.08}s`;
        productsGrid.appendChild(productCard);
    });
    
    // Gắn các trình xử lý sự kiện sau khi render
    attachProductEventListeners();
    
    // Yêu cầu main.js cập nhật trạng thái các nút yêu thích
    if (window.updateAllFavoriteButtons) {
        window.updateAllFavoriteButtons();
    }
    
    console.log('API products rendered successfully.');
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
                window.Utils?.showToast('Vui lòng đăng nhập để yêu thích sản phẩm!', 'info');
                document.getElementById('loginButton')?.click();
                return;
            }

            const productId = e.currentTarget.dataset.id;
            const icon = btn.querySelector('i');
            const isFavorite = icon.classList.contains('fas'); // Kiểm tra trạng thái hiện tại

            btn.disabled = true; // Vô hiệu hóa nút để tránh click liên tục

            try {
                if (isFavorite) {
                    await window.FavoriteManager.remove(productId);
                    window.Utils?.showToast('Đã xóa khỏi yêu thích', 'info');
                } else {
                    await window.FavoriteManager.add(productId);
                    window.Utils?.showToast('Đã thêm vào yêu thích!', 'success');
                }
                // Trạng thái nút sẽ được cập nhật tự động bởi FavoriteManager thông qua hàm updateFavoriteStatus
            } catch (error) {
                console.error('Error toggling favorite:', error);
                window.Utils?.showToast(error.message || 'Có lỗi xảy ra', 'error');
            } finally {
                btn.disabled = false; // Kích hoạt lại nút
            }
        });
    });
}

// =================================================================
// BỘ LỌC SẢN PHẨM
// =================================================================

function filterProducts() {
    console.log('Filtering products...');
    
    const searchId = document.getElementById('searchId')?.value?.toLowerCase().trim() || '';
    const searchPrice = document.getElementById('searchPrice')?.value || '';
    const searchNote = document.getElementById('searchNote')?.value?.toLowerCase().trim() || '';
    
    let visibleCount = 0;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const cardId = (card.dataset.id || '').toLowerCase();
        const cardPrice = parseInt(card.dataset.price || '0');
        const cardNote = (card.dataset.note || '').toLowerCase();
        
        let isVisible = true;
        
        // Lọc theo ID (chỉ cần khớp phần cuối)
        if (searchId && !cardId.endsWith(searchId)) {
            isVisible = false;
        }
        
        // Lọc theo ghi chú/mô tả
        if (searchNote && !cardNote.includes(searchNote)) {
            isVisible = false;
        }
        
        // Lọc theo khoảng giá
        if (searchPrice) {
            const priceRanges = {
                'duoi-50k': [0, 49999],
                'tu-50k-200k': [50000, 200000],
                'tren-200k': [200001, Infinity]
            };
            
            const [min, max] = priceRanges[searchPrice] || [0, Infinity];
            if (cardPrice < min || cardPrice > max) {
                isVisible = false;
            }
        }
        
        // Áp dụng bộ lọc với hiệu ứng
        if (isVisible) {
            card.style.display = 'block';
            card.style.animation = 'fadeInAnimation 0.5s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    showFilterResult(visibleCount);
    console.log(`Filter applied. ${visibleCount} products visible.`);
}

function resetFilters() {
    console.log('Resetting filters...');
    
    // Xóa các giá trị trong ô input
    const searchId = document.getElementById('searchId');
    const searchPrice = document.getElementById('searchPrice');
    const searchNote = document.getElementById('searchNote');
    
    if (searchId) searchId.value = '';
    if (searchPrice) searchPrice.value = '';
    if (searchNote) searchNote.value = '';
    
    let totalCount = 0;
    // Hiển thị lại tất cả sản phẩm
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'block';
        card.style.animation = 'fadeInAnimation 0.3s ease-out';
        totalCount++;
    });
    
    hideFilterResult();
    console.log(`Filters reset. ${totalCount} products visible.`);
}

function showFilterResult(count) {
    let resultMessage = document.getElementById('filterResult');
    
    if (!resultMessage) {
        resultMessage = document.createElement('div');
        resultMessage.id = 'filterResult';
        resultMessage.style.cssText = `
            grid-column: 1/-1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            margin-bottom: 20px;
            border-left: 4px solid #6366f1;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: fadeInAnimation 0.5s;
        `;
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.insertBefore(resultMessage, productsGrid.firstChild);
        }
    }
    
    resultMessage.innerHTML = `
        <i class="fas fa-search" style="margin-right: 8px; color: #6366f1;"></i>
        <strong>Kết quả lọc:</strong> Tìm thấy <strong>${count}</strong> sản phẩm phù hợp
    `;
    
    resultMessage.style.display = 'block';
}

function hideFilterResult() {
    const resultMessage = document.getElementById('filterResult');
    if (resultMessage) {
        resultMessage.style.display = 'none';
    }
}

// =================================================================
// KHỞI TẠO TRANG CHỦ
// =================================================================

function initIndexPageScript() {
    console.log('Initializing index page script (filters and events)...');
    
    // Kiểm tra xem có đang ở trang chủ không bằng cách tìm #productsGrid
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.log('Not on the index page, skipping script initialization.');
        return;
    }
    
    // Gắn sự kiện cho các thành phần của bộ lọc (chỉ tồn tại ở index.html)
    const filterButton = document.getElementById('filterButton');
    const resetButton = document.getElementById('resetButton');
    
    if (filterButton) {
        filterButton.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts();
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetFilters();
        });
    }
    
    // Xử lý nhấn Enter trên các ô tìm kiếm
    const searchInputs = ['searchId', 'searchNote'].map(id => document.getElementById(id)).filter(Boolean);
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
            }
        });
    });
    
    // Tự động lọc khi thay đổi khoảng giá
    const priceSelect = document.getElementById('searchPrice');
    if (priceSelect) {
        priceSelect.addEventListener('change', filterProducts);
    }
    
    console.log('Index page filter script initialized successfully.');
    // LƯU Ý: Việc tải và hiển thị sản phẩm lần đầu sẽ do main.js điều khiển bằng cách gọi hàm window.renderApiProducts.
}

// =================================================================
// MAIN INITIALIZATION
// =================================================================

// Đợi DOM được tải hoàn toàn rồi mới chạy script khởi tạo
document.addEventListener('DOMContentLoaded', initIndexPageScript);

// =================================================================
// GLOBAL EXPORTS (Để main.js và các script khác có thể gọi)
// =================================================================

window.renderApiProducts = renderApiProducts;
window.filterProducts = filterProducts;
window.resetFilters = resetFilters;
window.updatePostProductButton = updatePostProductButton;
window.checkPostPermission = checkPostPermission;
window.showAddProductModal = showAddProductModal;
window.hideAddProductModal = hideAddProductModal;

console.log('Script.js (for Index Page) loaded successfully and is ready for main.js');
