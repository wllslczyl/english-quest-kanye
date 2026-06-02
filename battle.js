/* ===== Battle System: Monster Select, Questions, Combat ===== */
var _currentQ = null;

// Weak point tracking: count wrong answers per question
var _weakPoints = {}; // {questionText: count}
try { _weakPoints = JSON.parse(localStorage.getItem('eq_weak')) || {}; } catch(e) {}
var _recentQ = []; // Recent questions to avoid repetition

function renderMonsterSelect() {
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">Pick your opponent. Start small, build up. 🔥<br><span style="font-size:11px;color:#aaa;font-style:normal">选个对手吧。从简单的开始，慢慢升级。</span></div></div></div>'+
    MONSTERS.map(function(m, i) { return '<button class="btn gold" data-i="'+i+'" title="'+esc(m.d)+'">'+m.e+' '+m.n+' '+m.cn+' <span style="font-size:10px;color:#888">HP:'+m.hp+'</span></button>'; }).join('')+
    '<button class="btn" onclick="renderMenu()">Back</button>';
  renderApp(html);
  document.querySelectorAll('.btn.gold').forEach(function(b) { b.onclick = function() { startBattle(parseInt(this.dataset.i)); }; });
}

function startBattle(idx) {
  var m = MONSTERS[idx];
  S.monIdx = idx; S.monHp = m.hp + (m.boss ? Math.floor(m.hp*0.3) : Math.floor(Math.random()*8));
  S.mhp2 = S.monHp; S.inBat = true; S.streak = 0; S.bossSkillUsed = false;
  S.pw = false; S.shield = false; S.crit = false;
  updSkills(); renderQuestion();
  if (m.boss) { setTimeout(function() { bossEntrance(); }, 100); }
}

function bossSkillDamage() {
  var m = MONSTERS[S.monIdx];
  if (!m.boss || S.bossSkillUsed) return false;
  // Boss uses skill when HP < 50%
  if (S.monHp > S.mhp2 * 0.5) return false;
  S.bossSkillUsed = true;
  var dmg = Math.floor(S.mhp * 0.15) + Math.floor(Math.random()*10);
  if (!S.shield) { S.hp = Math.max(0, S.hp - dmg); } else { S.shield = false; dmg = 0; }
  floatDmg(m.e+' '+m.skill+'! -'+dmg, '#ff6b6b', 1.5);
  if (dmg > 0) shakeScreen(2);
  return true;
}

// ===== GSAP Animation Helpers (replaces CSS-only shakeScreen / floatDmg) =====
// Fallback to old CSS if GSAP not loaded
var _gsap = typeof gsap !== 'undefined' ? gsap : null;

function shakeScreen(intensity) {
  intensity = intensity || 1;
  var el = document.getElementById('app');
  if (_gsap) {
    _gsap.killTweensOf(el);
    _gsap.to(el, { duration:0.03, x: -8*intensity, ease:'power2.inOut', repeat:5, yoyo:true, onComplete:function() { _gsap.set(el, {x:0}); } });
  } else {
    el.classList.add('shake'); setTimeout(function() { el.classList.remove('shake'); }, 400);
  }
}

function floatDmg(text, color, scale) {
  scale = scale || 1;
  if (text.indexOf('LEVEL UP') >= 0) scale = 1.8;
  if (text.indexOf('DIVINE') >= 0 || text.indexOf('CRIT') >= 0) scale = 2.0;

  var d = document.createElement('div'); d.className = 'dmg-float'; d.textContent = text; d.style.color = color;
  d.style.left = (38 + Math.random()*24) + '%'; d.style.top = '28%';
  d.style.fontSize = (28 * scale) + 'px';
  d.style.fontWeight = '900';
  d.style.textShadow = '0 0 20px ' + color + ', 0 0 40px ' + color;
  d.style.letterSpacing = '2px';
  document.body.appendChild(d);

  if (_gsap) {
    _gsap.fromTo(d, { scale:0.3, opacity:0 }, { scale:1, opacity:1, duration:0.15, ease:'back.out(3)' });
    _gsap.to(d, { y:-80, opacity:0, scale:1.2, duration:1.0, delay:0.5, ease:'power2.out', onComplete:function() { d.remove(); } });
  } else {
    setTimeout(function() { d.remove(); }, 1200);
  }
}

function flashMonster() {
  var emoji = document.querySelector('.mon .emoji');
  if (!emoji) return;
  if (_gsap) {
    _gsap.to(emoji, { scale:1.3, filter:'brightness(2) blur(2px)', duration:0.08, yoyo:true, repeat:1, ease:'power2.out' });
  }
}

