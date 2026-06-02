/* ===== Kanye English Quest — Core: State, Helpers, Menu, Init ===== */

// ============================================================
// STATE
// ============================================================
var S = {
  level: 1, xp: 0, hp: 100, mhp: 100, mp: 50, mmp: 50,
  streak: 0, mxStreak: 0, ok: 0, ng: 0, wins: 0, losses: 0,
  monHp: 0, mhp2: 0, monIdx: -1, inBat: false,
  skills: [], pw: false, shield: false, crit: false,
  recent: [], today: '', todayOK: 0, todayNG: 0,
  curAlbum: -1, wrongList: [], history: {}
};

(function loadState() {
  try {
    var raw = localStorage.getItem('eq_v8');
    if (raw) { var sv = JSON.parse(raw); if (sv) for (var k in sv) if (S.hasOwnProperty(k)) S[k] = sv[k]; }
  } catch(e) { console.warn('Load failed, starting fresh:', e.message); }
  var d = new Date().toDateString(); if (S.today !== d) { S.today = d; S.todayOK = 0; S.todayNG = 0; }
})();

function saveState() {
  try {
    var keep = ['level','xp','hp','mhp','mp','mmp','streak','mxStreak','ok','ng','wins','losses','today','todayOK','todayNG','wrongList','history','badges','bossKills','chatCount','reviewCount','recent','curAlbum'];
    var d = {}; keep.forEach(function(k) { d[k] = S[k]; });
    localStorage.setItem('eq_v8', JSON.stringify(d));
  } catch(e) { console.warn('Save failed:', e.message); }
}

// ============================================================
// DERIVED STATE HELPERS
// ============================================================
function xpNext()   { return S.level * BALANCE.XP_PER_LEVEL; }
function addXp(n) { S.xp += n; var oldLv = S.level; while (S.xp >= xpNext()) { S.xp -= xpNext(); S.level++; S.mhp += BALANCE.HP_PER_LEVEL; S.hp = S.mhp; S.mmp += BALANCE.MP_PER_LEVEL; S.mp = S.mmp; } if (S.level > oldLv) { sfx('win'); floatDmg('LEVEL UP! Lv.'+S.level, '#ffd700'); for (var wi = 0; wi < WEAPONS.length; wi++) { if (WEAPONS[wi].lv > oldLv && WEAPONS[wi].lv <= S.level) { var w = WEAPONS[wi]; setTimeout(function() { floatDmg('NEW: '+w.e+' '+w.n+'!', '#ffd700'); }, 1500 + wi*800); } } } }
function updSkills() { S.skills = []; if (S.level >= BALANCE.LEVEL_UNLOCK.powerStrike) S.skills.push({n:'Power Strike',c:BALANCE.SKILL_COSTS.powerStrike,e:'⚡'}); if (S.level >= BALANCE.LEVEL_UNLOCK.manaShield) S.skills.push({n:'Mana Shield',c:BALANCE.SKILL_COSTS.manaShield,e:'🛡️'}); if (S.level >= BALANCE.LEVEL_UNLOCK.criticalEdge) S.skills.push({n:'Critical Edge',c:BALANCE.SKILL_COSTS.criticalEdge,e:'🔥'}); }

function adaptiveDiff() {
  if (S.recent.length < BALANCE.RECENT_COUNT / 2) return 'beginner';
  var rate = S.recent.filter(function(r) { return r; }).length / S.recent.length;
  var t = BALANCE.DIFF_THRESHOLDS;
  if (rate >= t.expert) return 'expert'; if (rate >= t.advanced) return 'advanced'; if (rate >= t.intermediate) return 'intermediate';
  return 'beginner';
}
function diffLabel() { var d = adaptiveDiff(); return {expert:'🎓 Expert (IELTS/TOEFL)', advanced:'💎 Advanced', intermediate:'⭐ Intermediate', beginner:'🌸 Beginner'}[d]; }
function diffDots()  { var d = adaptiveDiff(); return {beginner:'●○○○', intermediate:'●●○○', advanced:'●●●○', expert:'●●●●'}[d]; }
function diffDamage(){ return BALANCE.DIFF_DAMAGE[adaptiveDiff()]; }
function diffXP()    { return BALANCE.DIFF_XP[adaptiveDiff()]; }

function recordAnswer(ok) {
  var d = new Date().toDateString(); if (S.today !== d) { S.today = d; S.todayOK = 0; S.todayNG = 0; }
  if (ok) S.todayOK++; else S.todayNG++;
  var el = document.getElementById('today-stats');
  if (el) { var t = S.todayOK + S.todayNG; el.textContent = 'Today: '+S.todayOK+'✓ '+S.todayNG+'✗ | '+(t>0?Math.round(S.todayOK/t*100):0)+'%'; }
}

