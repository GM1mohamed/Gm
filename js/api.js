// js/api.js

// ========== دوال API الأساسية باستخدام Supabase SDK ==========

// انتظار تهيئة Supabase
function waitForSupabase() {
    return new Promise(function(resolve) {
        if (supabase) {
            resolve(supabase);
        } else {
            var checkInterval = setInterval(function() {
                if (supabase) {
                    clearInterval(checkInterval);
                    resolve(supabase);
                }
            }, 100);
        }
    });
}

// ========== دوال الفيديوهات ==========
async function getVideos(category) {
    await waitForSupabase();
    
    let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (category && category !== 'الكل') {
        query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching videos:', error);
        throw new Error(error.message);
    }
    
    return data || [];
}

async function getVideoById(id) {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching video:', error);
        return null;
    }
    
    return data;
}

async function addVideo(title, category, grade, url, fileId, userId, userName, playlistId, playlistName, thumbnail, sourceType) {
    await waitForSupabase();
    
    const videoData = {
        title: title,
        category: category,
        grade: grade,
        url: url,
        file_id: fileId || null,
        user_id: userId,
        user_name: userName,
        playlist_id: playlistId || null,
        playlist_name: playlistName || null,
        thumbnail: thumbnail || null,
        source_type: sourceType || SOURCE_TYPES.YOUTUBE,
        views: 0,
        likes: 0,
        avg_rating: 0,
        rating_count: 0
    };
    
    const { data, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select();
    
    if (error) {
        console.error('Error adding video:', error);
        throw new Error(error.message);
    }
    
    // تحديث عدد فيديوهات القائمة إذا وجدت
    if (playlistId) {
        await updatePlaylistVideoCount(playlistId);
    }
    
    return data?.[0] || null;
}

async function updateVideoViews(id, views) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('videos')
        .update({ views: views })
        .eq('id', id);
    
    if (error) {
        console.error('Error updating views:', error);
        throw new Error(error.message);
    }
}

async function updateVideoLikes(id, likes) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('videos')
        .update({ likes: likes })
        .eq('id', id);
    
    if (error) {
        console.error('Error updating likes:', error);
        throw new Error(error.message);
    }
}

async function updateVideoRating(id, avgRating, ratingCount) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('videos')
        .update({ 
            avg_rating: avgRating, 
            rating_count: ratingCount 
        })
        .eq('id', id);
    
    if (error) {
        console.error('Error updating rating:', error);
        throw new Error(error.message);
    }
}

async function deleteVideo(id) {
    await waitForSupabase();
    
    // الحصول على playlist_id قبل الحذف
    const { data: video } = await supabase
        .from('videos')
        .select('playlist_id')
        .eq('id', id)
        .single();
    
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting video:', error);
        throw new Error(error.message);
    }
    
    if (video?.playlist_id) {
        await updatePlaylistVideoCount(video.playlist_id);
    }
}

// ========== دوال الأساتذة ==========
async function getTeachers() {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching teachers:', error);
        throw new Error(error.message);
    }
    
    return data || [];
}

async function addTeacher(name, subject, secret) {
    await waitForSupabase();
    
    const user_id = 'teacher_' + Date.now();
    
    const { data, error } = await supabase
        .from('teachers')
        .insert([{
            name: name,
            subject: subject,
            secret: secret,
            user_id: user_id
        }])
        .select();
    
    if (error) {
        console.error('Error adding teacher:', error);
        throw new Error(error.message);
    }
    
    return data?.[0] || null;
}

async function deleteTeacher(id) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting teacher:', error);
        throw new Error(error.message);
    }
}

// ========== دوال الطلاب ==========
async function addStudent(name, grade, secret) {
    await waitForSupabase();
    
    const user_id = 'student_' + Date.now();
    
    const { data, error } = await supabase
        .from('students')
        .insert([{
            name: name,
            grade: grade,
            secret: secret,
            user_id: user_id
        }])
        .select();
    
    if (error) {
        console.error('Error adding student:', error);
        throw new Error(error.message);
    }
    
    return data?.[0] || null;
}

async function deleteStudent(id) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting student:', error);
        throw new Error(error.message);
    }
}

// ========== دوال التعليقات ==========
async function getComments(videoId) {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching comments:', error);
        throw new Error(error.message);
    }
    
    return data || [];
}

async function addComment(videoId, userId, userName, text, rating) {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('comments')
        .insert([{
            video_id: videoId,
            user_id: userId,
            user_name: userName,
            text: text,
            rating: rating
        }])
        .select();
    
    if (error) {
        console.error('Error adding comment:', error);
        throw new Error(error.message);
    }
    
    return data?.[0] || null;
}

// ========== دوال قوائم التشغيل ==========
async function getPlaylists(teacherId) {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching playlists:', error);
        throw new Error(error.message);
    }
    
    return data || [];
}

async function createPlaylist(name, teacherId, teacherName, subject) {
    await waitForSupabase();
    
    const { data, error } = await supabase
        .from('playlists')
        .insert([{
            name: name,
            teacher_id: teacherId,
            teacher_name: teacherName,
            subject: subject,
            video_count: 0
        }])
        .select();
    
    if (error) {
        console.error('Error creating playlist:', error);
        throw new Error(error.message);
    }
    
    return data?.[0] || null;
}

