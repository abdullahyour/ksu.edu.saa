// متغيرات عامة
let isLoading = false;
let loginAttempts = 0;
const maxLoginAttempts = 3;

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    setupFormValidation();
    checkSavedCredentials();
});

// تهيئة الصفحة
function initializePage() {
    // إخفاء مؤشر التحميل
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    }, 1000);

    // تحديث تاريخ اليوم
    updateCurrentDate();
    
    // تطبيق الثيم المحفوظ
    applySavedTheme();
    
    // تحديث الوقت كل دقيقة
    setInterval(updateCurrentDate, 60000);
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // معالج إرسال النموذج
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // معالجات الإدخال
    if (usernameInput) {
        usernameInput.addEventListener('input', clearFieldError);
        usernameInput.addEventListener('blur', validateUsername);
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', clearFieldError);
        passwordInput.addEventListener('blur', validatePassword);
    }

    // معالج تذكر المستخدم
    if (rememberCheckbox) {
        rememberCheckbox.addEventListener('change', handleRememberMe);
    }

    // معالجات لوحة المفاتيح
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // معالج تغيير حجم النافذة
    window.addEventListener('resize', handleWindowResize);
}

// إعداد التحقق من صحة النموذج
function setupFormValidation() {
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            showFieldError(this, getValidationMessage(this));
        });
    });
}

// معالج تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    if (isLoading) return;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // التحقق من صحة البيانات
    if (!validateForm(username, password)) {
        return;
    }

    // التحقق من عدد المحاولات
    if (loginAttempts >= maxLoginAttempts) {
        showAlert('تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة لاحقاً.', 'error');
        return;
    }

    setLoading(true);
    loginAttempts++;

    try {
        // محاكاة طلب تسجيل الدخول
        const result = await simulateLogin(username, password);
        
        if (result.success) {
            showAlert('تم تسجيل الدخول بنجاح! جاري التوجيه...', 'success');
            
            // حفظ بيانات المستخدم إذا كان مطلوباً
            if (remember) {
                saveCredentials(username);
            } else {
                clearSavedCredentials();
            }
            
            // التوجيه إلى لوحة التحكم
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            showAlert(result.message || 'خطأ في اسم المستخدم أو كلمة المرور', 'error');
            
            // إعادة تعيين كلمة المرور
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showAlert('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        setLoading(false);
    }
}

// محاكاة طلب تسجيل الدخول
function simulateLogin(username, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // بيانات تجريبية للاختبار
            const validCredentials = [
                { username: 'KFU2025001', password: '1126986692' },
                { username: 'nourasn25@gmail.com', password: '1126986692' },
                { username: 'admin', password: 'admin123' }
            ];
            
            const isValid = validCredentials.some(cred => 
                (cred.username === username || cred.username.toLowerCase() === username.toLowerCase()) && 
                cred.password === password
            );
            
            if (isValid) {
                resolve({ success: true });
            } else {
                resolve({ 
                    success: false, 
                    message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
                });
            }
        }, 1500); // محاكاة تأخير الشبكة
    });
}

