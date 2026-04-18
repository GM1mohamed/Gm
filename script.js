import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================================
// تهيئة Supabase
// ============================================
const SUPABASE_URL = 'https://mzmbytgudwstatmiqkxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bWJ5dGd1ZHdzdGF0bWlxa3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzE3MDAsImV4cCI6MjA5MjEwNzcwMH0.-9Mf4ZQNjyvPnLOL7veFIN8uUckbryluqUuzOfMsneE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// متغيرات عامة
// ============================================
let todayQuestion = null;
let selectedFile = null;
let leaderboardSubscription = null;

// تخزين معرف المشارك الحالي في localStorage
let currentParticipantId = localStorage.getItem('currentParticipantId');
let currentParticipant = null;

// عناصر DOM
const elements = {
  // الإحصائيات
  totalParticipants: document.getElementById('totalParticipants'),
  
  // التحدي
  dateDisplay: document.getElementById('dateDisplay'),
  questionImage: document.getElementById('questionImage'),
  questionText: document.getElementById('questionText'),
  
  // المشاركة
  participationForm: document.getElementById('participationForm'),
  participantName: document.getElementById('participantName'),
  uploadArea: document.getElementById('uploadArea'),
  solutionInput: document.getElementById('solutionInput'),
  previewContainer: document.getElementById('previewContainer'),
  previewImage: document.getElementById('previewImage'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  uploadStatus: document.getElementById('uploadStatus'),
  submitButton: document.getElementById('submitButton'),
  successMessage: document.getElementById('successMessage'),
  streakInfo: document.getElementById('streakInfo'),
  newParticipationBtn: document.getElementById('newParticipationBtn'),
  
  // لوحة المتصدرين
  leaderboardList: document.getElementById('leaderboardList'),
  tabBtns: document.querySelectorAll('.tab-btn')
};

// ============================================
// دوال التهيئة
// ============================================
async function init() {
  await loadStats();
  await loadTodayQuestion();
  await loadCurrentParticipant();
  setupEventListeners();
  subscribeToLeaderboard();
}

async function loadStats() {
  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true });
  
  elements.totalParticipants.textContent = count || 0;
}

async function loadTodayQuestion() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('challenge_date', today)
    .eq('is_active', true)
    .single();
  
  if (data) {
    todayQuestion = data;
    displayQuestion(data);
    await checkIfAlreadyParticipated();
  } else {
    elements.questionText.textContent = '🎉 لا يوجد تحدي اليوم، عد غداً!';
    elements.participationForm.classList.add('hidden');
  }
}

function displayQuestion(question) {
  elements.dateDisplay.textContent = new Date(question.challenge_date).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  elements.questionText.textContent = question.question_text;
  
  if (question.question_image_url) {
    elements.questionImage.src = question.question_image_url;
  }
}

async function loadCurrentParticipant() {
  if (currentParticipantId) {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('id', currentParticipantId)
      .single();
    
    if (data) {
      currentParticipant = data;
      elements.participantName.value = data.display_name;
    }
  }
}

async function checkIfAlreadyParticipated() {
  if (!currentParticipant || !todayQuestion) return;
  
  const { data } = await supabase
    .from('answers')
    .select('*')
    .eq('participant_id', currentParticipant.id)
    .eq('question_id', todayQuestion.id)
    .single();
  
  if (data) {
    showSuccessMessage(data);
  }
}

// ============================================
// إنشاء أو استرجاع المشارك
// ============================================
async function getOrCreateParticipant(displayName) {
  // إذا كان لدينا مشارك حالي بنفس الاسم، نستخدمه
  if (currentParticipant && currentParticipant.display_name === displayName) {
    return currentParticipant;
  }
  
  // البحث عن مشارك بنفس الاسم
  const { data: existing } = await supabase
    .from('participants')
    .select('*')
    .eq('display_name', displayName)
    .single();
  
  if (existing) {
    currentParticipant = existing;
    currentParticipantId = existing.id;
    localStorage.setItem('currentParticipantId', existing.id);
    return existing;
  }
  
  // إنشاء مشارك جديد
  const { data: newParticipant, error } = await supabase
    .from('participants')
    .insert({ display_name: displayName })
    .select()
    .single();
  
  if (error) throw error;
  
  currentParticipant = newParticipant;
  currentParticipantId = newParticipant.id;
  localStorage.setItem('currentParticipantId', newParticipant.id);
  
  await loadStats(); // تحديث العداد
  
  return newParticipant;
}

