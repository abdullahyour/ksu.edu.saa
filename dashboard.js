// متغيرات عامة
let currentSection = 'dashboard';
let isMobile = window.innerWidth <= 768;
let sidebarCollapsed = false;
let notificationsOpen = false;
let userMenuOpen = false;

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    setupNavigation();
    loadUserData();
    checkMobileView();
    // تهيئة EmailJS
    emailjs.init("3XFeyZQ433aQV4jTb"); // !! هام: استبدل هذا بمعرف المستخدم الخاص بك من EmailJS
});

// تهيئة لوحة التحكم
function initializeDashboard() {
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

    // تطبيق الثيم المحفوظ
    applySavedTheme();
    
    // تحديث الوقت
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    
    // تحديث تاريخ إصدار البطاقة
    updateIssueDate();
    
    // تحميل الإشعارات
    loadNotifications();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر القائمة للجوال
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
    }

    // إغلاق الشريط الجانبي عند النقر خارجه في الجوال
    document.addEventListener('click', function(event) {
        if (isMobile && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-toggle')) {
            closeMobileSidebar();
        }
    });

    // معالج تغيير حجم النافذة
    window.addEventListener('resize', handleWindowResize);

    // معالجات لوحة المفاتيح
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // إغلاق القوائم المنسدلة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.user-menu')) {
            closeUserMenu();
        }
        if (!event.target.closest('.notification-btn') && !event.target.closest('.notifications-panel')) {
            closeNotifications();
        }
        if (!event.target.closest('.modal-content') && event.target.classList.contains('modal')) {
            closePaymentModal();
            closeSettings();
        }
    });

    // معالج تبديل الوضع المظلم في الإعدادات
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }

    // معالج تبديل الإشعارات في الإعدادات
    const notificationsToggle = document.getElementById('notificationsToggle');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            showToast(`الإشعارات ${isEnabled ? 'مفعلة' : 'معطلة'}`, 'info');
            // هنا يمكن إضافة منطق لحفظ تفضيل المستخدم
        });
    }

    // معالج تغيير اللغة في الإعدادات
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            showToast(`تم تغيير اللغة إلى ${selectedLang === 'ar' ? 'العربية' : 'الإنجليزية'}`, 'info');
            // هنا يمكن إضافة منطق لتغيير اللغة فعلياً
        });
    }
    
    // معالج إرسال نموذج السداد
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
    }
}

// إعداد التنقل
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                navigateToSection(section);
            }
        });
    });

    // معالجات بطاقات الخدمات
    const serviceCards = document.querySelectorAll('.service-card[data-section]');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                navigateToSection(section);
            }
        });
    });
}

// التنقل إلى قسم معين
function navigateToSection(sectionId) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // تحديث التنقل النشط
        updateActiveNavigation(sectionId);
        
        // تحديث عنوان الصفحة
        updatePageTitle(sectionId);
        
        // إغلاق الشريط الجانبي في الجوال
        if (isMobile) {
            closeMobileSidebar();
        }
        
        // تحديث URL بدون إعادة تحميل
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
        
        // تحميل بيانات القسم إذا لزم الأمر
        loadSectionData(sectionId);
    }
}

// تحديث التنقل النشط
function updateActiveNavigation(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

// تحديث عنوان الصفحة
function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'لوحة التحكم',
        'courses': 'المقررات المسجلة',
        'schedule': 'الجدول الدراسي',
        'transcript': 'السجل الأكاديمي',
        'id-card': 'البطاقة الجامعية',
        'finance': 'الخدمات المالية',
        'e-learning': 'التعليم عن بعد',
        'support': 'الدعم الفني'
    };

    const subtitles = {
        'dashboard': 'مرحباً بك في بوابة الخدمات الأكاديمية',
        'courses': 'عرض وإدارة المقررات الدراسية المسجلة',
        'schedule': 'مواعيد المحاضرات والامتحانات',
        'transcript': 'عرض الدرجات والمعدل التراكمي',
        'id-card': 'عرض وطباعة البطاقة الجامعية',
        'finance': 'إدارة الرسوم والمدفوعات الجامعية',
        'e-learning': 'الوصول إلى المحاضرات والمواد التعليمية',
        'support': 'الحصول على المساعدة والدعم الفني'
    };

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'لوحة التحكم';
    }
    if (pageSubtitle) {
        pageSubtitle.textContent = subtitles[sectionId] || 'مرحباً بك في بوابة الخدمات الأكاديمية';
    }

    // تحديث عنوان المتصفح
    document.title = `${titles[sectionId] || 'لوحة التحكم'} - بوابة الخدمات الأكاديمية`;
}

