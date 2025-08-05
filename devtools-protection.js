// devtools-protection.js - Hệ thống bảo vệ DevTools chỉ cho Admin
"use strict";

class DevToolsProtection {
    constructor() {
        this.isDevToolsOpen = false;
        this.checkInterval = null;
        this.protectedPages = ['account.html', 'index.html', 'product.html'];
        this.warningCount = 0;
        this.maxWarnings = 3;
        this.isBlocked = false;
        
        this.init();
    }

    init() {
        // Chỉ khởi động bảo vệ trên các trang được chỉ định
        if (this.shouldProtect()) {
            console.log('🛡️ DevTools Protection activated');
            this.startProtection();
            this.addAntiDebugMethods();
            this.blockCommonShortcuts();
            this.addVisibilityChangeHandler();
        }
    }

    shouldProtect() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return this.protectedPages.some(page => currentPage.includes(page.replace('.html', ''))) || 
               currentPage === '' || currentPage === 'index.html';
    }

    isAdmin() {
        // Kiểm tra role admin từ currentUser
        const user = window.currentUser || JSON.parse(localStorage.getItem('gag_user') || '{}');
        const isAdminUser = user && user.role === 'admin';
        console.log('👤 User role check:', { role: user?.role, isAdmin: isAdminUser });
        return isAdminUser;
    }

    startProtection() {
        // Kiểm tra liên tục DevTools
        this.checkInterval = setInterval(() => {
            this.detectDevTools();
        }, 500);

        // Ngăn F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Ngăn chuột phải
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Ngăn select text
        document.addEventListener('selectstart', (e) => this.handleSelectStart(e));
    }

    detectDevTools() {
        if (this.isAdmin()) return; // Admin được phép mở DevTools

        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        // Phát hiện DevTools mở
        if (widthDiff > threshold || heightDiff > threshold) {
            if (!this.isDevToolsOpen) {
                this.isDevToolsOpen = true;
                this.handleDevToolsDetected();
            }
        } else {
            this.isDevToolsOpen = false;
        }

        // Kiểm tra console debugging
        this.checkConsoleDebugging();
    }

    checkConsoleDebugging() {
        if (this.isAdmin()) return;

        let devtools = {
            open: false,
            orientation: null
        };

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.handleDevToolsDetected();
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

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
            if (modal.parentNode) modal.remove();
        }, 3000);

        // Đóng khi click nút
        const closeBtn = modal.querySelector('#close-warning');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
    }

    blockAccess() {
        if (this.isAdmin()) return;

        this.isBlocked = true;
        
        // Clear tất cả intervals
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Chuyển hướng về trang chủ
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

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
    }

    handleKeyDown(e) {
        if (this.isAdmin()) return;

        // Ngăn F12
        if (e.keyCode === 123) {
            e.preventDefault();
            this.showQuickWarning('F12 không được phép!');
            return false;
        }

        // Ngăn Ctrl+Shift+I (Dev Tools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            this.showQuickWarning('Ctrl+Shift+I không được phép!');
            return false;
        }

        // Ngăn Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            this.showQuickWarning('Ctrl+U không được phép!');
            return false;
        }

        // Ngăn Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this.showQuickWarning('Ctrl+S không được phép!');
            return false;
        }

        // Ngăn Ctrl+A (Select All)
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            this.showQuickWarning('Ctrl+A không được phép!');
            return false;
        }

        // Ngăn Ctrl+P (Print)
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            this.showQuickWarning('Ctrl+P không được phép!');
            return false;
        }
    }

    handleContextMenu(e) {
        if (this.isAdmin()) return;

        e.preventDefault();
        this.showQuickWarning('Chuột phải không được phép!');
        return false;
    }

    handleSelectStart(e) {
        if (this.isAdmin()) return;

        // Cho phép select trong input và textarea
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            return;
        }

        e.preventDefault();
        return false;
    }

    showQuickWarning(message) {
        // Tạo thông báo nhanh
        const warning = document.createElement('div');
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
            animation: slideIn 0.3s ease;
        `;
        warning.textContent = message;

        // Thêm animation CSS
        if (!document.getElementById('warning-animation-style')) {
            const style = document.createElement('style');
            style.id = 'warning-animation-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(warning);

        // Tự động xóa sau 2 giây
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 2000);
    }

    addAntiDebugMethods() {
        if (this.isAdmin()) return;

        // Làm rối console
        setInterval(() => {
            console.clear();
            console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cĐây là tính năng dành cho Developer. Nếu bạn không phải admin, việc sử dụng có thể vi phạm bảo mật.', 'color: red; font-size: 16px;');
        }, 1000);

        // Ngăn debug
        setInterval(() => {
            debugger;
        }, 100);
    }

    addVisibilityChangeHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isBlocked) {
                // Nếu user quay lại tab sau khi bị block
                window.location.href = 'index.html';
            }
        });
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        document.removeEventListener('selectstart', this.handleSelectStart);
    }
}

// =================================================================
// ADMIN OVERRIDE FUNCTIONS
// =================================================================

class AdminDevToolsManager {
    static enableDevTools() {
        if (!window.currentUser || window.currentUser.role !== 'admin') {
            console.log('❌ Chỉ admin mới có thể kích hoạt DevTools');
            return false;
        }

        // Hủy bỏ protection
        if (window.devToolsProtection) {
            window.devToolsProtection.destroy();
            window.devToolsProtection = null;
        }

        console.log('✅ DevTools đã được kích hoạt cho admin');
        console.log('🔧 Admin có thể sử dụng tất cả tính năng debug');
        return true;
    }

    static disableDevTools() {
        if (!window.currentUser || window.currentUser.role !== 'admin') {
            console.log('❌ Chỉ admin mới có thể tắt DevTools protection');
            return false;
        }

        // Khởi tạo lại protection
        window.devToolsProtection = new DevToolsProtection();
        console.log('🛡️ DevTools protection đã được kích hoạt lại');
        return true;
    }
}

// =================================================================
// CONSOLE STYLING & MESSAGES
// =================================================================

function addConsoleStyles() {
    // Thông báo chào mừng cho admin
    if (window.currentUser && window.currentUser.role === 'admin') {
        console.log('%c👑 ADMIN PANEL', 'background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 10px 20px; border-radius: 10px; font-size: 16px; font-weight: bold;');
        console.log('%cChào mừng Admin! Bạn có thể sử dụng DevTools.', 'color: #4CAF50; font-size: 14px;');
        console.log('%cSử dụng AdminDevToolsManager.enableDevTools() để tắt protection hoàn toàn.', 'color: #2196F3; font-size: 12px;');
    } else {
        console.log('%c⚠️ CẢNH BÁO', 'background: #e74c3c; color: white; padding: 10px; border-radius: 5px; font-weight: bold;');
        console.log('%cTrang này được bảo vệ khỏi việc sử dụng DevTools trái phép.', 'color: #e74c3c; font-size: 14px;');
    }
}

// =================================================================
// INITIALIZATION
// =================================================================

function initDevToolsProtection() {
    // Đợi currentUser được load
    const checkUser = () => {
        if (window.currentUser !== undefined) {
            console.log('🔍 Initializing DevTools Protection...');
            console.log('👤 Current user role:', window.currentUser?.role);
            
            // Khởi tạo protection system
            window.devToolsProtection = new DevToolsProtection();
            window.AdminDevToolsManager = AdminDevToolsManager;
            
            // Style console
            addConsoleStyles();
            
            console.log('✅ DevTools Protection initialized');
        } else {
            // Chờ 100ms và thử lại
            setTimeout(checkUser, 100);
        }
    };

    checkUser();
}

// Auto-init when DOM loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevToolsProtection);
} else {
    initDevToolsProtection();
}

// Also init when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !window.devToolsProtection) {
        setTimeout(initDevToolsProtection, 500);
    }
});

console.log('🛡️ DevTools Protection Script Loaded');