// التحقق من صحة النموذج
function validateForm(username, password) {
    let isValid = true;
    
    // التحقق من اسم المستخدم
    if (!username) {
        showFieldError(document.getElementById('username'), 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
        isValid = false;
    } else if (!validateUsername(null, username)) {
        isValid = false;
    }
    
    // التحقق من كلمة المرور
    if (!password) {
        showFieldError(document.getElementById('password'), 'يرجى إدخال كلمة المرور');
        isValid = false;
    } else if (!validatePassword(null, password)) {
        isValid = false;
    }
    
    return isValid;
}

// التحقق من صحة اسم المستخدم
function validateUsername(event, value = null) {
    const input = event ? event.target : document.getElementById('username');
    const username = value || input.value.trim();
    
    if (!username) {
        showFieldError(input, 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
        return false;
    }
    
    // التحقق من تنسيق البريد الإلكتروني أو الرقم الجامعي
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const studentIdRegex = /^KFU\d{7}$/i;
    
    if (!emailRegex.test(username) && !studentIdRegex.test(username) && username.length < 3) {
        showFieldError(input, 'يرجى إدخال بريد إلكتروني صحيح أو رقم جامعي صحيح');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

// التحقق من صحة كلمة المرور
function validatePassword(event, value = null) {
    const input = event ? event.target : document.getElementById('password');
    const password = value || input.value;
    
    if (!password) {
        showFieldError(input, 'يرجى إدخال كلمة المرور');
        return false;
    }
    
    if (password.length < 6) {
        showFieldError(input, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

// عرض خطأ في الحقل
function showFieldError(input, message) {
    const errorElement = document.getElementById(input.id + '-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.color = '#F44336';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '0.5rem';
    }
    
    input.style.borderColor = '#F44336';
    input.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.1)';
    
    // إضافة تأثير اهتزاز
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
}

// مسح خطأ الحقل
function clearFieldError(input) {
    const target = input.target || input;
    const errorElement = document.getElementById(target.id + '-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    target.style.borderColor = '';
    target.style.boxShadow = '';
}

// الحصول على رسالة التحقق
function getValidationMessage(input) {
    if (input.validity.valueMissing) {
        return input.id === 'username' ? 'يرجى إدخال اسم المستخدم' : 'يرجى إدخال كلمة المرور';
    }
    if (input.validity.typeMismatch) {
        return 'يرجى إدخال بريد إلكتروني صحيح';
    }
    if (input.validity.tooShort) {
        return `يجب أن يكون ${input.minLength} أحرف على الأقل`;
    }
    return 'يرجى إدخال قيمة صحيحة';
}

// تبديل إظهار/إخفاء كلمة المرور
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
    
    // إضافة تأثير بصري
    toggleIcon.style.transform = 'scale(1.1)';
    setTimeout(() => {
        toggleIcon.style.transform = 'scale(1)';
    }, 150);
}

// عرض نافذة استعادة كلمة المرور
function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // التركيز على حقل البريد الإلكتروني
        setTimeout(() => {
            const emailInput = document.getElementById('resetEmail');
            if (emailInput) emailInput.focus();
        }, 300);
    }
}

// إغلاق نافذة استعادة كلمة المرور
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// معالج نموذج استعادة كلمة المرور
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            
            if (validateEmail(email)) {
                showAlert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
                closeForgotPasswordModal();
                document.getElementById('resetEmail').value = '';
            } else {
                showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            }
        });
    }
});

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// عرض الوصول السريع
function showNewStudentInfo() {
    showAlert('سيتم توجيهك إلى صفحة معلومات الطلاب الجدد', 'info');
}

function showAcademicNumberInquiry() {
    showAlert('سيتم توجيهك إلى صفحة الاستعلام عن الرقم الأكاديمي', 'info');
}

function showAcademicCalendar() {
    showAlert('سيتم توجيهك إلى التقويم الأكاديمي', 'info');
}

// عرض التنبيهات
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertMessage = document.getElementById('alert-message');
    
    if (alertContainer && alertMessage) {
        alertMessage.textContent = message;
        alertContainer.className = `alert-container ${type}`;
        alertContainer.style.display = 'block';
        
        // إخفاء التنبيه تلقائياً بعد 5 ثوان
        setTimeout(() => {
            closeAlert();
        }, 5000);
    } else {
        // استخدام alert عادي كبديل
        alert(message);
    }
}

// إغلاق التنبيه
function closeAlert() {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.style.opacity = '0';
        setTimeout(() => {
            alertContainer.style.display = 'none';
            alertContainer.style.opacity = '1';
        }, 300);
    }
}

// تعيين حالة التحميل
function setLoading(loading) {
    isLoading = loading;
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton.querySelector('span');
    const buttonIcon = loginButton.querySelector('i');
    
    if (loading) {
        loginButton.disabled = true;
        buttonText.textContent = 'جاري تسجيل الدخول...';
        buttonIcon.className = 'fas fa-spinner fa-spin';
        loginButton.style.opacity = '0.8';
    } else {
        loginButton.disabled = false;
        buttonText.textContent = 'تسجيل الدخول';
        buttonIcon.className = 'fas fa-sign-in-alt';
        loginButton.style.opacity = '1';
    }
}

