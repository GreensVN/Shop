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
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.classList.add('visible');
        }, 100);
        
        setTimeout(function() {
            toast.classList.remove('visible');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 3000);
        
        toast.querySelector('.toast-close').addEventListener('click', function() {
            toast.classList.remove('visible');
            setTimeout(function() {
                toast.remove();
            }, 300);
        });
    };
    
    // Check if user is already logged in
    if (localStorage.getItem('rememberMe') === 'true' && currentUser) {
        updateUIAfterLogin();
    }
    
    // Initialize auth modal if elements exist
    if (document.getElementById('loginButton')) {
        initAuthModal();
    }
});

// Global variables
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let userBalance = JSON.parse(localStorage.getItem('userBalance')) || 0;
let depositHistory = JSON.parse(localStorage.getItem('depositHistory')) || [];

// Hàm lưu dữ liệu vào localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('userBalance', JSON.stringify(userBalance));
    localStorage.setItem('depositHistory', JSON.stringify(depositHistory));
}

// Hàm kiểm tra email đã tồn tại chưa
function isEmailExist(email) {
    return users.some(user => user.email === email);
}

// Hàm xác thực đăng nhập
function authenticate(email, password) {
    const user = users.find(user => user.email === email);
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
}

function updateUIAfterLogin() {
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) return;
    
    // Replace login button with user dropdown
    loginButton.outerHTML = `
        <div class="user-dropdown" id="userDropdown">
            <div class="user-avatar">${currentUser.avatarText}</div>
            <span class="user-name">${currentUser.name}</span>
            <div class="dropdown-menu">
                <div class="dropdown-item" id="accountButton">
                    <i class="fas fa-user"></i>
                    <span>Tài khoản</span>
                </div>
                <div class="dropdown-item coming-soon-action">
                    <i class="fas fa-heart"></i>
                    <span>Yêu thích</span>
                </div>
                <div class="dropdown-item coming-soon-action">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Giỏ hàng</span>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="logoutButton">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Đăng xuất</span>
                </div>
            </div>
        </div>
    `;
    
    // Initialize account modal
    initAccountModal();
    
    // Add logout event
    document.getElementById('logoutButton').addEventListener('click', function() {
        logoutUser();
    });
    
    // Add account button event
    document.getElementById('accountButton').addEventListener('click', function() {
        showAccountModal();
    });
    
    // Add coming soon actions
    document.querySelectorAll('.coming-soon-action').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            showComingSoonModal();
        });
    });
}

function logoutUser() {
    currentUser = null;
    userBalance = 0;
    localStorage.removeItem('rememberMe');
    saveData();
    
    // Restore login button
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) {
        userDropdown.outerHTML = `
            <button class="btn btn-primary" id="loginButton">
                <i class="fas fa-user"></i>
                <span>Đăng Nhập</span>
            </button>
        `;
    }
    
    // Reinitialize auth modal
    initAuthModal();
    
    showToast('Bạn đã đăng xuất thành công', 'success');
}

function showAccountModal() {
    const accountModal = document.getElementById('accountModal');
    const accountAvatar = document.getElementById('accountAvatar');
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountBalance = document.getElementById('accountBalance');
    
    // Update user info
    if (currentUser) {
        accountAvatar.textContent = currentUser.avatarText;
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        
        // Get user balance from users array
        const user = users.find(u => u.email === currentUser.email);
        userBalance = user ? user.balance : 0;
        accountBalance.textContent = formatPrice(userBalance);
    }
    
    // Show modal
    accountModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add animation
    setTimeout(() => {
        accountModal.classList.add('show');
    }, 10);
}

