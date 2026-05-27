// js/error-handler.js

// معالج عام للأخطاء غير المتوقعة
window.addEventListener('error', function(e) {
    console.error('خطأ عام:', e.message);
    // يمكن إضافة منطق لتسجيل الأخطاء عن بعد
});

// معالج أخطاء Promise غير المعالجة
window.addEventListener('unhandledrejection', function(event) {
    console.error('خطأ عدم معالجة Promise:', event.reason);
    event.preventDefault();
});

// دالة موحدة لمعالجة أخطاء API
function handleApiError(error) {
    if (!error) return 'حدث خطأ غير متوقع';
    
    var message = error.message || error.toString();
    
    // معالجة أخطاء الشبكة
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        return 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
    }
    
    // معالجة أخطاء المصادقة
    if (message.includes('401') || message.includes('Unauthorized')) {
        return 'لم تعد لديك صلاحيات لهذا الإجراء. يرجى تسجيل الدخول مجدداً.';
    }
    
    // معالجة أخطاء الموارد المفقودة
    if (message.includes('404') || message.includes('Not Found')) {
        return 'المورد غير موجود.';
    }
    
    // معالجة أخطاء الخادم
    if (message.includes('500') || message.includes('Server Error')) {
        return 'خطأ في الخادم. يرجى محاولة لاحقاً.';
    }
    
    // معالجة أخطاء التحقق من البيانات
    if (message.includes('validation') || message.includes('invalid')) {
        return 'بيانات غير صحيحة. يرجى التحقق من المدخلات.';
    }
    
    return message;
}

// دالة لتسجيل الأخطاء مع السياق
function logError(context, error) {
    var timestamp = new Date().toISOString();
    var errorInfo = {
        timestamp: timestamp,
        context: context,
        message: error.message || error.toString(),
        stack: error.stack || ''
    };
    
    console.error('[' + context + ']', errorInfo);
    
    // يمكن إرسال الأخطاء إلى خادم للتسجيل
    // sendErrorToServer(errorInfo);
}

// دالة للتعامل مع أخطاء الرفع
function handleUploadError(error) {
    var message = error.message || error.toString();
    
    if (message.includes('413') || message.includes('too large')) {
        return 'حجم الملف كبير جداً. يرجى اختيار ملف أصغر.';
    }
    
    if (message.includes('timeout')) {
        return 'انتهت مهلة الرفع. يرجى محاولة مجدداً.';
    }
    
    if (message.includes('Telegram')) {
        return 'فشل الرفع إلى الخادم. يرجى التحقق من الملف والاتصال بالإنترنت.';
    }
    
    return handleApiError(error);
}