// تحميل بيانات القسم
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'courses':
            loadCoursesData();
            break;
        case 'schedule':
            loadScheduleData();
            break;
        case 'transcript':
            loadTranscriptData();
            break;
        case 'id-card':
            loadIdCardData();
            break;
        case 'finance':
            loadFinanceData();
            break;
        case 'e-learning':
            loadELearningData();
            break;
        case 'support':
            loadSupportData();
            break;
        default:
            break;
    }
}

// ================================================== //
// ========= دوال نظام السداد (الجزء المضاف) ========= //
// ================================================== //

// إظهار نافذة السداد المنبثقة
function showPaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// إغلاق نافذة السداد المنبثقة
function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // إعادة تعيين النموذج
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.reset();
        }
    }
}

// معالج إرسال نموذج السداد
function handlePaymentFormSubmit(event) {
    event.preventDefault();
    
    const receiptFile = document.getElementById('receiptUpload').files[0];
    const studentNotes = document.getElementById('studentNotes').value;
    
    if (!receiptFile) {
        showToast('يرجى إرفاق إيصال السداد', 'error');
        return;
    }
    
    // التحقق من نوع الملف
    if (!receiptFile.type.startsWith('image/')) {
        showToast('يرجى إرفاق صورة صالحة (JPG, PNG)', 'error');
        return;
    }
    
    // التحقق من حجم الملف (5MB كحد أقصى)
    if (receiptFile.size > 5 * 1024 * 1024) {
        showToast('حجم الملف كبير جداً، يرجى اختيار ملف أصغر من 5MB', 'error');
        return;
    }
    
    // تحويل الملف إلى Base64 لإرساله عبر البريد الإلكتروني
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64File = e.target.result;
        sendPaymentEmail(base64File, receiptFile.name, studentNotes);
    };
    reader.readAsDataURL(receiptFile);
}

