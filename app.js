// Common JavaScript for both pages

document.addEventListener('DOMContentLoaded', function() {
    // Back to Top Button
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Format price function
    window.formatPrice = function(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    
    // Show toast notification
    window.showToast = function(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.className = 'toast ' + type;
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.add('visible');
        
        setTimeout(function() {
            toast.classList.remove('visible');
        }, 3000);
    };
});

// For index.html
function loadProducts() {
    // This would be replaced with actual API call in production
    console.log('Loading products...');
}

function filterProducts() {
    // This would be replaced with actual filtering logic in production
    console.log('Filtering products...');
}

function resetFilters() {
    // This would be replaced with actual reset logic in production
    console.log('Resetting filters...');
}