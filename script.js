// script.js - Fixed 100% - CHỈ DÀNH CHO TRANG INDEX.HTML
// Tương thích hoàn toàn với main.js

"use strict";

// =================================================================
// DỮ LIỆU SẢN PHẨM MẪU CỤC BỘ
// =================================================================

const localSampleProducts = [
    {
        id: "001",
        _id: "001", // Thêm _id để tương thích với backend
        title: "Raccoon",
        description: "Thú cưng gấu mèo dễ thương, thông minh và năng động. Được huấn luyện cơ bản, thân thiện với con người.",
        price: 250000,
        oldPrice: 300000,
        image: "https://i.imgur.com/ZoX9VKo.png",
        images: ["https://i.imgur.com/ZoX9VKo.png"], // Thêm images array để tương thích
        sales: 100,
        badge: "HOT",
        note: "thú cưng biển độc đáo",
        category: "pet",
        stock: 3,
        details: {
            features: ["Khả năng bắt chước tuyệt vời", "Dễ chăm sóc", "Thức ăn đặc biệt đi kèm", "Hướng dẫn nuôi chi tiết"],
            description: "Mimic Octopus là một trong những loài bạch tuộc thông minh nhất, có khả năng bắt chước hình dạng và màu sắc của nhiều loài sinh vật biển khác."
        }
    },
    {
        id: "003",
        _id: "003",
        title: "Mini Garden Kit",
        description: "Bộ kit trồng cây mini hoàn chỉnh, phù hợp cho người mới bắt đầu học trồng trọt.",
        price: 150000,
        oldPrice: 200000,
        image: "https://i.imgur.com/placeholder1.png",
        images: ["https://i.imgur.com/placeholder1.png"],
        sales: 200,
        badge: "NEW",
        note: "bộ trồng cây mini",
        category: "plant",
        stock: 10,
        details: {
            features: ["Đầy đủ dụng cụ", "Hạt giống chất lượng cao", "Hướng dẫn chi tiết", "Phân bón hữu cơ"],
            description: "Bộ kit trồng cây mini bao gồm tất cả những gì bạn cần để bắt đầu hành trình trồng trọt của mình."
        }
    },
    {
        id: "004",
        _id: "004",
        title: "Gaming Account Premium",
        description: "Tài khoản game premium với nhiều skin và item hiếm, đã được verify và bảo mật cao.",
        price: 500000,
        oldPrice: 750000,
        image: "https://i.imgur.com/placeholder2.png",
        images: ["https://i.imgur.com/placeholder2.png"],
        sales: 50,
        badge: "VIP",
        note: "tài khoản game premium",
        category: "gaming",
        stock: 2,
        details: {
            features: ["Rank cao", "Nhiều skin hiếm", "Đã verify email và phone", "Bảo hành 6 tháng"],
            description: "Tài khoản game premium với đầy đủ tính năng VIP, phù hợp cho game thủ chuyên nghiệp."
        }
    }
];

// =================================================================
// HÀM RENDER VÀ QUẢN LÝ SẢN PHẨM
// =================================================================

function renderLocalProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.warn('Products grid not found');
        return;
    }

    console.log('Rendering', localSampleProducts.length, 'products');
    
    // Clear existing content
    productsGrid.innerHTML = '';
    
    localSampleProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.dataset.id = product.id;
        productCard.dataset.price = product.price;
        productCard.dataset.note = product.note || '';
        productCard.dataset.category = product.category || '';
        
        // Calculate discount percentage
        const discountPercent = product.oldPrice ? 
            Math.round((product.oldPrice - product.price) / product.oldPrice * 100) : 0;
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                <div class="product-overlay">
                    <button class="btn-favorite" title="Thêm vào yêu thích" data-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <a href="product.html?id=${encodeURIComponent(product.id)}" class="btn-view" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    <div class="price-container">
                        <span class="product-current-price">${window.formatPrice ? window.formatPrice(product.price) : product.price.toLocaleString('vi-VN')}đ</span>
                        ${product.oldPrice ? `<span class="product-old-price">${window.formatPrice ? window.formatPrice(product.oldPrice) : product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                    </div>
                    <div class="product-meta">
                        <span class="product-sales"><i class="fas fa-user"></i> ${product.sales}</span>
                        <span class="product-stock"><i class="fas fa-box"></i> ${product.stock}</span>
                    </div>
                </div>
                <div class="product-id">ID: #${product.id}</div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Mua Ngay</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add animation delay
        productCard.style.animationDelay = `${index * 0.1}s`;
        
        productsGrid.appendChild(productCard);
    });
    
    // Attach event listeners after rendering
    attachProductEventListeners();
    updateFavoriteButtonStates();
    
    console.log('Products rendered successfully');
}

function attachProductEventListeners() {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const productId = e.currentTarget.dataset.id;
            const product = localSampleProducts.find(p => p.id === productId);
            
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }
            
            try {
                // Use CartManager from main.js if available
                if (window.CartManager) {
                    await window.CartManager.add(productId);
                } else {
                    // Fallback to manual cart management
                    addToCartFallback(product);
                }
                
                // Use Utils.showToast from main.js if available
                if (window.Utils && window.Utils.showToast) {
                    window.Utils.showToast('Đã thêm vào giỏ hàng!', 'success');
                } else {
                    alert('Đã thêm vào giỏ hàng!');
                }
                
                // Add button animation
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check';
                    setTimeout(() => {
                        icon.className = 'fas fa-shopping-cart';
                    }, 1000);
                }
                
            } catch (error) {
                console.error('Error adding to cart:', error);
                if (window.Utils && window.Utils.showToast) {
                    window.Utils.showToast('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
                }
            }
        });
    });
    
    // Favorite buttons
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const productId = e.currentTarget.dataset.id;
            const product = localSampleProducts.find(p => p.id === productId);
            
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }
            
            try {
                let isFavorite = false;
                
                // Use FavoriteManager from main.js if available
                if (window.FavoriteManager) {
                    isFavorite = await window.FavoriteManager.isFavorite(productId);
                    
                    if (isFavorite) {
                        await window.FavoriteManager.remove(productId);
                        if (window.Utils && window.Utils.showToast) {
                            window.Utils.showToast('Đã xóa khỏi yêu thích', 'info');
                        }
                    } else {
                        await window.FavoriteManager.add(product);
                        if (window.Utils && window.Utils.showToast) {
                            window.Utils.showToast('Đã thêm vào yêu thích!', 'success');
                        }
                    }
                } else {
                    // Fallback to manual favorite management
                    toggleFavoriteFallback(product, btn);
                }
                
                // Update button state
                updateFavoriteButtonState(btn, !isFavorite);
                
            } catch (error) {
                console.error('Error toggling favorite:', error);
                if (window.Utils && window.Utils.showToast) {
                    window.Utils.showToast('Có lỗi xảy ra', 'error');
                }
            }
        });
    });
}

async function updateFavoriteButtonStates() {
    if (!window.FavoriteManager) return;
    
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    
    for (const btn of favoriteButtons) {
        const productId = btn.dataset.id;
        const isFavorite = await window.FavoriteManager.isFavorite(productId);
        updateFavoriteButtonState(btn, isFavorite);
    }
}

function updateFavoriteButtonState(button, isFavorite) {
    const icon = button.querySelector('i');
    if (!icon) return;
    
    if (isFavorite) {
        button.classList.add('active');
        icon.className = 'fas fa-heart';
        button.style.color = '#ef4444';
    } else {
        button.classList.remove('active');
        icon.className = 'far fa-heart';
        button.style.color = '';
    }
}

// =================================================================
// FALLBACK FUNCTIONS (Khi main.js chưa load)
// =================================================================

function addToCartFallback(product) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountFallback();
}

function toggleFavoriteFallback(product, button) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.findIndex(p => p.id === product.id);
    
    if (index > -1) {
        favorites.splice(index, 1);
        updateFavoriteButtonState(button, false);
    } else {
        favorites.push(product);
        updateFavoriteButtonState(button, true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateCartCountFallback() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// =================================================================
// HÀM TẢI VÀ HIỂN THỊ SẢN PHẨM
// =================================================================

function loadLocalProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.warn('Products grid not found, skipping product load');
        return;
    }

    console.log('Loading local products...');
    
    // Show loading spinner
    productsGrid.innerHTML = `
        <div class="loading-container" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <p style="color: #666; font-size: 16px; margin: 0;">Đang tải sản phẩm...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Simulate API call delay and render products
    setTimeout(() => {
        renderLocalProducts();
    }, 800);
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
        const cardCategory = (card.dataset.category || '').toLowerCase();
        
        let isVisible = true;
        
        // Filter by ID
        if (searchId && !cardId.includes(searchId)) {
            isVisible = false;
        }
        
        // Filter by note/description
        if (searchNote && !cardNote.includes(searchNote) && !cardCategory.includes(searchNote)) {
            isVisible = false;
        }
        
        // Filter by price range
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
        
        // Apply filter
        if (isVisible) {
            card.style.display = 'block';
            card.style.animation = 'fadeInAnimation 0.5s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show filter result message
    showFilterResult(visibleCount);
    
    console.log(`Filter applied. ${visibleCount} products visible.`);
}

function resetFilters() {
    console.log('Resetting filters...');
    
    // Clear filter inputs
    const searchId = document.getElementById('searchId');
    const searchPrice = document.getElementById('searchPrice');
    const searchNote = document.getElementById('searchNote');
    
    if (searchId) searchId.value = '';
    if (searchPrice) searchPrice.value = '';
    if (searchNote) searchNote.value = '';
    
    // Show all products
    let totalCount = 0;
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'block';
        card.style.animation = 'fadeInAnimation 0.3s ease-out';
        totalCount++;
    });
    
    // Hide filter result message
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
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
        `;
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.insertBefore(resultMessage, productsGrid.firstChild);
        }
    }
    
    resultMessage.innerHTML = `
        <i class="fas fa-search" style="margin-right: 8px; color: #007bff;"></i>
        <strong>Kết quả lọc:</strong> Tìm thấy ${count} sản phẩm phù hợp
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
    console.log('Initializing index page script...');
    
    // Check if we're on the index page
    const productsGrid = document.getElementById('productsGrid');
    const filterButton = document.getElementById('filterButton');
    const resetButton = document.getElementById('resetButton');
    
    if (!productsGrid) {
        console.log('Not on index page, skipping script initialization');
        return;
    }
    
    // Load products
    loadLocalProducts();
    
    // Attach filter event listeners
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
    
    // Handle enter key in search inputs
    const searchInputs = ['searchId', 'searchNote'].map(id => document.getElementById(id)).filter(Boolean);
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
            }
        });
    });
    
    // Handle change in price select
    const priceSelect = document.getElementById('searchPrice');
    if (priceSelect) {
        priceSelect.addEventListener('change', () => {
            // Auto-filter when price range changes
            filterProducts();
        });
    }
    
    console.log('Index page script initialized successfully');
}

