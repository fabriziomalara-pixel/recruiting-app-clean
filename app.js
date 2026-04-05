
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ocyubbteisvniegyxdmp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vsKhuTfB4boZGlcZBXdd-g_oe89wuIf';

const personalityItems = [
  "Mi considero una persona affidabile e costante nel rispettare gli impegni.",
  "Riesco a mantenere autocontrollo anche sotto pressione.",
  "Collaboro volentieri con il gruppo di lavoro.",
  "Mi adatto con rapidità ai cambiamenti organizzativi.",
  "Presto attenzione ai dettagli e agli standard di qualità."
];

const situationalQuestions = [
  {
    question: "Un cliente si lamenta in modo acceso al banco, mentre hai già altre persone in attesa. Qual è la risposta migliore?",
    answers: [
      { text: "Ignoro il cliente arrabbiato per servire prima la fila.", score: 0 },
      { text: "Rispondo in modo secco per chiudere subito la discussione.", score: 1 },
      { text: "Riconosco il problema, mantengo calma, gestisco le priorità e cerco una soluzione rapida.", score: 4 },
      { text: "Chiedo a un collega di occuparsene senza spiegazioni.", score: 2 }
    ]
  },
  {
    question: "Ti accorgi che una preparazione non rispetta pienamente lo standard qualitativo interno. Cosa fai?",
    answers: [
      { text: "La metto comunque in vendita per non sprecare.", score: 0 },
      { text: "Segnalo il problema e blocco il prodotto secondo procedura.", score: 4 },
      { text: "Aspetto che decida qualcun altro senza dire nulla.", score: 1 },
      { text: "Correggo informalmente senza registrare niente.", score: 2 }
    ]
  },
  {
    question: "Hai molto lavoro e un collega nuovo ti chiede aiuto. Qual è la scelta più professionale?",
    answers: [
      { text: "Lo ignoro perché devo finire il mio compito.", score: 0 },
      { text: "Gli do indicazioni essenziali e verifico che parta correttamente.", score: 4 },
      { text: "Gli dico di arrangiarsi.", score: 0 },
      { text: "Faccio il suo lavoro al posto suo senza spiegare.", score: 2 }
    ]
  }
];

const supabaseReady = !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const supabase = supabaseReady ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function el(id) { return document.getElementById(id); }
function qs(name) { return new URLSearchParams(location.search).get(name); }
function setText(id, value) { if (el(id)) el(id).textContent = value; }
function show(id) { if (el(id)) el(id).classList.remove('hidden'); }
function hide(id) { if (el(id)) el(id).classList.add('hidden'); }

function scoreLabel(score) {
  if (score == null) return '—';
  if (score >= 85) return 'Molto forte';
  if (score >= 70) return 'Buono';
  if (score >= 55) return 'Da approfondire';
  return 'Critico';
}

function getPersonalityAnswers() {
  return JSON.parse(sessionStorage.getItem('personality_answers') || '{}');
}
function getSituationalAnswers() {
  return JSON.parse(sessionStorage.getItem('situational_answers') || '{}');
}
function savePersonalityAnswers(obj) {
  sessionStorage.setItem('personality_answers', JSON.stringify(obj));
}
function saveSituationalAnswers(obj) {
  sessionStorage.setItem('situational_answers', JSON.stringify(obj));
}
function getPersonalityScore() {
  const vals = Object.values(getPersonalityAnswers());
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a,b)=>a+b,0) / (vals.length * 5)) * 100);
}
function getSituationalScore() {
  const vals = Object.values(getSituationalAnswers());
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a,b)=>a+b,0) / (vals.length * 4)) * 100);
}
function getFinalScore() {
  return Math.round(getPersonalityScore() * 0.3 + getSituationalScore() * 0.7);
}
function updateScores() {
  setText('persScore', getPersonalityScore() + '%');
  setText('sitScore', getSituationalScore() + '%');
  setText('finalScore', getFinalScore() + '%');
}

