// Load products on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadProducts();
            
            // Sample product data
            const products = [
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
            
            // Render products safely
            function renderProducts() {
                const productsGrid = document.getElementById('productsGrid');
                productsGrid.innerHTML = '';
                
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card fade-in';
                    
                    // Create DOM elements safely
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'product-image';
                    
                    const img = document.createElement('img');
                    img.src = product.image;
                    img.alt = product.title;
                    img.loading = 'lazy';
                    imageDiv.appendChild(img);
                    
                    if (product.badge) {
                        const badge = document.createElement('span');
                        badge.className = 'product-badge';
                        badge.textContent = product.badge;
                        imageDiv.appendChild(badge);
                    }
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'product-info';
                    
                    const title = document.createElement('h3');
                    title.className = 'product-title';
                    title.textContent = product.title;
                    infoDiv.appendChild(title);
                    
                    const desc = document.createElement('p');
                    desc.className = 'product-description';
                    desc.textContent = product.description;
                    infoDiv.appendChild(desc);
                    
                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'product-price';
                    
                    const priceContainer = document.createElement('div');
                    const currentPrice = document.createElement('span');
                    currentPrice.className = 'product-current-price';
                    currentPrice.textContent = formatPrice(product.price) + 'đ';
                    priceContainer.appendChild(currentPrice);
                    
                    if (product.oldPrice) {
                        const oldPrice = document.createElement('span');
                        oldPrice.className = 'product-old-price';
                        oldPrice.textContent = formatPrice(product.oldPrice) + 'đ';
                        priceContainer.appendChild(oldPrice);
                    }
                    
                    priceDiv.appendChild(priceContainer);
                    
                    const sales = document.createElement('span');
                    sales.className = 'product-sales';
                    sales.innerHTML = '<i class="fas fa-user"></i> ' + product.sales;
                    priceDiv.appendChild(sales);
                    
                    infoDiv.appendChild(priceDiv);
                    
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'product-actions';
                    
                    const buyBtn = document.createElement('a');
                    buyBtn.href = 'product.html?id=' + encodeURIComponent(product.id);
                    buyBtn.className = 'btn-add-to-cart';
                    buyBtn.innerHTML = '<i class="fas fa-shopping-cart"></i><span>Mua Ngay</span>';
                    actionsDiv.appendChild(buyBtn);
                    
                    const wishBtn = document.createElement('button');
                    wishBtn.className = 'btn-wishlist';
                    wishBtn.setAttribute('aria-label', 'Thêm vào yêu thích');
                    wishBtn.innerHTML = '<i class="far fa-heart"></i>';
                    wishBtn.addEventListener('click', function() {
                        addToWishlist(product.id);
                    });
                    actionsDiv.appendChild(wishBtn);
                    
                    infoDiv.appendChild(actionsDiv);
                    
                    productCard.appendChild(imageDiv);
                    productCard.appendChild(infoDiv);
                    
                    productsGrid.appendChild(productCard);
                });
            }
            
            function formatPrice(price) {
                return price.toLocaleString('vi-VN');
            }
            
            function loadProducts() {
                // Show loading
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'fade-in';
                loadingDiv.style.gridColumn = '1/-1';
                loadingDiv.style.textAlign = 'center';
                loadingDiv.style.padding = '40px';
                
                const spinner = document.createElement('i');
                spinner.className = 'fas fa-spinner fa-spin fa-2x';
                spinner.style.color = 'var(--primary-color)';
                
                loadingDiv.appendChild(spinner);
                document.getElementById('productsGrid').appendChild(loadingDiv);
                
                // Simulate API call
                setTimeout(renderProducts, 800);
            }

            // Đăng ký sự kiện cho nút lọc
            document.getElementById('filterButton').addEventListener('click', filterProducts);
            document.getElementById('resetButton').addEventListener('click', resetFilters);
            
            // Hàm lọc sản phẩm
            window.filterProducts = function() {
                console.log("Filter function called");
                // Logic lọc sản phẩm thực tế
            }
            
            // Hàm reset bộ lọc
            window.resetFilters = function() {
                document.getElementById('id').value = '';
                document.getElementById('price').value = '';
                document.getElementById('ghichu').value = '';
                loadProducts();
            }
            
            // Hàm thêm vào yêu thích
            window.addToWishlist = function(productId) {
                console.log("Add to wishlist:", productId);
                // Logic thêm vào yêu thích
            }
        });