// معالج تذكر المستخدم
function handleRememberMe() {
    const remember = document.getElementById('remember').checked;
    const username = document.getElementById('username').value.trim();
    
    if (remember && username) {
        localStorage.setItem('kfu_remember_user', 'true');
        localStorage.setItem('kfu_saved_username', username);
    } else {
        localStorage.removeItem('kfu_remember_user');
        localStorage.removeItem('kfu_saved_username');
    }
}

// حفظ بيانات الاعتماد
function saveCredentials(username) {
    localStorage.setItem('kfu_remember_user', 'true');
    localStorage.setItem('kfu_saved_username', username);
    localStorage.setItem('kfu_last_login', new Date().toISOString());
}

// مسح بيانات الاعتماد المحفوظة
function clearSavedCredentials() {
    localStorage.removeItem('kfu_remember_user');
    localStorage.removeItem('kfu_saved_username');
    localStorage.removeItem('kfu_last_login');
}

// التحقق من بيانات الاعتماد المحفوظة
function checkSavedCredentials() {
    const rememberUser = localStorage.getItem('kfu_remember_user');
    const savedUsername = localStorage.getItem('kfu_saved_username');
    
    if (rememberUser === 'true' && savedUsername) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('remember').checked = true;
    }
}

// تحديث التاريخ الحالي
function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const dateString = now.toLocaleDateString('ar-SA', options);
    
    // تحديث أي عنصر يحتوي على التاريخ
    const dateElements = document.querySelectorAll('.current-date');
    dateElements.forEach(element => {
        element.textContent = dateString;
    });
}

// تطبيق الثيم المحفوظ
function applySavedTheme() {
    const savedTheme = localStorage.getItem('kfu_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// معالج اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(event) {
    // Enter للتركيز على الحقل التالي أو إرسال النموذج
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'username') {
            event.preventDefault();
            document.getElementById('password').focus();
        }
    }
    
    // Escape لإغلاق النوافذ المنبثقة
    if (event.key === 'Escape') {
        closeForgotPasswordModal();
        closeAlert();
    }
    
    // Ctrl+L للتركيز على حقل اسم المستخدم
    if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        document.getElementById('username').focus();
    }
}

// معالج تغيير حجم النافذة
function handleWindowResize() {
    // إعادة حساب أحجام العناصر إذا لزم الأمر
    const viewport = window.innerWidth;
    
    if (viewport < 768) {
        // تحسينات للجوال
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// إضافة تأثيرات CSS للتفاعل
const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .alert-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        max-width: 500px;
        width: 90%;
        transition: all 0.3s ease;
    }
    
    .alert {
        padding: 1rem 1.5rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInDown 0.3s ease-out;
    }
    
    .alert-container.success .alert {
        background: #E8F5E8;
        color: #1B5E20;
        border: 1px solid #4CAF50;
    }
    
    .alert-container.error .alert {
        background: #FFEBEE;
        color: #C62828;
        border: 1px solid #F44336;
    }
    
    .alert-container.info .alert {
        background: #E3F2FD;
        color: #1565C0;
        border: 1px solid #2196F3;
    }
    
    .alert-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        margin-right: auto;
    }
    
    .alert-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .dark-theme {
        filter: invert(1) hue-rotate(180deg);
    }
    
    .dark-theme img {
        filter: invert(1) hue-rotate(180deg);
    }
    
    @media (max-width: 768px) {
        .mobile-view .login-form {
            margin: 0.5rem;
            padding: 2rem 1.5rem;
        }
        
        .mobile-view .university-logo h1 {
            font-size: 2rem;
        }
        
        .mobile-view .alert-container {
            top: 10px;
            width: 95%;
        }
    }
`;

document.head.appendChild(style);

// تصدير الدوال للاستخدام العام
window.togglePassword = togglePassword;
window.showForgotPassword = showForgotPassword;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.showNewStudentInfo = showNewStudentInfo;
window.showAcademicNumberInquiry = showAcademicNumberInquiry;
window.showAcademicCalendar = showAcademicCalendar;
window.closeAlert = closeAlert;

