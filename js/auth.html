// js/auth.js
function login(type, name, secret) {
    var table = type === 'teacher' ? 'teachers' : 'students';
    var endpoint = table + '?name=eq.' + encodeURIComponent(name) + '&secret=eq.' + encodeURIComponent(secret);
    
    return api(endpoint).then(function(data) {
        if (data && data.length > 0) {
            var user = data[0];
            var session = {
                type: type,
                name: user.name,
                user_id: user.user_id,
                id: user.id,
                subject: user.subject || null,
                grade: user.grade || null
            };
            saveSession(session);
            return session;
        } else {
            throw new Error('بيانات الدخول غير صحيحة');
        }
    });
}

function saveSession(session) {
    localStorage.setItem('gmube_edu_session', JSON.stringify(session));
}

function getSession() {
    var session = localStorage.getItem('gmube_edu_session');
    return session ? JSON.parse(session) : null;
}

function isLoggedIn() {
    return getSession() !== null;
}

function isTeacher() {
    var session = getSession();
    return session && session.type === 'teacher';
}

function isStudent() {
    var session = getSession();
    return session && session.type === 'student';
}

function logout() {
    localStorage.removeItem('gmube_edu_session');
    window.location.href = '../index.html';
}

function requireAuth() {
    if (!isLoggedIn()) {
        alert('يرجى تسجيل الدخول أولاً');
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

function requireTeacher() {
    if (!requireAuth()) return false;
    if (!isTeacher()) {
        alert('هذه الصفحة مخصصة للمعلمين فقط');
        window.location.href = '../index.html';
        return false;
    }
    return true;
}