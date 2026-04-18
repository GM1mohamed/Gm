import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://mzmbytgudwstatmiqkxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bWJ5dGd1ZHdzdGF0bWlxa3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzE3MDAsImV4cCI6MjA5MjEwNzcwMH0.-9Mf4ZQNjyvPnLOL7veFIN8uUckbryluqUuzOfMsneE';
const ADMIN_PASSWORD = 'your-admin-password-123'; // سيتم استبداله من متغيرات البيئة

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isLoggedIn = false;

// ============================================
// المصادقة
// ============================================
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  
  if (password === ADMIN_PASSWORD) {
    isLoggedIn = true;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    initAdmin();
  } else {
    alert('❌ كلمة المرور غير صحيحة');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  isLoggedIn = false;
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('adminPassword').value = '';
});

// ============================================
// تهيئة لوحة التحكم
// ============================================
async function initAdmin() {
  await loadStats();
  await loadPendingAnswers();
  
  // تحديث تلقائي كل 30 ثانية
  setInterval(() => {
    loadStats();
    loadPendingAnswers();
  }, 30000);
}

async function loadStats() {
  // إجمالي المشاركين
  const { count: totalParticipants } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true });
  
  // في انتظار المراجعة
  const { count: pending } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .is('is_correct', null);
  
  // إجابات صحيحة
  const { count: correct } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('is_correct', true);
  
  // مشاركات اليوم
  const today = new Date().toISOString().split('T')[0];
  const { count: todayAnswers } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .gte('answered_at', today);
  
  document.getElementById('statParticipants').textContent = totalParticipants || 0;
  document.getElementById('statPending').textContent = pending || 0;
  document.getElementById('statCorrect').textContent = correct || 0;
  document.getElementById('statToday').textContent = todayAnswers || 0;
}

async function loadPendingAnswers() {
  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      participant:participant_id(display_name, total_score),
      question:question_id(question_text, correct_answer_description)
    `)
    .is('is_correct', null)
    .order('answered_at', { ascending: true });
  
  if (data) {
    displayPendingAnswers(data);
  }
}

function displayPendingAnswers(answers) {
  const container = document.getElementById('pendingAnswers');
  
  if (!answers.length) {
    container.innerHTML = '<div class="loading-placeholder">🎉 لا توجد إجابات في انتظار المراجعة</div>';
    return;
  }
  
  container.innerHTML = answers.map(answer => `
    <div class="answer-card" id="answer-${answer.id}">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong>👤 ${answer.participant?.display_name || 'مجهول'}</strong>
        <small>⏰ ${new Date(answer.answered_at).toLocaleTimeString('ar-SA')}</small>
      </div>
      
      <img src="${answer.solution_image_url}" alt="حل المشارك" style="cursor: pointer;" onclick="window.open('${answer.solution_image_url}', '_blank')">
      
      <p style="margin: 12px 0; padding: 8px; background: #f0f0f0; border-radius: 6px;">
        <strong>📝 السؤال:</strong> ${answer.question?.question_text || ''}
      </p>
      
      <p style="margin: 12px 0; padding: 8px; background: #e0f2fe; border-radius: 6px;">
        <strong>✨ الإجابة النموذجية:</strong> ${answer.question?.correct_answer_description || 'غير محدد'}
      </p>
      
      <div class="answer-actions">
        <button class="btn-success" onclick="reviewAnswer('${answer.id}', true)">
          ✅ صحيح
        </button>
        <button class="btn-danger" onclick="reviewAnswer('${answer.id}', false)">
          ❌ خاطئ
        </button>
      </div>
    </div>
  `).join('');
}

window.reviewAnswer = async function(answerId, isCorrect) {
  try {
    const { error } = await supabase
      .from('answers')
      .update({ is_correct: isCorrect })
      .eq('id', answerId);
    
    if (error) throw error;
    
    document.getElementById(`answer-${answerId}`).remove();
    loadStats();
    
  } catch (error) {
    alert('❌ حدث خطأ: ' + error.message);
  }
};

// إضافة سؤال جديد
document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const challengeDate = document.getElementById('challengeDate').value;
  const questionText = document.getElementById('questionTextInput').value;
  const correctAnswerDesc = document.getElementById('correctAnswerDesc').value;
  const imageFile = document.getElementById('questionImageInput').files[0];
  
  let imageUrl = null;
  
  if (imageFile) {
    const fileName = `questions/${challengeDate}_${Date.now()}.${imageFile.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(fileName, imageFile);
    
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
  }
  
  const { error } = await supabase
    .from('questions')
    .upsert({
      challenge_date: challengeDate,
      question_text: questionText,
      correct_answer_description: correctAnswerDesc,
      question_image_url: imageUrl
    }, { onConflict: 'challenge_date' });
  
  if (error) {
    alert('❌ خطأ: ' + error.message);
  } else {
    alert('✅ تم حفظ السؤال بنجاح');
    e.target.reset();
  }
});