function elasticHPBar() {
  var bar = document.querySelector('.mon .hpbar div');
  if (!bar) return;
  if (_gsap) {
    _gsap.fromTo(bar, { scaleX:0.3 }, { scaleX:1, duration:0.5, ease:'elastic.out(1, 0.4)' });
  }
}

function sparkBurst(x, y, count, color) {
  count = count || 8; color = color || '#ffd700';
  if (!_gsap) return;
  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;width:4px;height:4px;border-radius:50%;background:'+color+';pointer-events:none;z-index:99;left:'+x+'px;top:'+y+'px;box-shadow:0 0 6px '+color;
    document.body.appendChild(p);
    var angle = Math.random()*Math.PI*2, dist = 40+Math.random()*60;
    _gsap.to(p, { x:Math.cos(angle)*dist, y:Math.sin(angle)*dist, opacity:0, scale:0, duration:0.5+Math.random()*0.3, ease:'power3.out', onComplete:function() { p.remove(); } });
  }
}

function streakGlow(level) {
  if (!_gsap) return;
  var el = document.getElementById('app');
  var color = level >= 10 ? '#ff4444' : level >= 5 ? '#ff8c00' : '#ffd700';
  var glow = document.createElement('div');
  glow.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:98;box-shadow:inset 0 0 '+ (level*4) +'px '+color+';border-radius:20px';
  document.getElementById('main-wrap').appendChild(glow);
  _gsap.fromTo(glow, { opacity:0.6 }, { opacity:0, duration:0.6+level*0.1, ease:'power2.out', onComplete:function() { glow.remove(); } });
}

function bossEntrance() {
  if (!_gsap) return;
  // Dark flash
  var dark = document.createElement('div');
  dark.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#1a0000;pointer-events:none;z-index:97';
  document.body.appendChild(dark);
  _gsap.fromTo(dark, { opacity:0.9 }, { opacity:0, duration:0.8, ease:'power2.out', onComplete:function() { dark.remove(); } });

  // Boss name bounce
  var nameEl = document.querySelector('.mon .name');
  if (nameEl) {
    _gsap.fromTo(nameEl, { y:40, opacity:0, scale:0.5 }, { y:0, opacity:1, scale:1.2, duration:0.6, ease:'back.out(2)' });
    _gsap.to(nameEl, { scale:1, duration:0.2, delay:0.6 });
  }

  // Shake the whole battlefield
  var app = document.getElementById('app');
  _gsap.to(app, { x:3, duration:0.04, repeat:8, yoyo:true, ease:'power2.inOut', delay:0.2, onComplete:function() { _gsap.set(app, {x:0}); } });
}

function getWeakType() {
  // Analyze weak points to find player's weakest question type
  var tc = {};
  for (var key in _weakPoints) {
    if (_weakPoints[key] < 2) continue;
    for (var d in QQ) {
      for (var i = 0; i < QQ[d].length; i++) {
        if (QQ[d][i].q === key) { var t = QQ[d][i].t; tc[t] = (tc[t] || 0) + _weakPoints[key]; break; }
      }
    }
  }
  var maxT = null, maxC = 0;
  for (var t in tc) { if (tc[t] > maxC) { maxC = tc[t]; maxT = t; } }
  if (maxC >= 3) return {type: maxT, count: maxC};
  return null;
}

