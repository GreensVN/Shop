// script.js (CHỈ DÀNH CHO TRANG INDEX.HTML)

// =================================================================
// BƯỚC 1: ĐỊNH NGHĨA TẤT CẢ BIẾN VÀ HÀM TRƯỚC
// =================================================================

// Dữ liệu sản phẩm mẫu (cục bộ cho trang index)
const sampleProducts = [
    {
        id: 1,
        title: "Gói VIP 1 Tháng",
        description: "Tài khoản VIP Grow A Garden với đầy đủ đặc quyền",
        price: 150000,
        oldPrice: 200000,
        image: "images/product1.jpg",
        sales: 100,
        badge: "HOT",
        details: {
            features: ["Đầy đủ tính năng VIP", "Hỗ trợ 24/7", "Quà tặng hàng tháng"],
            description: "Gói VIP 1 tháng cung cấp cho bạn trải nghiệm tốt nhất với đầy đủ các tính năng cao cấp..."
        }
    },
    {
        id: 2,
        title: "Gói Premium 3 Tháng",
        description: "Tài khoản Premium Grow A Garden với nhiều ưu đãi",
        price: 400000,
        oldPrice: 450000,
        image: "images/product2.jpg",
        sales: 75,
        badge: null,
        details: {
            features: ["Tính năng Premium", "Hỗ trợ nhanh", "Quà tặng định kỳ"],
            description: "Gói Premium 3 tháng là lựa chọn tiết kiệm cho những ai muốn trải nghiệm lâu dài..."
        }
    }
];

// Hàm render (vẽ) các sản phẩm mẫu ra màn hình
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return; // Kiểm tra an toàn
    productsGrid.innerHTML = '';
    
    sampleProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        
        // Đoạn code HTML bên trong thẻ sản phẩm (giữ nguyên logic của bạn)
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
                        <span class="product-current-price">${formatPrice(product.price)}đ</span>
                        ${product.oldPrice ? `<span class="product-old-price">${formatPrice(product.oldPrice)}đ</span>` : ''}
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
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return; // Kiểm tra an toàn

    // Hiển thị loading spinner
    productsGrid.innerHTML = `<div class="fade-in" style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary-color);"></i></div>`;
    
    // Giả lập gọi API và render sau 800ms
    setTimeout(renderProducts, 800);
}

// Hàm định dạng giá tiền
function formatPrice(price) {
    return price.toLocaleString('vi-VN');
}

// Hàm lọc sản phẩm
function filterProducts() {
    console.log("Filter function called");
    // Logic lọc sản phẩm thực tế sẽ được thêm vào đây
}

// Hàm reset bộ lọc
function resetFilters() {
    const idInput = document.getElementById('id');
    const priceInput = document.getElementById('price');
    const ghichuInput = document.getElementById('ghichu');

    if (idInput) idInput.value = '';
    if (priceInput) priceInput.value = '';
    if (ghichuInput) ghichuInput.value = '';
    loadProducts();
}

// Hàm thêm vào yêu thích
function addToWishlist(productId) {
    console.log("Add to wishlist:", productId);
    // Logic thêm vào yêu thích thực tế sẽ được thêm vào đây
}

// =================================================================
// BƯỚC 2: KHỞI CHẠY CODE SAU KHI TRANG ĐÃ TẢI XONG
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Chỉ chạy các hành động này nếu đang ở trang chủ (có các phần tử tương ứng)
    if (document.getElementById('productsGrid') && document.getElementById('filterButton')) {
        // 1. Tải sản phẩm
        loadProducts();

        // 2. Đăng ký sự kiện cho các nút lọc
        document.getElementById('filterButton').addEventListener('click', filterProducts);
        document.getElementById('resetButton').addEventListener('click', resetFilters);
    }
});