// إرسال البريد الإلكتروني مع إيصال السداد
function sendPaymentEmail(base64File, fileName, notes) {
    // إظهار مؤشر التحميل
    const submitButton = document.querySelector('#paymentForm button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitButton.disabled = true;
    
    // بيانات الطالبة
    const studentData = {
        name: 'نورة عبدالعزيز النوشان',
        id: 'KFU2025001',
        email: 'nourasn25@gmail.com', // بريد الطالبة (وهمي)
        major: 'إدارة أعمال',
        program: 'برنامج التجسير'
    };
    
    // بيانات السداد
    const paymentData = {
        amount: '2,000',
        description: 'رسوم اعتماد الإعفاء من الرسوم الدراسية',
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA')
    };
    
    // معاملات البريد الإلكتروني
    const templateParams = {
        to_email: 'almmnyf@gmail.com', // الآن سيتم إرسال الإيصال إلى بريد adm.kfu.edu.sa@gmail.com
        student_name: studentData.name,
        student_id: studentData.id,
        student_email: studentData.email,
        student_major: studentData.major,
        student_program: studentData.program,
        payment_amount: paymentData.amount,
        payment_description: paymentData.description,
        payment_date: paymentData.date,
        payment_time: paymentData.time,
        student_notes: notes || 'لا توجد ملاحظات',
        receipt_filename: fileName,
        receipt_attachment: base64File
    };
    
    // إرسال البريد الإلكتروني باستخدام EmailJS
    emailjs.send('service_dwa6x96', 'template_vao1hto', templateParams)
        .then(function(response) {
            console.log('تم إرسال البريد الإلكتروني بنجاح:', response.status, response.text);
            showToast('تم إرسال إيصال السداد بنجاح! سيتم مراجعته والرد عليك قريباً.', 'success');
            closePaymentModal();
            updatePaymentStatus();
        })
        .catch(function(error) {
            let errorMsg = 'حدث خطأ أثناء إرسال الإيصال. يرجى التأكد من الاتصال بالإنترنت أو المحاولة لاحقاً.';
            if (error && error.text && error.text.includes('User ID')) {
                errorMsg = 'فشل في إرسال البريد: تحقق من إعدادات EmailJS (User ID).';
            } else if (error && error.text && error.text.includes('recipients address is empty')) {
                errorMsg = 'فشل في إرسال البريد: بريد المستلم غير موجود أو غير صحيح في إعدادات EmailJS.';
            } else if (error && error.text) {
                errorMsg += `\n${error.text}`;
            }
            console.error('فشل في إرسال البريد الإلكتروني:', error);
            showToast(errorMsg, 'error');
        })
        .finally(function() {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
}

// تحديث حالة السداد في الواجهة
function updatePaymentStatus() {
    // تحديث بطاقة الرسوم في لوحة التحكم
    const summaryCard = document.querySelector('.summary-card.alert');
    if (summaryCard) {
        summaryCard.classList.remove('alert');
        summaryCard.classList.add('pending');
        
        const cardContent = summaryCard.querySelector('.card-content span');
        if (cardContent) {
            cardContent.textContent = 'تم إرسال إيصال السداد - قيد المراجعة';
        }
        
        const cardAction = summaryCard.querySelector('.card-action button');
        if (cardAction) {
            cardAction.textContent = 'قيد المراجعة';
            cardAction.disabled = true;
            cardAction.style.opacity = '0.6';
        }
    }
    
    // تحديث الإشعارات
    addNotification({
        title: 'تم إرسال إيصال السداد',
        message: 'تم إرسال إيصال السداد بنجاح وهو قيد المراجعة',
        type: 'success',
        time: 'الآن'
    });
}

// إضافة إشعار جديد
function addNotification(notification) {
    const notificationsList = document.querySelector('.notifications-list');
    if (notificationsList) {
        const notificationHTML = `
            <div class="notification-item unread">
                <i class="fas fa-check-circle text-success"></i>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
            </div>
        `;
        
        notificationsList.insertAdjacentHTML('afterbegin', notificationHTML);
        
        // تحديث عداد الإشعارات
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            const currentCount = parseInt(notificationBadge.textContent) || 0;
            notificationBadge.textContent = currentCount + 1;
            notificationBadge.style.display = 'block';
        }
    }
}

// ================================================== //

// تبديل الشريط الجانبي للجوال
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (sidebar && mobileMenuToggle) {
        sidebar.classList.toggle('show');
        mobileMenuToggle.classList.toggle('active');
        
        // منع التمرير في الخلفية
        if (sidebar.classList.contains('show')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// إغلاق الشريط الجانبي للجوال
function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (sidebar && mobileMenuToggle) {
        sidebar.classList.remove('show');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// تبديل الإشعارات
function toggleNotifications() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        notificationsOpen = !notificationsOpen;
        if (notificationsOpen) {
            notificationsPanel.classList.add('show');
            closeUserMenu(); // إغلاق قائمة المستخدم إذا كانت مفتوحة
        } else {
            notificationsPanel.classList.remove('show');
        }
    }
}

// إغلاق الإشعارات
function closeNotifications() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel && notificationsOpen) {
        notificationsPanel.classList.remove('show');
        notificationsOpen = false;
    }
}

// تبديل قائمة المستخدم
function toggleUserMenu() {
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    if (userMenuDropdown) {
        userMenuOpen = !userMenuOpen;
        if (userMenuOpen) {
            userMenuDropdown.classList.add('show');
            closeNotifications(); // إغلاق الإشعارات إذا كانت مفتوحة
        } else {
            userMenuDropdown.classList.remove('show');
        }
    }
}

// إغلاق قائمة المستخدم
function closeUserMenu() {
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    if (userMenuDropdown && userMenuOpen) {
        userMenuDropdown.classList.remove('show');
        userMenuOpen = false;
    }
}

// تبديل الثيم
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    
    // حفظ الثيم
    localStorage.setItem('kfu_theme', isDark ? 'dark' : 'light');
    
    // تحديث أيقونة الثيم
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    // تحديث حالة زر التبديل في الإعدادات
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDark;
    }
}