function renderQuestion() {
  if (S.monHp <= 0) return renderVictory();
  if (S.hp <= 0) return renderDefeat();

	var isBoss = MONSTERS[S.monIdx].boss;
  var pool;

  // Boss mode: mix all levels + prioritize weak points
  if (isBoss) {
    pool = [];
    for (var d in QQ) pool = pool.concat(QQ[d]);
    // 30% chance to pick from weak points
    if (Math.random() < 0.3) {
      var weakKeys = Object.keys(_weakPoints).filter(function(k) { return _weakPoints[k] >= 2; });
      if (weakKeys.length > 0) {
        var wpQ = pool.filter(function(q) { return weakKeys.indexOf(q.q) >= 0; });
        if (wpQ.length > 0) pool = wpQ;
      }
    }
  } else {
    pool = QQ[adaptiveDiff()];
    // 20% chance to pick from weak points in normal battle
    if (Math.random() < 0.2) {
      var wks = Object.keys(_weakPoints).filter(function(k) { return _weakPoints[k] >= 2; });
      if (wks.length > 0) {
        var wq = pool.filter(function(q) { return wks.indexOf(q.q) >= 0; });
        if (wq.length > 0) pool = wq;
      }
    }
  }

  // Dedup: exclude recently asked questions
  var dedupPool = [];
  if (_recentQ.length > 0) {
    for (var di = 0; di < pool.length; di++) {
      if (_recentQ.indexOf(pool[di].q) < 0) dedupPool.push(pool[di]);
    }
    // If all questions excluded, use smaller recent window (last 5)
    if (dedupPool.length === 0) {
      var shortRecent = _recentQ.slice(-5);
      for (var dj = 0; dj < pool.length; dj++) {
        if (shortRecent.indexOf(pool[dj].q) < 0) dedupPool.push(pool[dj]);
      }
    }
    if (dedupPool.length === 0) dedupPool = pool;
  } else {
    dedupPool = pool;
  }

  var q = dedupPool[Math.floor(Math.random() * dedupPool.length)];
  if (!q || !q.q) {
    // Fallback: pick any question from any level
    for (var fd in QQ) { if (QQ[fd].length > 0) { q = QQ[fd][0]; break; } }
    if (!q || !q.q) { safeRender(function() { throw new Error('No questions available'); }); return; }
  }
  _currentQ = q;
  _recentQ.push(q.q); if (_recentQ.length > 15) _recentQ.shift();
  var m = MONSTERS[S.monIdx];
  var hpP = Math.round(S.monHp/S.mhp2*100);
  var bossClass = isBoss ? ' boss-glow' : '';

  var qHTML = '';
  if (q.t === 'vocab' || q.t === 'grammar') {
    var excl = q.o.slice();
    var qText = addWordTips(q.q, excl);
    var opts = q.o.slice(); if (opts.indexOf(q.a) < 0) opts.push(q.a); shuffle(opts);
    qHTML = '<div class="qbox"><div class="qtype">['+q.t+']</div><div class="qtext">'+qText+'</div>'+
      (q.s || SC[q.q] ? '<div class="hint-txt" id="cn-hint">📝 '+(q.s||SC[q.q])+'</div><span class="hint-btn" id="btn-hint">💡 Translation</span>' : '')+
      '<div class="opts" id="opts">'+opts.map(function(o,i) { return '<button class="obtn" data-i="'+i+'">'+o+'</button>'; }).join('')+'</div></div>';
  } else if (q.t === 'spelling') {
    qHTML = '<div class="qbox"><div class="qtype">[Spelling - 拼写]</div><div class="qtext">'+addWordTips(q.q)+'</div>'+
      '<div class="hint-txt" id="cn-hint" style="display:none">📝 '+q.a+'</div><span class="hint-btn" id="btn-hint">💡 Show Answer</span>'+
      '<input class="spell-input" id="spell-in" placeholder="Type the English word..." autocomplete="off"><button class="btn gold" id="spell-submit" style="margin-top:8px">Submit</button></div>';
  } else if (q.t === 'sentence') {
    var words = shuffle(q.o.slice());
    qHTML = '<div class="qbox"><div class="qtype">[Sentence - 连词成句]</div><div class="qtext">'+q.q+'</div>'+
      '<div class="hint-txt" id="cn-hint" style="display:none">📝 '+q.a+'</div><span class="hint-btn" id="btn-hint">💡 Show Answer</span>'+
      '<div class="sentence-built" id="sentence-built"></div>'+
      '<div class="sentence-words" id="sentence-words">'+words.map(function(w,i) { return '<span class="sentence-word" data-idx="'+i+'">'+w+'</span>'; }).join('')+'</div>'+
      '<button class="btn gold" id="sentence-submit" style="margin-top:8px">Submit</button></div>';
  } else if (q.t === 'listening') {
    qHTML = '<div class="qbox"><div class="qtype">[Listening - 听力]</div><div class="qtext">'+q.q+'</div>'+
      '<div class="hint-txt" id="cn-hint" style="display:none">📝 '+q.a+'</div><span class="hint-btn" id="btn-hint">💡 Translation</span>'+
      '<button class="listen-btn" id="listen-play">🔊 Play (click to hear)</button>'+
      '<div class="opts" id="opts" style="display:none">'+q.o.map(function(o,i) { return '<button class="obtn" data-i="'+i+'">'+o+'</button>'; }).join('')+'</div></div>';
  }

  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">Answer this! 🎯<br><span style="font-size:11px;color:#aaa;font-style:normal">回答这道题！答对攻击，答错掉血。</span></div></div></div>'+
    '<div class="mon"><div class="emoji'+bossClass+'">'+m.e+'</div><div class="name">'+m.n+' '+m.cn+'</div><div class="hpbar"><div style="width:'+hpP+'%"></div></div><div style="font-size:10px;color:#aaa">HP:'+S.monHp+'/'+S.mhp2+'</div>'+ (function(){ var wk = getWeakType(); var typeLabels = {vocab:'Vocabulary', grammar:'Grammar', spelling:'Spelling', sentence:'Sentence Building', listening:'Listening'}; return wk ? '<div style="font-size:10px;color:#ff6b6b;margin-top:2px">⚠️ Weak spot: '+ (typeLabels[wk.type]||wk.type) +'</div>' : ''; })() +'</div>'+
    '<div style="text-align:center;margin:6px 0;font-size:18px">'+getWeapon().e+' <b style="color:#ffd700">'+getWeapon().n+'</b> <span style="font-size:11px;color:#aaa">+'+getWeapon().dmg+' dmg</span></div>'+
    '<div class="stats"><div class="st">❤️ '+S.hp+'/'+S.mhp+'</div><div class="st">💠 '+S.mp+'/'+S.mmp+'</div><div class="st">⚡ '+S.streak+'</div></div>'+qHTML+
    (S.skills.length ? '<div class="skills">'+S.skills.map(function(s) { var off = (s.n==='Power Strike'&&S.pw)||(s.n==='Mana Shield'&&S.shield)||(s.n==='Critical Edge'&&S.crit); return '<span class="sk'+((off)?' off':'')+'" data-s="'+s.n+'" data-c="'+s.c+'">'+s.e+' '+s.n+'</span>'; }).join('')+'</div>' : '')+
    '<button class="btn" id="btn-fl">🏃 Run Away</button>';

  renderApp(html);
  window._submitting = false;
  document.getElementById('btn-fl').onclick = function() { document.removeEventListener('keydown', window._battleKey); window._battleKey = null; S.inBat = false; S.streak = 0; saveState(); fadeTo(renderMenu); };

  // Keyboard shortcuts for battle
  window._battleKey = function(e) {
    if (e.key === 'Escape') { window._battleKey = null; S.inBat = false; S.streak = 0; saveState(); fadeTo(renderMenu); return; }
    if (e.key >= '1' && e.key <= '4') { var opts = document.querySelectorAll('.obtn:not(:disabled)'); var idx = parseInt(e.key) - 1; if (opts[idx]) opts[idx].click(); }
    if (e.key === 'Enter') { var ss = document.getElementById('spell-submit'); if (ss) { ss.click(); return; } var se = document.getElementById('sentence-submit'); if (se) se.click(); }
  };
  document.addEventListener('keydown', window._battleKey);

  var hintBtn = document.getElementById('btn-hint'), hintDiv = document.getElementById('cn-hint');
  if (hintBtn) hintBtn.onclick = function() { var vis = hintDiv.style.display === 'block'; hintDiv.style.display = vis ? 'none' : 'block'; hintBtn.textContent = vis ? '💡 Translation' : '🙈 Hide'; };
  document.querySelectorAll('.sk[data-s]:not(.off)').forEach(function(sk) { sk.onclick = function() { useSkill(this.dataset.s, parseInt(this.dataset.c)); }; });

  if (q.t === 'vocab' || q.t === 'grammar') {
    document.querySelectorAll('.obtn').forEach(function(b) { b.onclick = function() { submitAnswer(q.a, this.textContent.trim(), this); }; });
  } else if (q.t === 'spelling') {
    document.getElementById('spell-submit').onclick = function() { var v = document.getElementById('spell-in').value.trim(); if (!v) { var si = document.getElementById('spell-in'); si.style.borderColor = '#ff4444'; si.placeholder = 'Please enter an answer!'; si.focus(); return; } submitAnswer(q.a, v, null); };
    document.getElementById('spell-in').onkeydown = function(e) { if (e.key === 'Enter') { var v = this.value.trim(); if (!v) { this.style.borderColor = '#ff4444'; this.placeholder = 'Please enter an answer!'; return; } submitAnswer(q.a, v, null); } };
    setTimeout(function() { var si = document.getElementById('spell-in'); if (si) si.focus(); }, 100);
  } else if (q.t === 'sentence') {
    var built = [];
    function updateBuilt() {
      var bd = document.getElementById('sentence-built'); if (!bd) return;
      bd.innerHTML = ''; built.forEach(function(w) {
        var span = document.createElement('span'); span.className = 'placed'; span.textContent = w;
        span.onclick = function() { this.remove(); var idx = built.indexOf(w); if (idx >= 0) built.splice(idx, 1); document.querySelectorAll('.sentence-word').forEach(function(el) { if (el.textContent === w) el.classList.remove('used'); }); };
        bd.appendChild(span);
      });
    }
    document.querySelectorAll('.sentence-word').forEach(function(el) { el.onclick = function() { if (this.classList.contains('used')) return; this.classList.add('used'); built.push(this.textContent.trim()); updateBuilt(); }; });
    document.getElementById('sentence-submit').onclick = function() { submitAnswer(q.a, built.join(' '), null); };
  } else if (q.t === 'listening') {
    var optsDiv = document.getElementById('opts');
    document.getElementById('listen-play').onclick = function() {
      this.style.display = 'none'; optsDiv.style.display = 'grid';
      speakTTS(q.speak);
      document.querySelectorAll('#opts .obtn').forEach(function(b) { b.onclick = function() { submitAnswer(q.a, this.textContent.trim(), this); }; });
    };
  }
}