function initAccountModal() {
    const accountModal = document.getElementById('accountModal');
    const closeAccountModal = document.getElementById('closeAccountModal');
    const depositAction = document.getElementById('depositAction');
    const logoutAccountBtn = document.getElementById('logoutAccountBtn');
    
    // Close modal
    closeAccountModal.addEventListener('click', function() {
        accountModal.classList.remove('show');
        setTimeout(() => {
            accountModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    });
    
    // Deposit action
    depositAction.addEventListener('click', function() {
        accountModal.classList.remove('show');
        setTimeout(() => {
            accountModal.style.display = 'none';
            showDepositModal();
        }, 300);
    });
    
    // Logout from account modal
    logoutAccountBtn.addEventListener('click', function() {
        accountModal.classList.remove('show');
        setTimeout(() => {
            accountModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            logoutUser();
        }, 300);
    });
    
    // Close when clicking outside
    accountModal.addEventListener('click', function(e) {
        if (e.target === accountModal) {
            accountModal.classList.remove('show');
            setTimeout(() => {
                accountModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    });
}

function showDepositModal() {
    const depositModal = document.getElementById('depositModal');
    
    // Show modal
    depositModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add animation
    setTimeout(() => {
        depositModal.classList.add('show');
    }, 10);
    
    // Initialize card type selection
    document.querySelectorAll('.card-type').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.card-type').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Initialize form submission
    document.getElementById('depositForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processDeposit();
    });
    
    // Close modal button
    document.getElementById('closeDepositModal').addEventListener('click', function() {
        depositModal.classList.remove('show');
        setTimeout(() => {
            depositModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('depositForm').reset();
        }, 300);
    });
    
    // Close when clicking outside
    depositModal.addEventListener('click', function(e) {
        if (e.target === depositModal) {
            depositModal.classList.remove('show');
            setTimeout(() => {
                depositModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.getElementById('depositForm').reset();
            }, 300);
        }
    });
}

function processDeposit() {
    const form = document.getElementById('depositForm');
    const cardNumber = document.getElementById('cardNumber').value;
    const cardSerial = document.getElementById('cardSerial').value;
    const cardAmount = document.getElementById('cardAmount').value;
    const cardType = document.querySelector('.card-type.selected').getAttribute('data-type');
    const submitBtn = form.querySelector('.btn-submit');
    
    // Validate form
    let isValid = true;
    
    if (!cardNumber) {
        showError(document.getElementById('cardNumber'), 'Vui lòng nhập mã thẻ');
        isValid = false;
    } else if (cardNumber.length < 10) {
        showError(document.getElementById('cardNumber'), 'Mã thẻ phải có ít nhất 10 ký tự');
        isValid = false;
    }
    
    if (!cardSerial) {
        showError(document.getElementById('cardSerial'), 'Vui lòng nhập số serial');
        isValid = false;
    } else if (cardSerial.length < 5) {
        showError(document.getElementById('cardSerial'), 'Số serial phải có ít nhất 5 ký tự');
        isValid = false;
    }
    
    if (!cardAmount) {
        showError(document.getElementById('cardAmount'), 'Vui lòng chọn mệnh giá');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(function() {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        // Process deposit
        const amount = parseInt(cardAmount);
        userBalance += amount;
        
        // Update user balance in users array
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].balance = userBalance;
        }
        
        // Add to history
        const now = new Date();
        const depositDate = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
        const depositItem = {
            amount: amount,
            date: depositDate,
            cardType: cardType
        };
        
        depositHistory.unshift(depositItem);
        
        // Update deposit history in users array
        if (userIndex !== -1) {
            if (!users[userIndex].depositHistory) {
                users[userIndex].depositHistory = [];
            }
            users[userIndex].depositHistory.unshift(depositItem);
        }
        
        saveData();
        
        // Show success
        showToast(`Nạp thành công ${formatPrice(amount)}đ vào tài khoản`, 'success');
        
        // Close modal
        const depositModal = document.getElementById('depositModal');
        depositModal.classList.remove('show');
        setTimeout(() => {
            depositModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            form.reset();
            
            // Update balance display
            document.getElementById('accountBalance').textContent = formatPrice(userBalance);
        }, 1000);
        
    }, 2000);
}

function showComingSoonModal() {
    const comingSoonModal = document.getElementById('comingSoonModal');
    
    // Show modal
    comingSoonModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add animation
    setTimeout(() => {
        comingSoonModal.classList.add('show');
    }, 10);
    
    // Close modal button
    document.getElementById('closeComingSoonModal').addEventListener('click', function() {
        comingSoonModal.classList.remove('show');
        setTimeout(() => {
            comingSoonModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    });
    
    // Close when clicking outside
    comingSoonModal.addEventListener('click', function(e) {
        if (e.target === comingSoonModal) {
            comingSoonModal.classList.remove('show');
            setTimeout(() => {
                comingSoonModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    });
}

function initAuthModal() {
    // Modal elements
    const authModal = document.getElementById('authModal');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const loginButton = document.getElementById('loginButton');
    const closeModal = document.getElementById('closeModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Password toggle functionality
    function initPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        });
    }
    
    // Form validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    
    function validatePassword(password) {
        return password.length >= 6;
    }
    
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.add('has-error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function clearError(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('has-error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    // Initialize form validation
    function initFormValidation() {
        // Login form validation
        document.getElementById('loginEmail').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập email');
            } else if (!validateEmail(this.value)) {
                showError(this, 'Email không hợp lệ');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('loginPassword').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập mật khẩu');
            } else if (!validatePassword(this.value)) {
                showError(this, 'Mật khẩu phải có ít nhất 6 ký tự');
            } else {
                clearError(this);
            }
        });
        
        // Register form validation
        document.getElementById('registerName').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập họ tên');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('registerEmail').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập email');
            } else if (!validateEmail(this.value)) {
                showError(this, 'Email không hợp lệ');
            } else if (isEmailExist(this.value)) {
                showError(this, 'Email đã được sử dụng');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('registerPassword').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập mật khẩu');
            } else if (!validatePassword(this.value)) {
                showError(this, 'Mật khẩu phải có ít nhất 6 ký tự');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('registerConfirmPassword').addEventListener('blur', function() {
            const password = document.getElementById('registerPassword').value;
            if (!this.value) {
                showError(this, 'Vui lòng nhập lại mật khẩu');
            } else if (this.value !== password) {
                showError(this, 'Mật khẩu không khớp');
            } else {
                clearError(this);
            }
        });
        
        // Forgot password form validation
        document.getElementById('forgotEmail').addEventListener('blur', function() {
            if (!this.value) {
                showError(this, 'Vui lòng nhập email');
            } else if (!validateEmail(this.value)) {
                showError(this, 'Email không hợp lệ');
            } else if (!isEmailExist(this.value)) {
                showError(this, 'Email không tồn tại');
            } else {
                clearError(this);
            }
        });
    }
    
    // Open auth modal
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                authModal.classList.add('show');
            }, 10);
            // Reset to login tab when opening modal
            document.querySelector('.modal-tab[data-tab="login"]').click();
        });
    }
    
    // Close modals
    closeModal.addEventListener('click', function() {
        authModal.classList.remove('show');
        setTimeout(() => {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Reset forms
            loginForm.reset();
            registerForm.reset();
        }, 300);
    });
    
    closeForgotModal.addEventListener('click', function() {
        forgotModal.classList.remove('show');
        setTimeout(() => {
            forgotModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            forgotPasswordForm.reset();
        }, 300);
    });
    
    // Close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === authModal) {
            authModal.classList.remove('show');
            setTimeout(() => {
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                loginForm.reset();
                registerForm.reset();
            }, 300);
        }
        if (event.target === forgotModal) {
            forgotModal.classList.remove('show');
            setTimeout(() => {
                forgotModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                forgotPasswordForm.reset();
            }, 300);
        }
    });
    
    // Switch between login and register tabs
    modalTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            modalTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active form
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.modal-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}Form`).classList.add('active');
        });
    });
    
    // Open forgot password modal
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        authModal.style.display = 'none';
        forgotModal.style.display = 'flex';
        setTimeout(() => {
            forgotModal.classList.add('show');
        }, 10);
    });
    
    // Switch to login from forgot password
    document.querySelectorAll('.switch-to-login').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            forgotModal.classList.remove('show');
            setTimeout(() => {
                forgotModal.style.display = 'none';
                authModal.style.display = 'flex';
                setTimeout(() => {
                    authModal.classList.add('show');
                }, 10);
                // Switch to login tab
                document.querySelector('.modal-tab[data-tab="login"]').click();
            }, 300);
        });
    });
    
    // Switch to register from login
    document.querySelectorAll('.switch-to-register').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.modal-tab[data-tab="register"]').click();
        });
    });
    
    // Form submissions with loading state
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const submitBtn = this.querySelector('.btn-submit');
        
        // Validate form
        let isValid = true;
        if (!email) {
            showError(document.getElementById('loginEmail'), 'Vui lòng nhập email');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(document.getElementById('loginEmail'), 'Email không hợp lệ');
            isValid = false;
        }
        
        if (!password) {
            showError(document.getElementById('loginPassword'), 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (!validatePassword(password)) {
            showError(document.getElementById('loginPassword'), 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(function() {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Check authentication
            const user = authenticate(email, password);
            if (!user) {
                showError(document.getElementById('loginPassword'), 'Email hoặc mật khẩu không đúng');
                return;
            }
            
            // Set current user
            currentUser = {
                name: user.name,
                email: user.email,
                avatarText: user.name.charAt(0).toUpperCase()
            };
            
            // Get user balance
            userBalance = user.balance || 0;
            
            // Save to localStorage if "Remember me" is checked
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            saveData();
            
            // Show success message
            const successHTML = `
                <div class="login-success">
                    <div class="login-success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="login-success-message">Đăng nhập thành công!</h3>
                    <p>Chào mừng ${currentUser.name} trở lại</p>
                </div>
            `;
            
            // Add to modal and hide form
            authModal.querySelector('.modal-content').insertAdjacentHTML('beforeend', successHTML);
            document.querySelector('.modal-form.active').style.display = 'none';
            document.querySelector('.social-login').style.display = 'none';
            document.querySelector('.login-success').style.display = 'block';
            
            // Close modal after 1.5 seconds
            setTimeout(function() {
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                // Update UI after login
                updateUIAfterLogin();
                
                // Remove success message
                const successElement = document.querySelector('.login-success');
                if (successElement) {
                    successElement.remove();
                }
                
                // Show form again
                document.querySelector('.modal-form.active').style.display = 'block';
                document.querySelector('.social-login').style.display = 'block';
            }, 1500);
            
        }, 1500);
    });
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const submitBtn = this.querySelector('.btn-submit');
        
        // Validate form
        let isValid = true;
        if (!name) {
            showError(document.getElementById('registerName'), 'Vui lòng nhập họ tên');
            isValid = false;
        }
        
        if (!email) {
            showError(document.getElementById('registerEmail'), 'Vui lòng nhập email');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(document.getElementById('registerEmail'), 'Email không hợp lệ');
            isValid = false;
        } else if (isEmailExist(email)) {
            showError(document.getElementById('registerEmail'), 'Email đã được sử dụng');
            isValid = false;
        }
        
        if (!password) {
            showError(document.getElementById('registerPassword'), 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (!validatePassword(password)) {
            showError(document.getElementById('registerPassword'), 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }
        
        if (!confirmPassword) {
            showError(document.getElementById('registerConfirmPassword'), 'Vui lòng nhập lại mật khẩu');
            isValid = false;
        } else if (confirmPassword !== password) {
            showError(document.getElementById('registerConfirmPassword'), 'Mật khẩu không khớp');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(function() {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Create new user
            const newUser = {
                name: name,
                email: email,
                password: password,
                balance: 0,
                depositHistory: []
            };
            
            users.push(newUser);
            saveData();
            
            showToast('Đăng ký thành công!', 'success');
            
            // Switch to login tab after registration
            setTimeout(function() {
                modalTabs.forEach(t => t.classList.remove('active'));
                document.querySelector('.modal-tab[data-tab="login"]').classList.add('active');
                
                document.querySelectorAll('.modal-form').forEach(form => {
                    form.classList.remove('active');
                });
                loginForm.classList.add('active');
                
                // Pre-fill email in login form
                document.getElementById('loginEmail').value = email;
                
                // Clear form
                registerForm.reset();
            }, 1000);
        }, 1500);
    });
    
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const submitBtn = this.querySelector('.btn-submit');
        
        // Validate form
        if (!email) {
            showError(document.getElementById('forgotEmail'), 'Vui lòng nhập email');
            return;
        } else if (!validateEmail(email)) {
            showError(document.getElementById('forgotEmail'), 'Email không hợp lệ');
            return;
        } else if (!isEmailExist(email)) {
            showError(document.getElementById('forgotEmail'), 'Email không tồn tại');
            return;
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(function() {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            showToast('Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn!', 'success');
            
            // Close modal after submission
            setTimeout(function() {
                forgotModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                forgotPasswordForm.reset();
            }, 1000);
        }, 1500);
    });
    
    // Social login buttons
    document.querySelectorAll('.social-button').forEach(button => {
        button.addEventListener('click', function() {
            const provider = this.classList.contains('facebook') ? 'Facebook' : 'Google';
            const submitBtn = this;
            
            // Show loading state
            submitBtn.innerHTML = '<div class="spinner"></div>';
            
            // Simulate social login
            setTimeout(function() {
                // Generate random user for demo
                const randomNum = Math.floor(Math.random() * 1000);
                const socialUser = {
                    name: `User${randomNum}`,
                    email: `user${randomNum}@${provider.toLowerCase()}.com`,
                    avatarText: 'U'
                };
                
                currentUser = socialUser;
                
                // Check if user exists, if not create new
                if (!isEmailExist(socialUser.email)) {
                    users.push({
                        name: socialUser.name,
                        email: socialUser.email,
                        password: '', // No password for social login
                        balance: 0,
                        depositHistory: []
                    });
                    saveData();
                }
                
                // Update UI
                updateUIAfterLogin();
                
                // Close auth modal
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                showToast(`Đăng nhập bằng ${provider} thành công`, 'success');
                
                // Reset social button
                submitBtn.innerHTML = provider === 'Facebook' 
                    ? '<i class="fab fa-facebook-f"></i>' 
                    : '<i class="fab fa-google"></i>';
            }, 1500);
        });
    });
    
    // Initialize password toggles and form validation
    initPasswordToggles();
    initFormValidation();
}

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