// =================================================================
// COMPATIBILITY CHECK & INITIALIZATION
// =================================================================

function checkCompatibility() {
    const requiredFeatures = [
        'localStorage',
        'JSON',
        'fetch',
        'Promise'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => {
        return typeof window[feature] === 'undefined';
    });
    
    if (missingFeatures.length > 0) {
        console.error('Missing required features:', missingFeatures);
        return false;
    }
    
    return true;
}

// =================================================================
// MAIN INITIALIZATION
// =================================================================

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js: DOM Content Loaded');
    
    // Check browser compatibility
    if (!checkCompatibility()) {
        console.error('Browser not supported');
        return;
    }
    
    // Wait a bit for main.js to load and initialize
    setTimeout(() => {
        initIndexPageScript();
    }, 100);
});

// Also handle the case where DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    console.log('Script.js: Document still loading');
} else {
    console.log('Script.js: Document already loaded');
    setTimeout(() => {
        initIndexPageScript();
    }, 100);
}

// =================================================================
// GLOBAL EXPORTS (For compatibility)
// =================================================================

// Make functions available globally if needed
window.localSampleProducts = localSampleProducts;
window.renderLocalProducts = renderLocalProducts;
window.loadLocalProducts = loadLocalProducts;
window.filterProducts = filterProducts;
window.resetFilters = resetFilters;

// Legacy support for older function names
window.addToWishlist = function(productId) {
    const product = localSampleProducts.find(p => p.id === productId);
    if (product) {
        const btn = document.querySelector(`.btn-favorite[data-id="${productId}"]`);
        if (btn) {
            btn.click();
        }
    }
};

console.log('Script.js loaded successfully');thú cưng dễ thương",
        category: "pet",
        stock: 5,
        details: {
            features: ["Thân thiện với trẻ em", "Đã tiêm vaccine đầy đủ", "Được huấn luyện cơ bản", "Kèm theo giấy tờ hợp lệ"],
            description: "Raccoon là loại thú cưng thông minh và dễ thương, phù hợp để nuôi làm thú cưng gia đình. Chúng rất trung thành và gắn bó với chủ nhân."
        }
    },
    {
        id: "002",
        _id: "002",
        title: "Mimic Octopus",
        description: "Bạch tuộc mimic có khả năng bắt chước nhiều loài sinh vật biển khác, rất độc đáo và thú vị.",
        price: 70000,
        oldPrice: 100000,
        image: "https://i.imgur.com/8pYhB3m.png",
        images: ["https://i.imgur.com/8pYhB3m.png"],
        sales: 75,
        badge: "SALE",
        note: "