function renderPersonality() {
  const box = el('personalityBox');
  if (!box) return;
  const answers = getPersonalityAnswers();
  box.innerHTML = personalityItems.map((item, i) => `
    <div class="question">
      <div><strong>${i+1}.</strong> ${item}</div>
      <div class="scale">
        ${[1,2,3,4,5].map(v => `<button type="button" class="${answers[i] === v ? 'active' : ''}" data-pi="${i}" data-pv="${v}">${v}</button>`).join('')}
      </div>
    </div>`).join('');
  box.querySelectorAll('button[data-pi]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-pi');
      const val = Number(btn.getAttribute('data-pv'));
      const obj = getPersonalityAnswers();
      obj[idx] = val;
      savePersonalityAnswers(obj);
      renderPersonality();
      updateScores();
    });
  });
}

function renderSituational() {
  const box = el('situationalBox');
  if (!box) return;
  const answers = getSituationalAnswers();
  box.innerHTML = situationalQuestions.map((q, i) => `
    <div class="question">
      <div><strong>${i+1}.</strong> ${q.question}</div>
      <div class="answers">
        ${q.answers.map(a => `<button type="button" class="${answers[i] === a.score ? 'active' : ''}" data-si="${i}" data-sv="${a.score}">${a.text}</button>`).join('')}
      </div>
    </div>`).join('');
  box.querySelectorAll('button[data-si]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-si');
      const val = Number(btn.getAttribute('data-sv'));
      const obj = getSituationalAnswers();
      obj[idx] = val;
      saveSituationalAnswers(obj);
      renderSituational();
      updateScores();
    });
  });
}

async function initAdminPage() {
  if (!location.pathname.endsWith('/admin.html') && !location.pathname.endsWith('admin.html')) return;
  if (!supabaseReady) {
    setText('loginMsg', 'Inserisci SUPABASE_URL e SUPABASE_ANON_KEY in public/app.js');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  bindAdminEvents();

  if (session?.user) {
    await showAdmin(session.user);
  } else {
    hide('adminArea');
    show('loginCard');
  }
}

function bindAdminEvents() {
  if (el('loginBtn')) {
    el('loginBtn').addEventListener('click', async () => {
      setText('loginMsg', 'Accesso in corso...');
      const email = el('loginEmail').value.trim();
      const password = el('loginPassword').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setText('loginMsg', error.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      await showAdmin(user);
    });
  }
  if (el('logoutBtn')) {
    el('logoutBtn').addEventListener('click', async () => {
      await supabase.auth.signOut();
      location.reload();
    });
  }
  if (el('createJobBtn')) {
    el('createJobBtn').addEventListener('click', createJob);
  }
  if (el('createInviteBtn')) {
    el('createInviteBtn').addEventListener('click', createInvite);
  }
}

async function showAdmin(user) {
  hide('loginCard');
  show('adminInfoCard');
  show('adminArea');
  setText('adminEmailView', user.email);
  await loadJobs();
  await loadAdminData();
}

async function createJob() {
  const title = el('jobTitle').value.trim();
  const description = el('jobDescription').value.trim();
  if (!title) return setText('jobMsg', 'Inserisci un titolo posizione.');
  const { error } = await supabase.from('jobs').insert({ title, description });
  setText('jobMsg', error ? error.message : 'Posizione salvata.');
  if (!error) {
    el('jobTitle').value = title;
    el('jobDescription').value = '';
    await loadJobs();
  }
}

async function loadJobs() {
  const select = el('jobSelect');
  if (!select) return;
  const { data, error } = await supabase.from('jobs').select('id,title').eq('is_active', true).order('created_at', { ascending: false });
  if (error) {
    select.innerHTML = '<option value="">Errore caricamento posizioni</option>';
    return;
  }
  select.innerHTML = data.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
}

async function createInvite() {
  const job_id = el('jobSelect').value;
  const candidate_name = el('inviteName').value.trim();
  const candidate_email = el('inviteEmail').value.trim();
  const hours = Number(el('inviteHours').value || '2');
  if (!job_id || !candidate_name || !candidate_email) {
    setText('inviteMsg', 'Compila posizione, nome ed email.');
    return;
  }
  setText('inviteMsg', 'Creazione invito...');
  const session = (await supabase.auth.getSession()).data.session;
  const res = await fetch('/.netlify/functions/create-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ job_id, candidate_name, candidate_email, hours })
  });
  const out = await res.json();
  if (!res.ok) {
    setText('inviteMsg', out.error || 'Errore creazione invito.');
    return;
  }
  setText('inviteMsg', 'Invito creato.');
  show('inviteResult');
  el('inviteResult').innerHTML = `<strong>Link candidato:</strong><br><a href="${out.invite_url}" target="_blank">${out.invite_url}</a>`;
  await loadAdminData();
}

async function loadAdminData() {
  const { data: invites } = await supabase.from('invitations').select('id,status,expires_at,submitted_at,candidate_name,candidate_email,jobs(title),submissions(final_score)').order('created_at', { ascending: false });
  const table = el('adminTable');
  if (!table) return;

  table.innerHTML = (invites || []).map(r => {
    const score = r.submissions?.final_score ?? null;
    const badgeClass = r.status === 'submitted' ? 'badge status-ok' : (r.status === 'expired' ? 'badge status-exp' : 'badge status-run');
    return `<tr>
      <td>${r.candidate_name || '—'}</td>
      <td>${r.candidate_email || '—'}</td>
      <td>${r.jobs?.title || '—'}</td>
      <td><span class="${badgeClass}">${r.status}</span></td>
      <td>${score == null ? '—' : score + '% · ' + scoreLabel(score)}</td>
      <td>${new Date(r.expires_at).toLocaleString('it-IT')}</td>
      <td>${r.submitted_at ? new Date(r.submitted_at).toLocaleString('it-IT') : '—'}</td>
    </tr>`;
  }).join('');

  const rows = invites || [];
  const scores = rows.map(r => r.submissions?.final_score).filter(v => typeof v === 'number');
  setText('kpiInvites', rows.length);
  setText('kpiSubs', rows.filter(r => r.status === 'submitted').length);
  setText('kpiDone', rows.filter(r => r.status === 'submitted').length);
  setText('kpiAvg', scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) : 0);
}