// ============================================================
// HELPERS
// ============================================================
function shuffle(a) { for (var i = a.length-1; i>0; i--) { var j = Math.floor(Math.random()*(i+1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function esc(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function addWordTips(text, excludeWords) {
  excludeWords = excludeWords || [];
  if (typeof WD === 'undefined') return text;
  return text.replace(/[a-zA-Z]+/g, function(w) { return excludeWords.indexOf(w) >= 0 ? w : (WD[w] ? '<span class="word-tip" data-cn="'+WD[w]+'">'+w+'</span>' : w); });
}
var AV = '<div class="ye-av"><img src="kirby_kanye.png" alt="Ye"></div>';

// ============================================================
// RENDER HELPERS — safe render + unified app render
// ============================================================
function safeRender(fn) {
  try { fn(); } catch(e) {
    console.error('Render crash:', e);
    var app = document.getElementById('app');
    if (app) app.innerHTML =
      '<div style="text-align:center;padding:40px;color:#ff6b6b">'+
      '<div style="font-size:48px">&#9888;</div>'+
      '<div style="margin:12px 0;font-size:16px">Something went wrong</div>'+
      '<div style="font-size:11px;color:#888;margin-bottom:20px">'+esc(e.message)+'</div>'+
      '<button class="btn gold" onclick="renderMenu()">&#9664; Back to Menu</button></div>';
  }
}
function renderApp(html) {
  try { document.getElementById('app').innerHTML = html; }
  catch(e) { console.error('renderApp:', e); }
}

// ============================================================
// MENU
// ============================================================
function renderMenu() {
  updSkills();
  var hpP = Math.round(S.hp/S.mhp*100), xpP = Math.round(S.xp/xpNext()*100), mpP = Math.round(S.mp/S.mmp*100);
  var qr = S.ok+S.ng > 0 ? Math.round(S.ok/(S.ok+S.ng)*100) : 0;
  var t = S.todayOK + S.todayNG, tr = t > 0 ? Math.round(S.todayOK/t*100) : 0;

  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">Yo, check it. Pick a battle. DROP THE BEAT. 🥁<br><span style="font-size:11px;color:#aaa;font-style:normal">嘿，选一场战斗，开始吧。</span></div></div></div>'+
    '<div class="stats">'+
      '<div class="st">Lv.'+S.level+'</div><div class="st">❤️ '+S.hp+'/'+S.mhp+'<span class="bar hp"><div style="width:'+hpP+'%"></div></span></div>'+
      '<div class="st">⭐ '+S.xp+'/'+xpNext()+'<span class="bar xp"><div style="width:'+xpP+'%"></div></span></div>'+
      '<div class="st">💠 '+S.mp+'/'+S.mmp+'<span class="bar mp"><div style="width:'+mpP+'%"></div></span></div></div>'+
    '<div class="acc">Streak:'+S.streak+' | Wins:'+S.wins+' | '+qr+'% | OK:'+S.ok+' NG:'+S.ng+'</div>'+
    '<div style="background:rgba(255,215,0,0.06);border-radius:12px;padding:10px 14px;margin:8px 0;display:flex;align-items:center;gap:10px">'+
      '<div style="font-size:32px;flex-shrink:0">'+getWeapon().e+'</div>'+
      '<div style="flex:1"><div style="font-size:14px;color:#ffd700;font-weight:bold">'+getWeapon().n+'</div>'+
      '<div style="font-size:11px;color:#aaa">ATK +'+getWeapon().dmg+' | Lv.'+S.level+'</div></div>'+
      '<div style="font-size:10px;color:#666;text-align:right">Next: '+nextWeapon()+'</div>'+
    '</div>'+
    '<div class="diff-ind">Level: '+diffDots()+' '+diffLabel()+'</div>'+
    '<div class="stats-panel"><b>📊 Today:</b> <span id="today-stats">'+S.todayOK+'✓ '+S.todayNG+'✗ | '+tr+'%</span> | <b>Total:</b> '+S.ok+'✓ '+S.ng+'✗ | <b>Max Streak:</b> '+S.mxStreak+'</div>'+
    ((S.badges||[]).length ? '<div class="badge-row">🏆 '+(S.badges||[]).slice(-6).map(function(b) { var a = ACHIEVEMENTS.find(function(x){return x.id===b}); return a ? '<span class="badge" title="'+a.desc+'">'+a.e+' '+a.n+'</span>' : ''; }).join('')+'</div>' : '')+
    (S.skills.length ? '<div class="skills">'+S.skills.map(function(s) { return '<span class="sk" data-s="'+s.n+'" data-c="'+s.c+'">'+s.e+' '+s.n+' ('+s.c+'MP)</span>'; }).join('')+'</div>' : '')+
    '<button class="btn gold" id="btn-b" onclick="fadeTo(renderMonsterSelect)">🥁 BATTLE!</button>'+
    '<button class="btn gold" id="btn-c" style="background:rgba(100,180,255,0.15);border-color:rgba(100,180,255,0.4)" onclick="fadeTo(renderChatScenes)">💬 AI Chat</button>'+
    '<button class="btn gold" id="btn-path" style="background:rgba(180,130,255,0.15);border-color:rgba(180,130,255,0.4)" onclick="fadeTo(renderLearningPath)">🗺️ Learning Path</button>'+
    '<button class="btn" id="btn-review" onclick="fadeTo(renderReview)">📊 Review & Stats</button>'+
    '<button class="btn" id="btn-w" onclick="fadeTo(renderWordList)">📖 Words</button>'+
    '<button class="btn" id="btn-r">🔄 Reset</button>'+
    '<button class="btn" id="btn-mute" style="font-size:18px;padding:6px 10px;width:auto;display:inline-block">'+(typeof _muted !== 'undefined' && _muted ? '🔇' : '🔊')+'</button>';

  renderApp(html);
  document.getElementById('btn-r').onclick = function() { if (confirm('Reset all progress?')) { localStorage.removeItem('eq_v8'); localStorage.removeItem('eq_apikey'); localStorage.removeItem('eq_weak'); location.reload(); } };
  document.getElementById('btn-mute').onclick = function() { var muted = toggleMute(); this.textContent = muted ? '🔇' : '🔊'; };
  document.querySelectorAll('.sk[data-s]').forEach(function(sk) { sk.onclick = function() { useSkill(this.dataset.s, parseInt(this.dataset.c)); }; });
}

// ============================================================
// LEARNING PATH
// ============================================================
function renderLearningPath() {
  var curr = adaptiveDiff(), rate = S.recent.length>=5 ? S.recent.filter(function(r){return r;}).length/S.recent.length*100 : 0;
  var currIdx = LEARNING_PATH.findIndex(function(l) { return l.id === curr; });
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">This is a MISSION. 🎯<br><span style="font-size:11px;color:#aaa;font-style:normal">英语学习路线图。这是使命，不是游戏。</span></div></div></div>';
  LEARNING_PATH.forEach(function(l, i) {
    var isCurr = (l.id === curr), isDone = !isCurr && i < currIdx, unlocked = S.ok+S.ng >= l.unlockAt;
    var cls = isCurr ? 'current' : isDone ? 'done' : (!unlocked ? 'locked' : '');
    html += '<div class="path-level '+cls+'">'+
      '<div style="display:flex;justify-content:space-between"><b style="color:'+(isCurr?'#ffd700':isDone?'#4cd964':'#aaa')+'">'+(isDone?'✅ ':'')+l.n+'</b><span style="font-size:11px">'+QQ[l.id].length+' questions</span></div>'+
      '<div style="font-size:12px;color:#aaa">'+l.desc+'</div><div style="font-size:11px;color:#666">📌 '+l.topics+' | 🎯 '+l.goal+'</div>';
    if (isCurr) html += '<div style="font-size:11px;color:#ffd700;margin-top:4px">▶ YOU ARE HERE — Accuracy: '+Math.round(rate)+'%</div>'+
      '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:4px"><div style="height:100%;width:'+Math.min(100,rate/75*100)+'%;background:#ffd700;border-radius:2px"></div></div>';
    if (!unlocked) html += '<div style="font-size:10px;color:#666;margin-top:4px">🔒 Answer '+l.unlockAt+' questions total to unlock</div>';
    html += '</div>';
  });
  html += '<button class="btn gold" onclick="renderMenu()" style="margin-top:10px">Back</button>';
  renderApp(html);
}

// ============================================================
// WORD LIBRARY — Category overview + detail views
// ============================================================
var WORD_CATEGORIES = [
  { id:'vocab',     e:'📖', n:'Vocabulary',    cn:'词汇',  desc:'Word & phrase translations — daily expressions, slang, and academic terms' },
  { id:'grammar',   e:'📐', n:'Grammar',       cn:'语法',  desc:'Sentence completion, tense practice, and dialogue patterns' },
  { id:'spelling',  e:'✍️', n:'Spelling',      cn:'拼写',  desc:'Chinese-to-English spelling — write the words you hear and read' },
  { id:'sentence',  e:'🔗', n:'Sentences',     cn:'连句',  desc:'Word ordering puzzles — rearrange scrambled words into correct sentences' },
  { id:'listening', e:'🎧', n:'Listening',     cn:'听力',  desc:'Audio comprehension — listen to spoken English and pick the meaning' }
];
var DIFF_ORDER = ['beginner','intermediate','advanced','expert'];
var DIFF_META = { beginner:{e:'🌸',n:'Beginner'}, intermediate:{e:'⭐',n:'Intermediate'}, advanced:{e:'💎',n:'Advanced'}, expert:{e:'🎓',n:'Expert'} };

function renderWordList() {
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">"I am not a fan of books." But this library? Dope. 📚<br><span style="font-size:11px;color:#aaa;font-style:normal">「我不是书的粉丝。」但这个图书馆太炸了。选个分类进去看看吧。</span></div></div></div>';
  WORD_CATEGORIES.forEach(function(cat) {
    // Count questions of this type across all levels
    var count = 0; for (var d in QQ) count += QQ[d].filter(function(q) { return q.t === cat.id; }).length;
    html += '<div class="path-level" style="cursor:pointer" data-cat="'+cat.id+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<b style="color:#ffd700;font-size:15px">'+cat.e+' '+cat.n+' <span style="font-size:11px;color:#aaa">'+cat.cn+'</span></b>'+
        '<span style="font-size:11px;color:#888">'+count+' items</span></div>'+
      '<div style="font-size:12px;color:#aaa;margin-top:4px">'+cat.desc+'</div></div>';
  });
  html += '<button class="btn gold" onclick="renderMenu()" style="margin-top:10px">Back</button>';
  renderApp(html);
  document.querySelectorAll('.path-level[data-cat]').forEach(function(card) {
    card.onclick = function() { fadeTo(function() { renderWordCategory(this.dataset.cat); }.bind(this)); };
  });
}

function renderWordCategory(type) {
  var cat = WORD_CATEGORIES.find(function(c) { return c.id === type; });
  if (!cat) { renderWordList(); return; }
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">'+cat.e+' '+cat.n+'<br><span style="font-size:11px;color:#aaa;font-style:normal">'+cat.desc+'</span></div></div></div>';

  DIFF_ORDER.forEach(function(diff) {
    var items = QQ[diff] ? QQ[diff].filter(function(q) { return q.t === type; }) : [];
    if (items.length === 0) return;
    var dm = DIFF_META[diff];
    html += '<div style="margin:8px 0"><div style="font-size:13px;color:#ffd700;margin-bottom:6px">'+dm.e+' '+dm.n+' <span style="font-size:10px;color:#888">('+items.length+' items)</span></div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
    items.forEach(function(q) {
      var en = esc(q.q), cn = esc(q.a);
      // Show useful content per type
      if (type === 'vocab') {
        html += '<span class="wl-chip" title="'+cn+'">'+en+' <span style="color:#ffd700;font-size:10px">→ '+cn+'</span></span>';
      } else if (type === 'grammar') {
        html += '<span class="wl-chip" title="A: '+en+'">'+en+' <span style="color:#ffd700;font-size:10px">→ '+cn+'</span></span>';
      } else if (type === 'spelling') {
        var prompt = en.replace('Spell the word: ','');
        html += '<span class="wl-chip">'+esc(prompt)+' <span style="color:#4cd964;font-size:10px">→ '+cn+'</span></span>';
      } else if (type === 'sentence') {
        html += '<span class="wl-chip" title="Correct order">'+cn+'</span>';
      } else if (type === 'listening') {
        var speak = q.speak ? esc(q.speak) : '';
        html += '<span class="wl-chip">🔊 '+speak+' <span style="color:#ffd700;font-size:10px">→ '+cn+'</span></span>';
      }
    });
    html += '</div></div>';
  });

  html += '<button class="btn gold" onclick="renderWordList()" style="margin-top:12px">Back</button>';
  renderApp(html);
}

// ============================================================
// INIT
// ============================================================
(function init() {
  var sc = document.getElementById('stars');
  for (var i = 0; i < 50; i++) {
    var d = document.createElement('div'); d.className = 'star';
    d.style.left = Math.random()*100+'%'; d.style.top = Math.random()*100+'%';
    d.style.width = d.style.height = (Math.random()*2+1)+'px';
    d.style.setProperty('--d', (Math.random()*3+2)+'s'); d.style.setProperty('--dl', (Math.random()*3)+'s');
    sc.appendChild(d);
  }
  renderSidebar(); renderMenu();
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !S.inBat) { renderMenu(); }});
  window.addEventListener('beforeunload', saveState);
  document.addEventListener('visibilitychange', function() { if (document.hidden) saveState(); });
  window.addEventListener('pagehide', saveState);
  window.addEventListener('error', function(e) {
    console.error('Global error:', e.error || e.message);
    if (!S.inBat) { safeRender(renderMenu); }
  });
})();

// Page transition helper
function fadeTo(fn) {
  var app = document.getElementById('app');
  if (!app) { fn(); return; }
  app.style.opacity = '0';
  setTimeout(function() { fn(); app.style.opacity = '1'; }, 120);
}