// تطبيق الثيم المحفوظ
function applySavedTheme() {
    const savedTheme = localStorage.getItem('kfu_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
}

// تحديد جميع الإشعارات كمقروءة
function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
    });
    
    // تحديث عداد الإشعارات
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        notificationBadge.style.display = 'none';
    }
    
    showToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // مسح البيانات المحفوظة
        localStorage.removeItem('kfu_user_data');
        localStorage.removeItem('kfu_session_token');
        
        // إظهار رسالة تسجيل الخروج
        showToast('تم تسجيل الخروج بنجاح', 'success');
        
        // التوجيه إلى صفحة تسجيل الدخول
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// إظهار/إخفاء الإعدادات
function toggleSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.toggle('show');
        if (settingsModal.classList.contains('show')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// إغلاق الإعدادات
function closeSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// تحميل بيانات المستخدم
function loadUserData() {
    // محاكاة تحميل بيانات المستخدم
    const userData = {
        name: 'نورة عبدالعزيز النوشان',
        id: 'KFU2025001',
        major: 'إدارة أعمال',
        program: 'برنامج التجسير',
        semester: 'الفصل الاول 2025-2026',
        gpa: '',
        status: 'طالبة نشطة'
    };
    
    // تحديث واجهة المستخدم
    updateUserInterface(userData);
}

// تحديث واجهة المستخدم
function updateUserInterface(userData) {
    // تحديث اسم المستخدم في الأماكن المختلفة
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = userData.name;
    });
    
    // تحديث الرقم الجامعي
    const userIdElements = document.querySelectorAll('.user-id');
    userIdElements.forEach(element => {
        element.textContent = userData.id;
    });
}

