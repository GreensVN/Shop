// devtools-protection.js - Fixed DevTools Protection System
"use strict";

/**
 * DevTools Protection System - Chỉ cho phép Admin sử dụng DevTools
 */
class DevToolsProtection {
    constructor() {
        this.isDevToolsOpen = false;
        this.checkInterval = null;
        this.protectedPages = ['account.html', 'index.html', 'product.html'];
        this.warningCount = 0;
        this.maxWarnings = 3;
        this.isBlocked = false;
        this.threshold = 160; // DevTools detection threshold
        
        console.log('🛡️ DevTools Protection constructor called');
        this.init();
    }

    /**
     * Khởi tạo hệ thống bảo vệ
     */
    init() {
        console.log('🛡️ DevTools Protection init started');
        
        // Chỉ khởi động bảo vệ trên các trang được chỉ định
        if (this.shouldProtect()) {
            console.log('✅ Protection activated for this page');
            this.startProtection();
            this.addAntiDebugMethods();
            this.blockCommonShortcuts();
            this.addVisibilityChangeHandler();
        } else {
            console.log('ℹ️ No protection needed for this page');
        }
    }

    /**
     * Kiểm tra xem trang hiện tại có cần bảo vệ không
     */
    shouldProtect() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const needsProtection = this.protectedPages.some(page => 
            currentPage.includes(page.replace('.html', ''))
        ) || currentPage === '' || currentPage === 'index.html';
        
