const $ = (id) => document.getElementById(id);
const state = { lastResponse: null };

function switchTab(id){
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active', n.dataset.tab===id));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active-tab', t.id===id));
  if(id==='reviews') loadReviews();
  if(id==='metrics') loadMetrics();
}
document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));

function caseContext(){
  const symptoms = $('symptoms').value.split(',').map(s=>s.trim()).filter(Boolean);
  const ctx = { symptoms };
  if($('ageMonths').value) ctx.age_months = Number($('ageMonths').value);
  if($('temperature').value) ctx.temperature_c = Number($('temperature').value);
  if($('respRate').value) ctx.respiratory_rate = Number($('respRate').value);
  if($('pregnancy').value) ctx.pregnancy_status = $('pregnancy').value;
  return ctx;
}
function addMsg(kind, html){
  const div=document.createElement('div'); div.className='msg '+kind; div.innerHTML=html; $('chatLog').appendChild(div); $('chatLog').scrollTop=$('chatLog').scrollHeight;
}
function renderEvidence(evidence){
  if(!evidence?.length) return '';
  return '<div class="evidence">'+evidence.map(e=>`<div class="e-card"><strong>${e.title}</strong><br/><small>${e.source} · score ${e.score}</small><p>${e.text.slice(0,220)}...</p></div>`).join('')+'</div>';
}
function setUrgency(u){
  const card=$('urgencyCard'); card.className='urgency '+u; card.innerHTML=`<strong>Urgency: ${u.toUpperCase().replace('_','-')}</strong><span>${u==='emergency'?'Urgent referral / supervisor review':u==='same_day'?'Manage today and reassess danger signs':'Routine protocol-based follow-up'}</span>`;
}
async function send(){
  const message=$('message').value.trim(); if(!message) return;
  addMsg('user', `<strong>HEW</strong><p>${message}</p>`); $('message').value='';
  const payload={message, language:$('language').value, case_context:caseContext(), session_id:'web-demo'};
  const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json(); state.lastResponse=data; setUrgency(data.urgency);
  $('piiState').textContent=data.safety.pii_redacted?'Redacted':'No PII detected';
  $('reviewState').textContent=data.review_required?'Required':'Not required';
  $('providerState').textContent=data.model_provider;
  addMsg('assistant', `<strong>Assistant · ${data.urgency}</strong><pre>${data.answer}</pre>${data.missing_questions.length?'<p><strong>Missing questions:</strong> '+data.missing_questions.join(' | ')+'</p>':''}${renderEvidence(data.evidence)}`);
  loadReviews(); loadMetrics();
}
$('sendBtn').addEventListener('click', send);
$('message').addEventListener('keydown', e=>{ if(e.ctrlKey && e.key==='Enter') send(); });
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{$('message').value=b.dataset.example; if(b.dataset.example.includes('3 year')){ $('ageMonths').value=36; $('temperature').value=39.2; $('respRate').value=56; $('symptoms').value='fever, fast breathing'; } }));
$('clearCase').addEventListener('click',()=>['ageMonths','temperature','respRate','symptoms'].forEach(id=>$(id).value=''));

$('protocolBtn').addEventListener('click', async()=>{
  const q=$('protocolQuery').value||'fever fast breathing';
  const res=await fetch('/api/protocols/search?q='+encodeURIComponent(q)); const data=await res.json();
  $('protocolResults').innerHTML=data.results.map(e=>`<div class="card"><strong>${e.title}</strong><br/><small>${e.source} · ${e.score}</small><p>${e.text}</p></div>`).join('');
});
async function loadReviews(){
  const res=await fetch('/api/review-queue'); const data=await res.json(); $('reviewBadge').textContent=data.items.length;
  $('reviewItems').innerHTML=data.items.length?data.items.map(i=>`<div class="card"><strong>${i.urgency}</strong><br/><small>${new Date(i.created_at*1000).toLocaleString()} · ${i.reason}</small><pre>${JSON.stringify(i.payload,null,2)}</pre></div>`).join(''):'<p>No open reviews yet.</p>';
}
async function loadMetrics(){
  const res=await fetch('/api/metrics/dashboard'); const data=await res.json(); $('metricsOut').textContent=JSON.stringify(data,null,2);
}
$('evalBtn').addEventListener('click', async()=>{ const res=await fetch('/api/evaluate',{method:'POST'}); $('metricsOut').textContent=JSON.stringify(await res.json(),null,2); });
$('packetBtn').addEventListener('click', async()=>{ const res=await fetch('/api/offline/field-packet'); $('integrationOut').textContent=JSON.stringify(await res.json(),null,2); });

$('micBtn').addEventListener('click',()=>{
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ alert('Browser speech recognition is not available here. Use /api/voice/transcribe for server-side STT adapter.'); return; }
  const rec = new SpeechRecognition(); rec.lang=$('language').value==='am'?'am-ET':'en-US'; rec.onresult=e=>{$('message').value=e.results[0][0].transcript}; rec.start();
});
async function init(){
  try{ const res=await fetch('/api/health'); const data=await res.json(); $('healthBadge').textContent=data.status==='ok'?'API Online':'API Issue'; $('healthOut').textContent=JSON.stringify(data,null,2); }catch(e){ $('healthBadge').textContent='API Offline'; }
  loadReviews(); loadMetrics();
}
init();