// تحميل الإشعارات
function loadNotifications() {
    // محاكاة تحميل الإشعارات
    const notifications = [
        {
            id: 1,
            title: 'تذكير بسداد الرسوم',
            message: 'يرجى سداد رسوم الاعتماد',
            time: 'منذ ساعتين',
            type: 'warning',
            unread: true
        },
        {
            id: 2,
            title: 'محاضرة جديدة متاحة لايوجد',
            message: '',
            time: 'منذ 4 ساعات',
            type: 'info',
            unread: false
        },
        {
            id: 3,
            title: 'تم تحديث الجدول الدراسي',
            message: ' تم نشر الجدول الدراسي للفصل الاول ',
            time: 'منذ يوم',
            type: 'success',
            unread: false
        }
    ];
    
    // تحديث عداد الإشعارات
    const unreadCount = notifications.filter(n => n.unread).length;
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'block';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

// تحميل بيانات المقررات
function loadCoursesData() {
    const courses = [
        { code: 'BUS101', name: 'مبادئ الإدارة', instructor: 'د. أحمد علي', semester: 'الفصل الاول', credits: 3, grade: '' },
        { code: 'ACC201', name: 'المحاسبة المالية', instructor: 'أ. سارة محمد', semester: 'الفصل الاول', credits: 3, grade: '' },
        { code: 'MKT305', name: 'التسويق الرقمي', instructor: 'د. فاطمة الزهراء', semester: 'الفصل الاول', credits: 3, grade: '' },
        { code: 'ECO101', name: 'مبادئ الاقتصاد الكلي', instructor: 'أ. خالد ناصر', semester: 'الفصل الاول', credits: 3, grade: '' },
        { code: 'IT101', name: 'مقدمة في تقنية المعلومات', instructor: 'م. ليلى عبدالله', semester: 'الفصل الاول', credits: 2, grade: '' }
    ];

    let html = `
        <table>
            <thead>
                <tr>
                    <th>رمز المقرر</th>
                    <th>اسم المقرر</th>
                    <th>الأستاذ</th>
                    <th>الفصل</th>
                    <th>الساعات</th>
                    <th>التقدير</th>
                </tr>
            </thead>
            <tbody>
    `;
    courses.forEach(course => {
        html += `
            <tr>
                <td>${course.code}</td>
                <td>${course.name}</td>
                <td>${course.instructor}</td>
                <td>${course.semester}</td>
                <td>${course.credits}</td>
                <td>${course.grade}</td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    document.getElementById('courses-content').innerHTML = html;
}

// تحميل بيانات الجدول
function loadScheduleData() {
    const schedule = [
        { day: 'الأحد', time: '09:00 - 10:00 ص', course: 'مبادئ الإدارة', location: 'اونلاين' },
        { day: 'الأحد', time: '10:00 - 11:00 ص', course: 'المحاسبة المالية', location: 'اونلاين ' },
        { day: 'الاثنين', time: '11:00 - 12:00 م', course: 'التسويق الرقمي', location: 'اونلاين' },
        { day: 'الثلاثاء', time: '09:00 - 10:00 ص', course: 'مبادئ الاقتصاد الكلي', location: 'اونلاين' },
        { day: 'الأربعاء', time: '13:00 - 14:00 م', course: 'مقدمة في تقنية المعلومات', location: 'اونلاين' }
    ];

    let html = `
        <table>
            <thead>
                <tr>
                    <th>اليوم</th>
                    <th>الوقت</th>
                    <th>المقرر</th>
                    <th>الموقع</th>
                </tr>
            </thead>
            <tbody>
    `;
    schedule.forEach(item => {
        html += `
            <tr>
                <td>${item.day}</td>
                <td>${item.time}</td>
                <td>${item.course}</td>
                <td>${item.location}</td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    document.getElementById('schedule-content').innerHTML = html;
}

// تحميل بيانات السجل الأكاديمي
function loadTranscriptData() {
    const transcript = {
        gpa: '3.75',
        totalCredits: 60,
        courses: [
            { year: '2025-2026', semester: 'الفصل الأول', code: 'ARAB101', name: 'اللغة العربية', grade: '', credits: 3 },
            { year: '2025-2026', semester: 'الفصل الأول', code: 'MATH101', name: 'الرياضيات العامة', grade: '', credits: 3 },
            { year: '2025-2026', semester: 'الفصل الاول', code: 'BUS101', name: 'مبادئ الإدارة', grade: '', credits: 3 },
            { year: '2025-2026', semester: 'الفصل الاول', code: 'ACC201', name: 'المحاسبة المالية', grade: '', credits: 3 }
        ]
    };

    let html = `
        <div class="transcript-summary">
            <p>المعدل التراكمي: <strong>${transcript.gpa}</strong></p>
            <p>إجمالي الساعات المكتسبة: <strong>${transcript.totalCredits}</strong></p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>السنة</th>
                    <th>الفصل</th>
                    <th>رمز المقرر</th>
                    <th>اسم المقرر</th>
                    <th>التقدير</th>
                    <th>الساعات</th>
                </tr>
            </thead>
            <tbody>
    `;
    transcript.courses.forEach(course => {
        html += `
            <tr>
                <td>${course.year}</td>
                <td>${course.semester}</td>
                <td>${course.code}</td>
                <td>${course.name}</td>
                <td>${course.grade}</td>
                <td>${course.credits}</td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    document.getElementById('transcript-content').innerHTML = html;
}

// تحميل بيانات البطاقة الجامعية
function loadIdCardData() {
    const userData = {
        name: 'نورة عبدالعزيز النوشان',
        id: 'KFU2025001',
        major: 'إدارة أعمال',
        program: 'برنامج التجسير',
        issueDate: '2025-07-23',
        expiryDate: '2027-09-01',
        photo: 'user_placeholder.png' // صورة وهمية
    };

    let html =  `
        <div class="id-card-front">
            <div class="id-card-header">
                <img src="kfu_logo.png" alt="KFU Logo" class="id-card-logo">
                <h3>جامعة الملك فيصل</h3>
                <p>King Faisal University</p>
            </div>
            <div class="id-card-body">
                <img src="${userData.photo}" alt="صورة الطالب" class="student-photo">
                <div class="student-info">
                    <p>الاسم: <strong>${userData.name}</strong></p>
                    <p>الرقم الجامعي: <strong>${userData.id}</strong></p>
                    <p>التخصص: <strong>${userData.major}</strong></p>
                    <p>البرنامج: <strong>${userData.program}</strong></p>
                </div>
            </div>
            <div class="id-card-footer">
                <p>تاريخ الإصدار: <span id="issue-date">${userData.issueDate}</span></p>
                <p>تاريخ الانتهاء: ${userData.expiryDate}</p>
            </div>
        </div>
        <div class="id-card-back">
            <p>هذه البطاقة ملك لجامعة الملك فيصل ويجب إعادتها عند الطلب.</p>
            <p>This card is the property of King Faisal University and must be returned upon request.</p>
            <div class="barcode"></div>
        </div>
        <button class="btn-primary print-button" onclick="window.print()"><i class="fas fa-print"></i> طباعة البطاقة</button>
    `;
    document.getElementById('id-card-content').innerHTML = html;
}

// تحميل البيانات المالية
function loadFinanceData() {
    const finance = [
        { description: 'رسوم مقررات الفصل الدراسي الاول 2025-2026', amount: 1200, status: 'مدفوع', date: '' },
        { description: '  رسوم اعتماد الاعفاء من الرسوم الدراسية', amount: 2000, status: 'مستحق', date: '2025-07-23' },
        { description: 'رسوم خدمات طلابية', amount: 300, status: 'مدفوع', date: '' }
    ];

    let html = `
        <table>
            <thead>
                <tr>
                    <th>الوصف</th>
                    <th>المبلغ (ريال)</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>الإجراء</th>
                </tr>
            </thead>
            <tbody>
    `;
    finance.forEach(item => {
        html += `
            <tr>
                <td>${item.description}</td>
                <td>${item.amount}</td>
                <td><span class="status-badge ${item.status === 'مدفوع' ? 'paid' : 'due'}">${item.status}</span></td>
                <td>${item.date}</td>
                <td>
                    ${item.status === 'مستحق' ? '<button class="btn-small btn-primary" onclick="showPaymentModal()">سداد</button>' : ''}
                </td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    document.getElementById('finance-content').innerHTML = html;
}

// تحميل بيانات التعليم عن بعد
function loadELearningData() {
    const eCourses = [
        { title: 'مبادئ الإدارة', platform: 'Blackboard', link: '#', status: '' },
        { title: 'المحاسبة المالية', platform: 'Blackboard', link: '#', status: '' },
        { title: 'التسويق الرقمي', platform: 'Zoom', link: '#', status: '' }
    ];

    let html = '';
    eCourses.forEach(course => {
        html += `
            <div class="e-learning-card">
                <h4>${course.title}</h4>
                <p>المنصة: ${course.platform}</p>
                <span class="status-badge ${course.status === 'متاح' ? 'available' : 'live'}">${course.status}</span>
                <a href="${course.link}" class="btn-small btn-secondary">انتقال</a>
            </div>
        `;
    });
    document.getElementById('e-learning-content').innerHTML = html;
}

// تحميل بيانات الدعم الفني
function loadSupportData() {
    const supportTickets = [
        { id: 'TKT001', subject: 'مشكلة في الدخول للبلاك بورد', status: 'مفتوحة', date: '' },
        { id: 'TKT002', subject: 'استفسار عن الدرجات', status: 'مغلقة', date: '' }
    ];

    let html = `
        <div class="support-actions">
            <button class="btn-primary" onclick="showToast('تم فتح تذكرة دعم جديدة', 'info')"><i class="fas fa-plus"></i> فتح تذكرة جديدة</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th>رقم التذكرة</th>
                    <th>الموضوع</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th>الإجراء</th>
                </tr>
            </thead>
            <tbody>
    `;
    supportTickets.forEach(ticket => {
        html += `
            <tr>
                <td>${ticket.id}</td>
                <td>${ticket.subject}</td>
                <td><span class="status-badge ${ticket.status === 'مفتوحة' ? 'open' : 'closed'}">${ticket.status}</span></td>
                <td>${ticket.date}</td>
                <td><button class="btn-small btn-secondary" onclick="showToast('عرض تفاصيل التذكرة ${ticket.id}', 'info')">عرض</button></td>
            </tr>
        `;
    });
    html += `
            </tbody>
        </table>
    `;
    document.getElementById('support-content').innerHTML = html;
}

// تحديث الوقت الحالي
function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const timeString = now.toLocaleDateString('ar-SA', options);
    
    // تحديث عناصر الوقت
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(element => {
        element.textContent = timeString;
    });
}

// تحديث تاريخ إصدار البطاقة (للبطاقة الجامعية)
function updateIssueDate() {
    // هذه الدالة قد لا تكون ضرورية إذا كانت البيانات تأتي من loadIdCardData
    // ولكنها موجودة هنا للحفاظ على التوافق إذا كان هناك استخدام آخر
    const issueDateElement = document.getElementById('issue-date');
    if (issueDateElement && !issueDateElement.textContent) { // تحديث فقط إذا كان فارغاً
        const issueDate = new Date();
        issueDate.setFullYear(issueDate.getFullYear() - 1); // تاريخ إصدار قبل سنة
        issueDateElement.textContent = issueDate.toLocaleDateString('ar-SA');
    }
}

// التحقق من العرض المحمول
function checkMobileView() {
    isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        document.body.classList.add('mobile-view');
        closeMobileSidebar();
    } else {
        document.body.classList.remove('mobile-view');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
        document.body.style.overflow = '';
    }
}

// معالج تغيير حجم النافذة
function handleWindowResize() {
    checkMobileView();
    closeNotifications();
    closeUserMenu();
}

// معالج اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(event) {
    // Escape لإغلاق النوافذ المنبثقة
    if (event.key === 'Escape') {
        closeNotifications();
        closeUserMenu();
        closeSettings();
        closePaymentModal();
        closeMobileSidebar();
    }
    
    // اختصارات التنقل
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case '1':
                event.preventDefault();
                navigateToSection('dashboard');
                break;
            case '2':
                event.preventDefault();
                navigateToSection('courses');
                break;
            case '3':
                event.preventDefault();
                navigateToSection('schedule');
                break;
            case '4':
                event.preventDefault();
                navigateToSection('transcript');
                break;
            case 'l':
                event.preventDefault();
                logout();
                break;
        }
    }
}