function useSkill(name, cost) {
  if (S.mp < cost) return; S.mp -= cost;
  if (name === 'Power Strike') S.pw = true;
  else if (name === 'Mana Shield') S.shield = true;
  else if (name === 'Critical Edge') S.crit = true;
  document.querySelectorAll('.sk').forEach(function(s) { if (s.dataset.s === name) s.classList.add('off'); });
}

function submitAnswer(ca, chosen, btn) {
  if (!S.inBat) return;
  if (window._submitting) return; window._submitting = true;
  var q = _currentQ;
  document.querySelectorAll('.obtn,.spell-input,.sentence-word,.listen-btn').forEach(function(el) { try { el.disabled = true; el.style.pointerEvents = 'none'; } catch(e) {} });
  if (btn) document.querySelectorAll('.obtn').forEach(function(b) { try { if (b.textContent.trim() === ca) b.classList.add('ok'); } catch(e) {} });

  var isOk = S.crit || (chosen && ca && chosen.toLowerCase().trim() === ca.toLowerCase().trim());
  S.crit = false; var dmg = 0, qc = '';
  if (isOk) {
    S.streak++; S.mxStreak = Math.max(S.mxStreak, S.streak); S.ok++;
    S.recent.push(true); if (S.recent.length > 10) S.recent.shift();
    var dk = new Date().toDateString(); if (!S.history[dk]) S.history[dk] = {ok:0, ng:0}; S.history[dk].ok++;
    var wp = getWeapon();
    dmg = BALANCE.BASE_DAMAGE + S.level * BALANCE.DAMAGE_PER_LEVEL + wp.dmg;
    var wasPw = S.pw; S.pw = false;
    if (wasPw) { dmg *= BALANCE.CRIT_DAMAGE_MULT; }
    if (S.streak >= BALANCE.STREAK_THRESHOLD) { dmg = Math.floor(dmg * BALANCE.STREAK_BONUS); qc = 'streak'; } else qc = 'ok';
    S.monHp -= dmg;
    // Weapon animation — GSAP enhanced
    flashMonster(); elasticHPBar();
    floatDmg(wp.e + ' -' + dmg, wasPw ? '#ffd700' : '#4cd964');
    if (wasPw) {
      document.querySelector('.mon .emoji').classList.add('crit-pulse');
      floatDmg(wp.hit.toUpperCase() + '!', '#ffd700', 2.0);
      var rect = document.querySelector('.mon .emoji').getBoundingClientRect();
      sparkBurst(rect.left+rect.width/2, rect.top+rect.height/2, 16, '#ffd700');
    }
    if (S.streak === 5 || S.streak === 10 || S.streak === 15) streakGlow(S.streak);
    sfx(S.streak >= 3 ? 'win' : 'ok');
    // Weak point: reduce counter on correct answer
    if (q && _weakPoints[q.q]) { _weakPoints[q.q] = Math.max(0, _weakPoints[q.q] - 1); localStorage.setItem('eq_weak', JSON.stringify(_weakPoints)); }
    if (S.monHp > 0) { setTimeout(function() { bossSkillDamage(); saveState(); }, 700); }
  } else {
    S.streak = 0; S.ng++; if (btn) try { btn.classList.add('ng'); } catch(e) {}
    S.recent.push(false); if (S.recent.length > 10) S.recent.shift();
    if (q) { S.wrongList.push({q: q.q, a: ca, type: q.t}); if (S.wrongList.length > BALANCE.WRONG_LIST_MAX) S.wrongList.shift(); }
    var dk = new Date().toDateString(); if (!S.history[dk]) S.history[dk] = {ok:0, ng:0}; S.history[dk].ng++;
    qc = 'ng'; var md = diffDamage();
    if (S.shield) { S.shield = false; } else { S.hp = Math.max(0, S.hp - md); }
    // Animations — GSAP enhanced
    shakeScreen(1.5); floatDmg('-' + md, '#ff4444', 1.2);
    sfx('ng');
    // Weak point tracking
    if (q) { _weakPoints[q.q] = (_weakPoints[q.q] || 0) + 1; localStorage.setItem('eq_weak', JSON.stringify(_weakPoints)); }
  }
  recordAnswer(isOk);

  var qt = randQuote(qc);
  var qb = document.querySelector('.qbox');
  var qd = document.createElement('div'); qd.className = 'quote';
  qd.innerHTML = '<span>'+qt[0]+'</span><span class="cn">'+qt[1]+'</span>';
  if (!isOk) {
    // 显示正确答案
    var ansDiv = document.createElement('div');
    ansDiv.style.cssText = 'font-size:13px;color:#4cd964;margin-top:6px;padding:6px 10px;background:rgba(76,217,100,0.08);border-radius:6px';
    ansDiv.textContent = '✔ ' + ca;
    qd.appendChild(ansDiv);
    var note = getGrammarNote(ca);
    if (note) { var nd = document.createElement('div'); nd.style.cssText = 'font-size:11px;color:#ffd700;margin-top:6px;padding:6px 10px;background:rgba(255,215,0,0.08);border-radius:6px'; nd.textContent = '📝 ' + note; qd.appendChild(nd); }
  }
  if (qb) qb.appendChild(qd);
  var btnNext = document.createElement('button'); btnNext.className = 'btn gold'; btnNext.textContent = '▶ Next'; btnNext.style.marginTop = '8px';
  btnNext.onclick = function() { try { renderQuestion(); } catch(e) { renderMenu(); } };
  if (qb) qb.appendChild(btnNext); else document.getElementById('app').appendChild(btnNext);
  // Debounce save to avoid micro-stutter on slow devices
  if (window._saveTimer) clearTimeout(window._saveTimer);
  window._saveTimer = setTimeout(saveState, 200);
}