async function updatePlaylistVideoCount(playlistId) {
    await waitForSupabase();
    
    // الحصول على عدد الفيديوهات في القائمة
    const { count, error: countError } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);
    
    if (countError) {
        console.error('Error counting videos:', countError);
        return;
    }
    
    const { error } = await supabase
        .from('playlists')
        .update({ video_count: count })
        .eq('id', playlistId);
    
    if (error) {
        console.error('Error updating playlist count:', error);
    }
}

async function deletePlaylist(id) {
    await waitForSupabase();
    
    const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting playlist:', error);
        throw new Error(error.message);
    }
}

// ========== دوال تسجيل الدخول ==========
async function login(type, name, secret) {
    await waitForSupabase();
    
    const table = type === 'teacher' ? 'teachers' : 'students';
    
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('name', name)
        .eq('secret', secret);
    
    if (error) {
        console.error('Login error:', error);
        throw new Error('خطأ في الاتصال');
    }
    
    if (data && data.length > 0) {
        const user = data[0];
        const session = {
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
}

// ========== دوال الرفع إلى Telegram (نفسها بدون تغيير) ==========

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function uploadThumbnailToTelegram(file, onProgress) {
    var maxSize = 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
        return Promise.reject(new Error('حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت.'));
    }
    
    if (!file.type.startsWith('image/')) {
        return Promise.reject(new Error('يرجى اختيار ملف صورة صالح.'));
    }
    
    var formData = new FormData();
    formData.append('chat_id', TELEGRAM_CONFIG.CHAT_ID);
    formData.append('photo', file);
    formData.append('disable_notification', true);
    
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable && onProgress) {
                var percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });
        
        xhr.addEventListener('load', function() {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.ok) {
                        var photos = data.result.photo;
                        var largestPhoto = photos[photos.length - 1];
                        var fileId = largestPhoto.file_id;
                        
                        fetch('https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getFile?file_id=' + fileId)
                            .then(function(response) { return response.json(); })
                            .then(function(fileData) {
                                if (fileData.ok) {
                                    var filePath = fileData.result.file_path;
                                    var imageUrl = 'https://api.telegram.org/file/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/' + filePath;
                                    resolve({ url: imageUrl, file_id: fileId });
                                } else {
                                    reject(new Error('Failed to get file path'));
                                }
                            })
                            .catch(reject);
                    } else {
                        reject(new Error('Telegram API Error: ' + (data.description || 'Unknown error')));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                reject(new Error('Upload failed with status: ' + xhr.status));
            }
        });
        
        xhr.addEventListener('error', function() {
            reject(new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'));
        });
        
        xhr.addEventListener('timeout', function() {
            reject(new Error('انتهت مهلة رفع الصورة.'));
        });
        
        xhr.open('POST', 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendPhoto');
        xhr.timeout = 60000;
        xhr.send(formData);
    });
}

function uploadToTelegram(file, onProgress) {
    var maxSize = 50 * 1024 * 1024;
    
    if (file.size > maxSize) {
        return Promise.reject(new Error('حجم الفيديو كبير جداً. الحد الأقصى هو 50 ميجابايت. حجم ملفك: ' + formatFileSize(file.size)));
    }
    
    var formData = new FormData();
    formData.append('chat_id', TELEGRAM_CONFIG.CHAT_ID);
    formData.append('video', file);
    formData.append('supports_streaming', true);
    formData.append('disable_notification', true);
    
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable && onProgress) {
                var percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });
        
        xhr.addEventListener('load', function() {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.ok) {
                        var video = data.result.video;
                        var fileId = video.file_id;
                        
                        fetch('https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getFile?file_id=' + fileId)
                            .then(function(response) { return response.json(); })
                            .then(function(fileData) {
                                if (fileData.ok) {
                                    var filePath = fileData.result.file_path;
                                    var videoUrl = 'https://api.telegram.org/file/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/' + filePath;
                                    resolve({ url: videoUrl, file_id: fileId });
                                } else {
                                    reject(new Error('Failed to get file path'));
                                }
                            })
                            .catch(reject);
                    } else {
                        var errorMsg = data.description || 'Unknown error';
                        if (data.error_code === 413) {
                            errorMsg = 'حجم الفيديو كبير جداً. الحد الأقصى هو 50 ميجابايت. يرجى ضغط الفيديو أو استخدام رابط خارجي.';
                        }
                        reject(new Error('Telegram API Error: ' + errorMsg));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                reject(new Error('Upload failed with status: ' + xhr.status));
            }
        });
        
        xhr.addEventListener('error', function() {
            reject(new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'));
        });
        
        xhr.addEventListener('timeout', function() {
            reject(new Error('انتهت مهلة الرفع. الفيديو كبير جداً أو الاتصال بطيء.'));
        });
        
        xhr.open('POST', 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendVideo');
        xhr.timeout = 300000;
        xhr.send(formData);
    });
}