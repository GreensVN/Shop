// script.js - Phiên bản cuối cùng, dành cho trang INDEX.HTML
// Tương thích hoàn toàn với main.js, sử dụng dữ liệu từ API.

"use strict";

// =================================================================
// HÀM RENDER VÀ QUẢN LÝ SẢN PHẨM (Sử dụng dữ liệu API)
// =================================================================

// Dữ liệu sản phẩm mẫu (cục bộ cho trang index)
const localSampleProducts = [
    {
        id: 1,
        title: "Raccoon",
        description: "Raccoon",
        price: 250000,
        oldPrice: 300000,
        image: "https://i.ibb.co/Vc8YddCj/s-l1200.png",
        sales: 100,
        badge: "HOT",
        details: {
            features: ["Đầy đủ tính năng VIP", "Hỗ trợ 24/7", "Quà tặng hàng tháng"],
            description: "Gói VIP 1 tháng cung cấp cho bạn trải nghiệm tốt nhất với đầy đủ các tính năng cao cấp..."
        }
    },
    {
        id: 2,
        title: "Mimic Octopus",
        description: "Mimic Octopus",
        price: 70000,
        oldPrice: 100000,
        image: "https://i.ibb.co/d02TTqSw/ab66bab0-c4f1-4130-bb23-b689337484a2.jpg",
        sales: 75,
        badge: null,
        details: {
            features: ["Tính năng Premium", "Hỗ trợ nhanh", "Quà tặng định kỳ"],
            description: "Gói Premium 3 tháng là lựa chọn tiết kiệm cho những ai muốn trải nghiệm lâu dài..."
        }
    }
];

// Hàm render (vẽ) các sản phẩm mẫu ra màn hình
function renderLocalProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return; // Kiểm tra an toàn
    productsGrid.innerHTML = '';
    
    localSampleProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        
        // Sử dụng window.formatPrice từ main.js
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    <div>
                        <span class="product-current-price">${window.formatPrice(product.price)}đ</span>
                        ${product.oldPrice ? `<span class="product-old-price">${window.formatPrice(product.oldPrice)}đ</span>` : ''}
                    </div>
                    <span class="product-sales"><i class="fas fa-user"></i> ${product.sales}</span>
                </div>
                <div class="product-actions">
                    <a href="product.html?id=${encodeURIComponent(product.id)}" class="btn-add-to-cart">
                        <i class="fas fa-shopping-cart"></i><span>Mua Ngay</span>
                    </a>
                    <button class="btn-wishlist" aria-label="Thêm vào yêu thích" onclick="addToWishlist(${product.id})">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Hàm tải sản phẩm (phiên bản cục bộ, dùng dữ liệu mẫu)
function loadLocalProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return; // Kiểm tra an toàn

    // Hiển thị loading spinner
    productsGrid.innerHTML = `<div class="fade-in" style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary-color);"></i></div>`;
    
    // Giả lập gọi API và render sau 800ms
    setTimeout(renderLocalProducts, 800);
}

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
                    <button class="btn-favorite" title="Thêm vào yêu thích" data-id="${product._id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <a href="product.html?id=${encodeURIComponent(product._id)}" class="btn-view" title="Xem chi tiết">
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
                    <button class="btn btn-primary add-to-cart" data-id="${product._id}">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Mua Ngay</span>
                    </button>
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
    // Nút "Thêm vào giỏ hàng"
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!window.currentUser) {
                window.Utils?.showToast('Vui lòng đăng nhập để mua hàng!', 'info');
                document.getElementById('loginButton')?.click();
                return;
            }

            const productId = e.currentTarget.dataset.id;
            try {
                await window.CartManager.add(productId, 1);
                window.Utils?.showToast('Đã thêm vào giỏ hàng!', 'success');
                const icon = btn.querySelector('i');
                if (icon) {
                    btn.disabled = true;
                    icon.className = 'fas fa-check';
                    setTimeout(() => { 
                        icon.className = 'fas fa-shopping-cart'; 
                        btn.disabled = false;
                    }, 1500);
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                window.Utils?.showToast(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
            }
        });
    });
    
    // Nút "Yêu thích"
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
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
                    // Cần có toàn bộ object product để thêm vào local, nên ta tìm nó
                    const productData = window.allProducts?.find(p => p._id === productId);
                    if (productData) {
                        await window.FavoriteManager.add(productData);
                        window.Utils?.showToast('Đã thêm vào yêu thích!', 'success');
                    } else {
                         throw new Error('Không tìm thấy thông tin sản phẩm.');
                    }
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

console.log('Script.js (for Index Page) loaded successfully and is ready for main.js');