// ============================================
// رفع الصور والمشاركة
// ============================================
async function uploadSolutionImage(file) {
  const timestamp = Date.now();
  const fileName = `solutions/${timestamp}_${file.name}`;
  
  const { error } = await supabase.storage
    .from('solution-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from('solution-images')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

async function submitAnswer() {
  const displayName = elements.participantName.value.trim();
  
  if (!displayName) {
    showStatus('❌ الرجاء كتابة اسمك', 'error');
    return;
  }
  
  if (!selectedFile) {
    showStatus('❌ الرجاء اختيار صورة للحل', 'error');
    return;
  }
  
  if (!todayQuestion) {
    showStatus('❌ لا يوجد سؤال اليوم', 'error');
    return;
  }
  
  try {
    elements.submitButton.disabled = true;
    elements.submitButton.querySelector('.btn-text').textContent = '⏳ جاري الرفع...';
    
    // 1. إنشاء أو استرجاع المشارك
    const participant = await getOrCreateParticipant(displayName);
    
    // 2. التحقق من عدم المشاركة مسبقاً
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('participant_id', participant.id)
      .eq('question_id', todayQuestion.id)
      .single();
    
    if (existingAnswer) {
      showStatus('⚠️ لقد شاركت بالفعل في تحدي اليوم!', 'error');
      return;
    }
    
    // 3. رفع الصورة
    const imageUrl = await uploadSolutionImage(selectedFile);
    
    // 4. حفظ الإجابة
    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        participant_id: participant.id,
        question_id: todayQuestion.id,
        solution_image_url: imageUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    
    showSuccessMessage(answer);
    
  } catch (error) {
    showStatus(`❌ حدث خطأ: ${error.message}`, 'error');
  } finally {
    elements.submitButton.disabled = false;
    elements.submitButton.querySelector('.btn-text').textContent = '🚀 إرسال الحل والمشاركة';
  }
}

function showStatus(message, type) {
  elements.uploadStatus.innerHTML = `<div class="status-message ${type}">${message}</div>`;
}

function showSuccessMessage(answer) {
  elements.participationForm.classList.add('hidden');
  elements.successMessage.classList.remove('hidden');
  
  const streak = currentParticipant?.streak || 0;
  elements.streakInfo.innerHTML = `
    <span style="font-size: 24px;">🔥</span><br>
    سلسلة انتصاراتك الحالية: ${streak} يوم
    <br><br>
    <small>سيتم مراجعة إجابتك وتحديث النتيجة قريباً</small>
  `;
}

function resetForm() {
  elements.participationForm.classList.remove('hidden');
  elements.successMessage.classList.add('hidden');
  selectedFile = null;
  elements.previewContainer.classList.add('hidden');
  elements.uploadArea.classList.remove('hidden');
  elements.submitButton.disabled = true;
  elements.uploadStatus.innerHTML = '';
}

// ============================================
// لوحة المتصدرين (Realtime)
// ============================================
function subscribeToLeaderboard() {
  leaderboardSubscription = supabase
    .channel('leaderboard')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'participants'
    }, () => {
      loadLeaderboard(document.querySelector('.tab-btn.active').dataset.tab);
    })
    .subscribe();
}

async function loadLeaderboard(type = 'today') {
  let query = supabase
    .from('participants')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(50);
  
  if (type === 'today') {
    const today = new Date().toISOString().split('T')[0];
    query = query.eq('last_played', today);
  }
  
  const { data } = await query;
  displayLeaderboard(data || []);
}

function displayLeaderboard(participants) {
  if (!participants.length) {
    elements.leaderboardList.innerHTML = '<div class="loading-placeholder">🎯 لا يوجد مشاركين بعد - كن الأول!</div>';
    return;
  }
  
  elements.leaderboardList.innerHTML = participants.map((p, index) => `
    <div class="leaderboard-item ${currentParticipantId === p.id ? 'current-user' : ''}">
      <div class="leaderboard-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
        ${index + 1}
      </div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">
          ${p.display_name}
          ${currentParticipantId === p.id ? ' (أنت)' : ''}
        </div>
        <div class="leaderboard-stats">
          <span>🏆 ${p.total_score}</span>
          <span>🔥 ${p.streak}</span>
        </div>
      </div>
      <div class="leaderboard-score">${p.total_score}</div>
    </div>
  `).join('');
}

// ============================================
// مستمعي الأحداث
// ============================================
function setupEventListeners() {
  // رفع الصورة
  elements.uploadArea.addEventListener('click', () => elements.solutionInput.click());
  
  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
  });
  
  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('dragover');
  });
  
  elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files[0]);
  });
  
  elements.solutionInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
  });
  
  elements.removeImageBtn.addEventListener('click', () => {
    selectedFile = null;
    elements.previewContainer.classList.add('hidden');
    elements.uploadArea.classList.remove('hidden');
    elements.submitButton.disabled = true;
    elements.uploadStatus.innerHTML = '';
  });
  
  elements.submitButton.addEventListener('click', submitAnswer);
  
  elements.newParticipationBtn.addEventListener('click', resetForm);
  
  // لوحة المتصدرين
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLeaderboard(btn.dataset.tab);
    });
  });
  
  // تفعيل زر الإرسال عند كتابة الاسم واختيار صورة
  elements.participantName.addEventListener('input', updateSubmitButton);
}

function handleFileSelect(file) {
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showStatus('❌ الرجاء اختيار ملف صورة صالح', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showStatus('❌ حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
    return;
  }
  
  selectedFile = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    elements.previewImage.src = e.target.result;
    elements.previewContainer.classList.remove('hidden');
    elements.uploadArea.classList.add('hidden');
    updateSubmitButton();
    showStatus('✅ تم اختيار الصورة بنجاح', 'success');
  };
  reader.readAsDataURL(file);
}

function updateSubmitButton() {
  const hasName = elements.participantName.value.trim().length > 0;
  const hasImage = selectedFile !== null;
  elements.submitButton.disabled = !(hasName && hasImage);
}

// ============================================
// بدء التطبيق
// ============================================
init();