// عرض رسالة توست
function showToast(message, type = 'info') {
    // إنشاء عنصر التوست
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // إضافة التوست إلى الصفحة
    document.body.appendChild(toast);
    
    // إظهار التوست
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إخفاء التوست بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// الحصول على أيقونة التوست
function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// معالج التاريخ في المتصفح
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        navigateToSection(event.state.section);
    }
});

// تحميل القسم من URL عند بدء التشغيل
window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        navigateToSection(hash);
    } else {
        // تحميل قسم لوحة التحكم افتراضياً عند عدم وجود هاش
        navigateToSection('dashboard');
    }
});

// إضافة أنماط CSS للتوست والنوافذ المنبثقة (للتأكد من وجودها)
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 1rem 1.5rem;
        z-index: 2000;
        transform: translateX(-100%);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
    }
    
    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .toast-success {
        border-left: 4px solid #4CAF50;
    }
    
    .toast-success .fas {
        color: #4CAF50;
    }
    
    .toast-error {
        border-left: 4px solid #F44336;
    }
    
    .toast-error .fas {
        color: #F44336;
    }
    
    .toast-warning {
        border-left: 4px solid #FF9800;
    }
    
    .toast-warning .fas {
        color: #FF9800;
    }
    
    .toast-info {
        border-left: 4px solid #2196F3;
    }
    
    .toast-info .fas {
        color: #2196F3;
    }

    /* أنماط نافذة السداد المنبثقة */
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
    }

    .modal.show {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-content {
        background-color: white;
        margin: auto;
        padding: 0;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        padding: 20px 25px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f8f9fa;
        border-radius: 12px 12px 0 0;
    }

    .modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.3em;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: #666;
        padding: 5px;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background-color: #f0f0f0;
        color: #333;
    }

    .modal-body {
        padding: 25px;
    }

    .payment-instructions {
        margin-bottom: 25px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border-right: 4px solid #007bff;
    }

    .payment-instructions h4 {
        margin: 0 0 15px 0;
        color: #007bff;
        font-size: 1.1em;
    }

    .payment-instructions p {
        margin: 0 0 15px 0;
        line-height: 1.6;
        color: #555;
    }

    .bank-details {
        background-color: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #ddd;
    }

    .bank-details p {
        margin: 8px 0;
        font-size: 0.95em;
    }

    .bank-details strong {
        color: #333;
    }

    .payment-form {
        margin-top: 20px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
    }

    .form-group input[type="file"] {
        width: 100%;
        padding: 10px;
        border: 2px dashed #ddd;
        border-radius: 6px;
        background-color: #fafafa;
        cursor: pointer;
        transition: border-color 0.2s ease;
    }

    .form-group input[type="file"]:hover {
        border-color: #007bff;
    }

    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
    }

    .form-group small {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 0.85em;
    }

    .form-actions {
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }

    .btn-primary, .btn-secondary {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 1em;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0056b3;
    }

    .btn-primary:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background-color: #545b62;
    }

    /* أنماط إضافية للجداول */
    .data-table-container table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.5rem;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .data-table-container th, .data-table-container td {
        padding: 12px 15px;
        text-align: right;
        border-bottom: 1px solid #eee;
    }

    .data-table-container th {
        background-color: #f8f9fa;
        color: #333;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.9em;
    }

    .data-table-container tbody tr:hover {
        background-color: #f5f5f5;
    }

    .data-table-container .status-badge {
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 0.85em;
        font-weight: 600;
        color: white;
    }

    .data-table-container .status-badge.paid, .data-table-container .status-badge.success, .data-table-container .status-badge.available {
        background-color: #4CAF50;
    }

    .data-table-container .status-badge.due, .data-table-container .status-badge.warning, .data-tableContainer .status-badge.open {
        background-color: #FF9800;
    }

    .data-table-container .status-badge.closed {
        background-color: #F44336;
    }

    .data-table-container .status-badge.pending {
        background-color: #2196F3;
    }

    .data-table-container .btn-small {
        padding: 6px 12px;
        font-size: 0.85em;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .summary-card.pending {
        border-left: 4px solid #2196F3;
        background-color: #e3f2fd;
    }

    .summary-card.pending .card-content h3 {
        color: #1976d2;
    }

    @media (max-width: 768px) {
        .toast {
            left: 10px;
            right: 10px;
            max-width: none;
        }

        .modal-content {
            width: 95%;
            margin: 20px auto;
        }

        .modal-body {
            padding: 20px;
        }

        .form-actions {
            flex-direction: column;
        }

        .form-actions button {
            width: 100%;
        }
    }
`;

document.head.appendChild(additionalStyles);

// إضافة تنسيقات البطاقة الجامعية
const idCardStyles = document.createElement('style');
idCardStyles.textContent = `
    /* تنسيقات البطاقة الجامعية */
    .id-card-front, .id-card-back {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10);
        padding: 24px 32px;
        margin: 0 auto 24px auto;
        max-width: 420px;
        position: relative;
        direction: rtl;
    }
    .id-card-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 18px;
    }
    .id-card-logo {
        width: 60px;
        height: 60px;
        margin-bottom: 8px;
    }
    .id-card-header h3 {
        margin: 0;
        color: #1976d2;
        font-size: 1.4em;
        font-weight: bold;
    }
    .id-card-header p {
        margin: 0;
        color: #555;
        font-size: 1em;
    }
    .id-card-body {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 16px;
    }
    .student-photo {
        width: 80px;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #1976d2;
        background: #f5f5f5;
    }
    .student-info {
        flex: 1;
        font-size: 1em;
        color: #333;
    }
    .student-info p {
        margin: 0 0 7px 0;
        font-size: 1em;
    }
    .id-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.98em;
        color: #555;
        border-top: 1px dashed #ddd;
        padding-top: 10px;
        margin-top: 10px;
    }
    .id-card-back {
        background: #f8f9fa;
        border: 1px solid #e0e0e0;
        text-align: center;
        font-size: 0.98em;
        color: #444;
        padding: 18px 24px 18px 24px;
    }
    .barcode {
        width: 120px;
        height: 32px;
        background: repeating-linear-gradient(90deg, #222 0 4px, #fff 4px 8px);
        margin: 18px auto 0 auto;
        border-radius: 4px;
    }
    .print-button {
        display: block;
        margin: 0 auto 0 auto;
        margin-top: 10px;
        background: #1976d2;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 10px 28px;
        font-size: 1.1em;
        cursor: pointer;
        transition: background 0.2s;
    }
    .print-button:hover {
        background: #1256a3;
    }
    @media (max-width: 600px) {
        .id-card-front, .id-card-back {
            padding: 12px 4px;
            max-width: 98vw;
        }
        .id-card-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        .id-card-logo {
            width: 44px;
            height: 44px;
        }
        .student-photo {
            width: 60px;
            height: 75px;
        }
    }
`;
document.head.appendChild(idCardStyles);

// تصدير الدوال للاستخدام العام
window.navigateToSection = navigateToSection;
window.toggleNotifications = toggleNotifications;
window.toggleUserMenu = toggleUserMenu;
window.toggleTheme = toggleTheme;
window.toggleSettings = toggleSettings;
window.closeSettings = closeSettings;
window.markAllAsRead = markAllAsRead;
window.logout = logout;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;