        console.log('📄 Current page:', currentPage, '| Needs protection:', needsProtection);
        return needsProtection;
    }

    /**
     * Kiểm tra quyền admin
     */
    isAdmin() {
        try {
            // Kiểm tra từ window.currentUser trước
            if (window.currentUser) {
                const isAdminUser = window.currentUser.role === 'admin';
                console.log('👤 Admin check (window.currentUser):', isAdminUser);
                return isAdminUser;
            }
            
            // Fallback: kiểm tra từ localStorage
            const user = JSON.parse(localStorage.getItem('gag_user') || '{}');
            const isAdminUser = user && user.role === 'admin';
            console.log('👤 Admin check (localStorage):', isAdminUser, '| User role:', user?.role);
            return isAdminUser;
        } catch (error) {
            console.error('❌ Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Bắt đầu hệ thống bảo vệ
     */
    startProtection() {
        console.log('🚀 Starting protection systems...');
        
        // Kiểm tra liên tục DevTools
        this.checkInterval = setInterval(() => {
            this.detectDevTools();
        }, 500);

        console.log('✅ DevTools detection interval started');
    }

    /**
     * Phát hiện DevTools
     */
    detectDevTools() {
        if (this.isAdmin()) {
            // Admin được phép - không làm gì cả
            return;
        }

        // Phương pháp 1: Kiểm tra kích thước window
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        if (widthDiff > this.threshold || heightDiff > this.threshold) {
            if (!this.isDevToolsOpen) {
                this.isDevToolsOpen = true;
                this.handleDevToolsDetected();
            }
        } else {
            this.isDevToolsOpen = false;
        }

        // Phương pháp 2: Kiểm tra console timing
        this.checkConsoleDebugging();
    }

    /**
     * Kiểm tra console debugging
     */
    checkConsoleDebugging() {
        if (this.isAdmin()) return;

        // Kiểm tra timing để phát hiện DevTools
        const start = performance.now();
        console.log(''); // Dummy log
        const end = performance.now();
        
        // Nếu console.log chậm hơn bình thường -> DevTools đang mở
        if (end - start > 1) {
            this.handleDevToolsDetected();
        }
    }

    /**
     * Xử lý khi phát hiện DevTools
     */
    handleDevToolsDetected() {
        if (this.isAdmin()) {
            console.log('👑 Admin detected - DevTools allowed');
            return;
        }

        this.warningCount++;
        
        console.clear();
        console.log('%c🚫 CẢNH BÁO BẢO MẬT', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cViệc mở Developer Tools không được phép!', 'color: red; font-size: 14px;');
        console.log(`%cCảnh báo ${this.warningCount}/${this.maxWarnings}`, 'color: orange; font-size: 12px;');

        // Hiển thị modal cảnh báo
        this.showWarningModal();

        if (this.warningCount >= this.maxWarnings) {
            this.blockAccess();
        }
    }

    /**
     * Hiển thị modal cảnh báo
     */
    showWarningModal() {
        if (this.isAdmin()) return;

        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('devtools-warning-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'devtools-warning-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                ">
                    <div style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="color: #e74c3c; margin-bottom: 15px;">CẢNH BÁO BẢO MẬT</h2>
                    <p style="color: #333; margin-bottom: 20px; line-height: 1.5;">
                        Việc mở Developer Tools không được phép trên trang này.<br>
                        <strong>Cảnh báo: ${this.warningCount}/${this.maxWarnings}</strong>
                    </p>
                    <button id="close-warning" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">Đã hiểu</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Tự động đóng sau 3 giây
        setTimeout(() => {
            if (modal && modal.parentNode) modal.remove();
        }, 3000);

        // Đóng khi click nút
        const closeBtn = modal.querySelector('#close-warning');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal && modal.parentNode) modal.remove();
            });
        }
    }

    /**
     * Chặn hoàn toàn truy cập
     */
    blockAccess() {
        if (this.isAdmin()) return;

        this.isBlocked = true;
        
        console.log('🚫 Blocking access due to repeated violations');
        
        // Clear tất cả intervals
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Block toàn bộ trang
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: white;
            ">
                <div style="text-align: center;">
                    <div style="font-size: 72px; margin-bottom: 30px;">🚫</div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">TRUY CẬP BỊ CHẶN</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">
                        Bạn đã vi phạm chính sách bảo mật của website
                    </p>
                    <p style="opacity: 0.7;">Đang chuyển hướng về trang chủ...</p>
                </div>
            </div>
        `;

        // Chuyển hướng về trang chủ sau 2 giây
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    /**
     * Chặn các phím tắt phổ biến
     */
    blockCommonShortcuts() {
        console.log('⌨️ Blocking common shortcuts...');
        
        // Ngăn phím tắt
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), { passive: false, capture: true });
        
        // Ngăn chuột phải
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e), { passive: false, capture: true });
        
        // Ngăn select text
        document.addEventListener('selectstart', (e) => this.handleSelectStart(e), { passive: false, capture: true });
        
        console.log('✅ Shortcut blocking activated');
    }

    /**
     * Xử lý phím tắt
     */
    handleKeyDown(e) {
        if (this.isAdmin()) return;

        let blocked = false;
        let message = '';

        // F12
        if (e.keyCode === 123) {
            blocked = true;
            message = 'F12 không được phép!';
        }
        // Ctrl+Shift+I (Dev Tools)
        else if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            blocked = true;
            message = 'Ctrl+Shift+I không được phép!';
        }
        // Ctrl+U (View Source)
        else if (e.ctrlKey && e.keyCode === 85) {
            blocked = true;
            message = 'Ctrl+U không được phép!';
        }
        // Ctrl+S (Save)
        else if (e.ctrlKey && e.keyCode === 83) {
            blocked = true;
            message = 'Ctrl+S không được phép!';
        }
        // Ctrl+A (Select All)
        else if (e.ctrlKey && e.keyCode === 65) {
            blocked = true;
            message = 'Ctrl+A không được phép!';
        }
        // Ctrl+P (Print)
        else if (e.ctrlKey && e.keyCode === 80) {
            blocked = true;
            message = 'Ctrl+P không được phép!';
        }
        // Ctrl+Shift+C (Inspect Element)
        else if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            blocked = true;
            message = 'Ctrl+Shift+C không được phép!';
        }

        if (blocked) {
            e.preventDefault();
            e.stopPropagation();
            this.showQuickWarning(message);
            return false;
        }
    }

    /**
     * Xử lý chuột phải
     */
    handleContextMenu(e) {
        if (this.isAdmin()) return;

        e.preventDefault();
        e.stopPropagation();
        this.showQuickWarning('Chuột phải không được phép!');
        return false;
    }

    /**
     * Xử lý select text
     */
    handleSelectStart(e) {
        if (this.isAdmin()) return;

        // Cho phép select trong input và textarea
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    /**
     * Hiển thị cảnh báo nhanh
     */
    showQuickWarning(message) {
        // Xóa warning cũ nếu có
        const existingWarning = document.getElementById('quick-warning');
        if (existingWarning) existingWarning.remove();

        // Tạo thông báo nhanh
        const warning = document.createElement('div');
        warning.id = 'quick-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInWarning 0.3s ease;
            pointer-events: none;
        `;
        warning.textContent = message;

        // Thêm animation CSS nếu chưa có
        if (!document.getElementById('warning-animation-style')) {
            const style = document.createElement('style');
            style.id = 'warning-animation-style';
            style.textContent = `
                @keyframes slideInWarning {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(warning);

        // Tự động xóa sau 2 giây
        setTimeout(() => {
            if (warning && warning.parentNode) {
                warning.remove();
            }
        }, 2000);
    }

    /**
     * Thêm các phương pháp chống debug
     */
    addAntiDebugMethods() {
        if (this.isAdmin()) return;

        console.log('🔒 Adding anti-debug methods...');

        // Làm rối console
        setInterval(() => {
            if (this.isAdmin()) return;
            
            console.clear();
            console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cĐây là tính năng dành cho Developer. Nếu bạn không phải admin, việc sử dụng có thể vi phạm bảo mật.', 'color: red; font-size: 16px;');
        }, 2000);

        // Ngăn debug (but don't overuse to avoid performance issues)
        let debugCounter = 0;
        const debugInterval = setInterval(() => {
            if (this.isAdmin()) {
                clearInterval(debugInterval);
                return;
            }
            
            if (debugCounter < 10) { // Only run 10 times to avoid blocking page
                debugger;
                debugCounter++;
            } else {
                clearInterval(debugInterval);
            }
        }, 1000);
    }

    /**
     * Thêm handler cho visibility change
     */
    addVisibilityChangeHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isBlocked) {
                // Nếu user quay lại tab sau khi bị block
                console.log('🚫 User returned to blocked tab - redirecting...');
                window.location.href = 'index.html';
            }
        });
    }

    /**
     * Hủy bỏ protection (chỉ admin có thể gọi)
     */
    destroy() {
        if (!this.isAdmin()) {
            console.log('❌ Only admin can destroy protection');
            return false;
        }

        console.log('🗑️ Destroying DevTools protection...');
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        document.removeEventListener('selectstart', this.handleSelectStart);
        
        console.log('✅ DevTools protection destroyed');
        return true;
    }
}

// =================================================================
// ADMIN MANAGEMENT CLASS
// =================================================================

class AdminDevToolsManager {
    /**
     * Kích hoạt DevTools cho admin
     */
    static enableDevTools() {
        const user = window.currentUser || JSON.parse(localStorage.getItem('gag_user') || '{}');
        
        if (!user || user.role !== 'admin') {
            console.log('❌ Chỉ admin mới có thể kích hoạt DevTools');
            return false;
        }

        // Hủy bỏ protection
        if (window.devToolsProtection) {
            const destroyed = window.devToolsProtection.destroy();
            if (destroyed) {
                window.devToolsProtection = null;
                console.log('✅ DevTools đã được kích hoạt cho admin');
                console.log('🔧 Admin có thể sử dụng tất cả tính năng debug');
                return true;
            }
        }

        console.log('ℹ️ DevTools protection không hoạt động hoặc đã được tắt');
        return false;
    }

    /**
     * Tắt DevTools protection (khởi tạo lại)
     */
    static disableDevTools() {
        const user = window.currentUser || JSON.parse(localStorage.getItem('gag_user') || '{}');
        
        if (!user || user.role !== 'admin') {
            console.log('❌ Chỉ admin mới có thể tắt DevTools protection');
            return false;
        }

        // Khởi tạo lại protection
        if (!window.devToolsProtection) {
            window.devToolsProtection = new DevToolsProtection();
            console.log('🛡️ DevTools protection đã được kích hoạt lại');
            return true;
        }

        console.log('ℹ️ DevTools protection đã đang hoạt động');
        return false;
    }

    /**
     * Kiểm tra trạng thái protection
     */
    static getStatus() {
        const user = window.currentUser || JSON.parse(localStorage.getItem('gag_user') || '{}');
        const isAdmin = user && user.role === 'admin';
        const protectionActive = !!window.devToolsProtection;
        
        console.log('=== DEVTOOLS PROTECTION STATUS ===');
        console.log('User:', user?.name || 'Anonymous');
        console.log('Role:', user?.role || 'none');
        console.log('Is Admin:', isAdmin);
        console.log('Protection Active:', protectionActive);
        console.log('Can Use DevTools:', isAdmin);
        console.log('===============================');
        
        return {
            user,
            isAdmin,
            protectionActive,
            canUseDevTools: isAdmin
        };
    }
}

// =================================================================
// CONSOLE STYLING & MESSAGES
// =================================================================

function addConsoleStyles() {
    const user = window.currentUser || JSON.parse(localStorage.getItem('gag_user') || '{}');
    
    if (user && user.role === 'admin') {
        console.log('%c👑 ADMIN PANEL', 'background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 10px 20px; border-radius: 10px; font-size: 16px; font-weight: bold;');
        console.log('%cChào mừng Admin! Bạn có thể sử dụng DevTools.', 'color: #4CAF50; font-size: 14px;');
        console.log('%cSử dụng AdminDevToolsManager.enableDevTools() để tắt protection hoàn toàn.', 'color: #2196F3; font-size: 12px;');
        console.log('%cSử dụng AdminDevToolsManager.getStatus() để xem trạng thái.', 'color: #2196F3; font-size: 12px;');
    } else {
        console.log('%c⚠️ CẢNH BÁO', 'background: #e74c3c; color: white; padding: 10px; border-radius: 5px; font-weight: bold;');
        console.log('%cTrang này được bảo vệ khỏi việc sử dụng DevTools trái phép.', 'color: #e74c3c; font-size: 14px;');
    }
}

// =================================================================
// INITIALIZATION FUNCTION
// =================================================================

function initDevToolsProtection() {
    console.log('🔄 Initializing DevTools Protection System...');
    
    const checkUser = () => {
        // Đợi main.js load xong (có thể mất 1-2 giây)
        if (window.Utils && (window.currentUser !== undefined || Date.now() - startTime > 3000)) {
            console.log('🔍 User data available, proceeding with protection init...');
            console.log('👤 Current user role:', window.currentUser?.role || 'none');
            
            try {
                // Khởi tạo protection system
                window.devToolsProtection = new DevToolsProtection();
                window.AdminDevToolsManager = AdminDevToolsManager;
                
                // Style console
                addConsoleStyles();
                
                console.log('✅ DevTools Protection initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize DevTools Protection:', error);
            }
        } else {
            // Chờ 200ms và thử lại
            setTimeout(checkUser, 200);
        }
    };

    const startTime = Date.now();
    checkUser();
}

// =================================================================
// AUTO INITIALIZATION
// =================================================================

// Initialize when DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevToolsProtection);
} else {
    // DOM already loaded
    setTimeout(initDevToolsProtection, 100);
}

// Also init when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !window.devToolsProtection) {
        console.log('👁️ Page visible and no protection - reinitializing...');
        setTimeout(initDevToolsProtection, 500);
    }
});

// Export to window for debugging
window.initDevToolsProtection = initDevToolsProtection;

console.log('🛡️ DevTools Protection Script Loaded Successfully');