async function initCandidatePage() {
  if (!location.pathname.endsWith('/candidate.html') && !location.pathname.endsWith('candidate.html')) return;
  renderPersonality();
  renderSituational();
  updateScores();

  const token = qs('token');
  if (!token) {
    el('candidateStatus').textContent = 'Manca il token invito nel link.';
    return;
  }

  const res = await fetch('/.netlify/functions/validate-invite?token=' + encodeURIComponent(token));
  const out = await res.json();
  if (!res.ok || !out.valid) {
    el('candidateStatus').textContent = out.error || 'Invito non valido o scaduto.';
    return;
  }

  el('candidateStatus').innerHTML = `Invito valido per la posizione: <strong>${out.job_title}</strong>. Scadenza: <strong>${new Date(out.expires_at).toLocaleString('it-IT')}</strong>`;
  show('candidateArea');
  startCountdown(new Date(out.expires_at).getTime());
  if (out.candidate_name) el('candName').value = out.candidate_name;
  if (out.candidate_email) el('candEmail').value = out.candidate_email;

  if (el('submitCandidateBtn')) {
    el('submitCandidateBtn').addEventListener('click', async () => {
      const payload = {
        token,
        full_name: el('candName').value.trim(),
        email: el('candEmail').value.trim(),
        phone: el('candPhone').value.trim(),
        city: el('candCity').value.trim(),
        experience: el('candExp').value.trim(),
        consent_privacy: el('consentPrivacy').checked,
        consent_future: el('consentFuture').checked,
        personality_answers: getPersonalityAnswers(),
        situational_answers: getSituationalAnswers(),
        personality_score: getPersonalityScore(),
        situational_score: getSituationalScore(),
        final_score: getFinalScore()
      };
      if (!payload.consent_privacy) {
        setText('submitMsg', 'Devi accettare il consenso privacy.');
        return;
      }
      setText('submitMsg', 'Invio in corso...');
      const res2 = await fetch('/.netlify/functions/submit-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const out2 = await res2.json();
      setText('submitMsg', res2.ok ? 'Candidatura inviata correttamente.' : (out2.error || 'Errore invio candidatura.'));
    });
  }
}

function startCountdown(expiresAtMs) {
  function tick() {
    const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    setText('timer', `${h}:${m}:${s}`);
    const totalAssumed = 2 * 3600;
    const progress = Math.min(100, Math.max(0, ((totalAssumed - diff) / totalAssumed) * 100));
    const bar = el('progressBar');
    if (bar) bar.style.width = progress + '%';
  }
  tick();
  setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAdminPage();
  await initCandidatePage();
});