function renderVictory() {
  window.scrollTo(0,0);
  S.inBat = false; S.wins++; var m = MONSTERS[S.monIdx]; var xp = diffXP() + Math.floor(Math.random()*6);
  if (m.boss) { xp += 15; S.bossKills = (S.bossKills||0) + 1; }
  addXp(xp); S.hp = Math.min(S.mhp, S.hp + BALANCE.HEAL_ON_WIN); sfx('win'); saveState();
  var wq = randQuote('win');
  var newly = checkAchievements();
  var achHTML = '';
  if (newly.length > 0) {
    achHTML = '<div class="ach-pop" style="animation:fadeInUp 0.5s ease">';
    newly.forEach(function(a) { achHTML += '<div class="ach-badge"><span style="font-size:24px">'+a.e+'</span> '+a.n+'<br><span style="font-size:10px;color:#888">'+a.desc+'</span></div>'; });
    achHTML += '</div>';
  }
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">'+wq[0]+'</div></div></div>'+
    '<div class="quote"><span>🥇 VICTORY! +'+xp+' XP</span><span class="cn">'+wq[1]+'</span></div>'+
    achHTML +
    '<button class="btn gold" onclick="renderMenu()" style="margin-top:12px">Back to Studio</button>';
  renderApp(html);
}

function renderDefeat() {
  window.scrollTo(0,0);
  S.inBat = false; S.losses++; S.hp = Math.floor(S.mhp * BALANCE.DEFEAT_HP_RESTORE); sfx('lose'); saveState();
  var lq = randQuote('lose');
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">'+lq[0]+'</div></div></div>'+
    '<div class="quote" style="color:#ff4444"><span>Defeated. Geniuses learn from L\'s.</span><span class="cn">'+lq[1]+'</span></div>'+
    '<button class="btn gold" onclick="renderMenu()" style="margin-top:12px">Run It Back</button>';
  renderApp(html);
}
