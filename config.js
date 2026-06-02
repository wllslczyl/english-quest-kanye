/* ===== Kanye English Quest — Configuration ===== */

// --- API Key ---
// NEVER hardcode keys. Stored in localStorage, prompted on first use.
var API = {
  getKey: function() {
    return localStorage.getItem('eq_apikey') || '';
  },
  setKey: function(key) {
    localStorage.setItem('eq_apikey', key);
  },
  hasKey: function() {
    return !!this.getKey();
  },
  promptKey: function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self.hasKey()) { resolve(true); return; }
      // Remove existing modal if any
      var old = document.getElementById('api-key-overlay');
      if (old) old.remove();
      // Build modal overlay
      var overlay = document.createElement('div');
      overlay.id = 'api-key-overlay';
      overlay.innerHTML =
        '<div class="ak-card">'+
          '<div class="ak-title">🔑 API Key</div>'+
          '<div class="ak-desc">Enter your <b>DeepSeek</b> API key to enable AI Chat.<br>'+
            'Get one free at: <a href="https://platform.deepseek.com" target="_blank" rel="noopener" style="color:#ffd700">platform.deepseek.com</a></div>'+
          '<input class="ak-input" type="password" placeholder="sk-..." autocomplete="off">'+
          '<div class="ak-btns">'+
            '<button class="ak-save">💾 Save & Chat</button>'+
            '<button class="ak-skip">Skip (text-only)</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(overlay);
      var inp = overlay.querySelector('.ak-input');
      setTimeout(function() { inp.focus(); }, 100);
      // Save handler
      overlay.querySelector('.ak-save').onclick = function() {
        var k = inp.value.trim();
        if (k) { self.setKey(k); }
        overlay.remove(); resolve(!!k);
      };
      // Skip handler
      overlay.querySelector('.ak-skip').onclick = function() {
        overlay.remove(); resolve(false);
      };
      // Enter key in input
      inp.onkeydown = function(e) {
        if (e.key === 'Enter') { overlay.querySelector('.ak-save').click(); }
      };
      // Click outside to dismiss
      overlay.onclick = function(e) {
        if (e.target === overlay) { overlay.querySelector('.ak-skip').click(); }
      };
    });
  }
};

// --- Monsters ---
var MONSTERS = [
  { k:'slime',  n:'Slime',       cn:'史莱姆', e:'🟢', d:'偷吃字母的果冻怪!',   hp:22, tier:1 },
  { k:'goblin', n:'Goblin',      cn:'哥布林', e:'👺', d:'挥舞着错误语法棒!',    hp:35, tier:1 },
  { k:'ghost',  n:'Ghost',       cn:'幽灵',   e:'👻', d:'飘荡的拼写错误!',      hp:48, tier:2 },
  { k:'dragon', n:'Grammar Drake',cn:'语法龙', e:'🐉', d:'喷吐不规则动词!',      hp:60, tier:2 },
  { k:'boss',   n:'Vocab Lord',  cn:'词汇王', e:'👑', d:'英语混沌的最终Boss!',  hp:80, tier:3, boss:true, skill:'Word Storm' },
  { k:'grammarBoss', n:'Grammar Titan', cn:'语法泰坦', e:'🗿', d:'被错误时态封印的远古巨像!', hp:100, tier:4, boss:true, skill:'Tense Crush' },
  { k:'spellBoss', n:'Spelling Sphinx', cn:'拼写狮身', e:'🦁', d:'谜语般的字母守护者!', hp:90, tier:4, boss:true, skill:'Letter Scramble' },
  { k:'finalBoss', n:'YE HIMSELF', cn:'侃爷本尊', e:'🎭', d:'"I am a god." Kanye本人在控制所有怪物!', hp:150, tier:5, boss:true, skill:'Divine Flow' }
];

// --- Albums (cover images in 专辑封面/ folder) ---
var ALBUMS = [
  { n:'The College Dropout',                    sn:'College Dropout', y:'2004', bg:0, c:'#d4a574' },
  { n:'Late Registration',                      sn:'Late Registration', y:'2005', bg:1, c:'#c4a060' },
  { n:'Graduation',                             sn:'Graduation',      y:'2007', bg:2, c:'#e870b4' },
  { n:'808s & Heartbreak',                      sn:'808s',            y:'2008', bg:3, c:'#aac4d8' },
  { n:'My Beautiful Dark Twisted Fantasy',      sn:'MBDTF',           y:'2010', bg:4, c:'#c44040' },
  { n:'Yeezus',                                 sn:'Yeezus',          y:'2013', bg:5, c:'#dd6633' },
  { n:'ye',                                     sn:'ye',              y:'2018', bg:6, c:'#5a9a6a' },
  { n:'JESUS IS KING',                          sn:'JESUS IS KING',   y:'2019', bg:7, c:'#6688cc' }
];

// --- Kanye Quotes [en, cn] ---
var KQ = {
  ok: [
    ['"I am the number one human being in music."','「在音乐界，我是头号人物。」'],
    ['"Shoot for the stars, so if you fall you land on a cloud."','「瞄准星星，即使坠落也会落在云上。」'],
    ['"Believe in your flyness, conquer your shyness."','「相信你的酷，征服你的羞怯。」'],
    ['"Be great! Be great! Be awesome!"','「做个伟大的人！做最好的自己！」'],
    ['"Everything I\'m not made me everything I am."','「我不是的那些东西，成就了今天的我。」'],
    ['"The time is now to express yourself."','「就是现在，表达你自己。」'],
    ['"I love you like kanye loves kanye."','[我爱你就像侃爷爱侃爷]'],
  ],
  streak: [
    ['"I\'m on a mission, they not on a mission."','「我有使命在身，他们没有。」'],
    ['"YOU A WAVY DUDE. You really are."','「你是个有品味的人，真的。」']
  ],
  ng: [
    ['"Don\'t give up. Mistakes make you stronger."','「别放弃，错误让你更强大。」'],
    ['"Man, mistakes are cool... learn from them."','「失误挺酷的…从中学习吧。」']
  ],
  win: [
    ['"I am Warhol. I am No.1. And YOU just proved greatness."','「我是沃霍尔。而你刚刚证明了伟大。」'],
    ['"Turn my mistakes into lessons. Victory!"','「把错误变成教训。胜利！」']
  ],
  lose: [
    ['"Even the L\'s are lessons. Go again."','「就算是输也是教训。再来。」'],
    ['"Nothing in life is promised except death. And another chance."','「人生除了死亡什么也不能保证。还有另一次机会。」']
  ]
};
function randQuote(cat) { var a = KQ[cat]; return a[Math.floor(Math.random() * a.length)]; }

// --- AI Chat Scenes ---
var CHAT_SCENES = [
  { n:'🍔 Restaurant', sys:'You are a waiter at an American restaurant. Speak ONLY in English. Keep responses short (1-3 sentences). Use natural restaurant English. Gently correct grammar mistakes in parentheses.', prompt:'Welcome! Table for how many? Here is our menu.' },
  { n:'🗺️ Directions', sys:'You are a friendly passerby. Speak ONLY in English. Keep responses short. Give directions. Gently correct grammar in parentheses.', prompt:'Hey there! Need help finding somewhere?' },
  { n:'🛒 Shopping', sys:'You are a shop assistant. Speak ONLY in English. Keep responses short. Help find items. Gently correct grammar in parentheses.', prompt:'Hi! Looking for anything in particular?' },
  { n:'☕ Cafe Chat', sys:'You are a friendly person at a cafe. Speak ONLY in English. Chat casually about hobbies, weather, life. 2-3 sentences. Gently correct grammar.', prompt:'Hey! Mind if I sit here? Nice day, isn\'t it?' },
  { n:'💼 Job Interview', sys:'You are a job interviewer. Speak ONLY in English. Ask professional questions. 2-3 sentences. Gently note grammar issues.', prompt:'Welcome! Tell me about yourself.' },
  { n:'🏨 Hotel', sys:'You are hotel front desk. Speak ONLY in English. Keep it short. Help with check-in, services. Gently correct grammar.', prompt:'Good evening! Do you have a reservation?' }
];

// --- Grammar Notes (shown on wrong answers) ---
var GRAMMAR_NOTES = {
  'am':'Use "am" with "I". Example: I am happy.',
  'is':'Use "is" with he/she/it or singular nouns. Example: She is tall.',
  'are':'Use "are" with you/we/they or plural nouns. Example: They are friends.',
  'goes':'Third person singular (he/she/it) adds -es to "go". Example: He goes to school.',
  'playing':'After "like/enjoy", use verb+ing (gerund). Example: I like playing.',
  'speak':'After "can/could/will/would", use the base form of the verb. Example: She can speak.',
  'were':'Use "were" for unreal/imaginary situations with ALL subjects. Example: If I were you...',
  'went':'Past tense of "go". "It\'s time" is followed by past tense. Example: It\'s time you went.',
  'being':'After prepositions (despite, without), use verb+ing. Example: Despite being tired...',
  'made':'Passive voice: be + past participle. Example: The cake was made by mom.',
  'meeting':'After "look forward to", use verb+ing. "To" here is a preposition, not part of infinitive.',
  'lived':'In reported speech, the tense shifts back. "Where do you live?" → "She asked where I lived."',
  'is reading':'Present continuous: be + verb+ing. Used for actions happening RIGHT NOW.',
  'leave':'After "suggest that", use the base form (subjunctive). Example: He suggested that we leave.',
  'had studied':'Use past perfect (had + past participle) for regrets about the past. Example: I wish I had studied.',
  'am (proximity)':'With "neither...nor", the verb agrees with the closest subject. "I" → "am".',
  'taller':'Comparative: adjective+er for short words. "Than" is required for comparison.',
  'does':'For negative sentences with he/she/it, use "does not" + base verb.',
  'faster':'Irregular comparative of "fast" → "faster". Short adjectives add -er.',
  'the better':'Fixed structure: "The more... the more..." for proportional relationships.',
  'had we':'In formal English, "Hardly... when" triggers inversion. Hardly had we arrived when...',
  'can she':'After "Not only", use question word order (inversion). Not only can she sing...',
  'had I arrived':'After "No sooner", use past perfect with inversion. No sooner had I arrived...',
  'would have acted':'Third conditional: If + past perfect → would have + past participle.',
  'have I seen':'After "Rarely/Never/Seldom", use inversion. Rarely have I seen such beauty.',
  'attend':'Subjunctive after "insist that": base form of verb. He insisted that she attend.',
  'be':'Subjunctive after "imperative that": base form. It is imperative that he be on time.',
  'were':'Use subjunctive "were" in unreal conditions. Were it not for you...',
  'should you leave':'After "Under no circumstances", use inversion. Under no circumstances should you leave.',
  'have':'With "one of the + plural noun + who", use plural verb. She is one of those who have.',
};
function getGrammarNote(answer) {
  var key = answer;
  // Try to match
  if (GRAMMAR_NOTES[key]) return GRAMMAR_NOTES[key];
  if (GRAMMAR_NOTES[key+' (proximity)']) return GRAMMAR_NOTES[key+' (proximity)'];
  return '';
}

// --- Weapons (unlocked by level) ---
var WEAPONS = [
  { n:'Bare Hands',  dmg:0,  lv:1,  e:'👊', hit:'punch' },
  { n:'Mic Drop',    dmg:5,  lv:2,  e:'🎤', hit:'sonic boom' },
  { n:'Yeezy Kick',  dmg:10, lv:4,  e:'👟', hit:'swift kick' },
  { n:'CD Slice',    dmg:18, lv:6,  e:'💿', hit:'sharp disc' },
  { n:'Flame Bar',   dmg:28, lv:8,  e:'🔥', hit:'fiery verse' },
  { n:'YEEZUS MODE', dmg:40, lv:10,e:'👑', hit:'DIVINE STRIKE' },
];
function getWeapon() {
  for (var i = WEAPONS.length-1; i >= 0; i--) { if (S.level >= WEAPONS[i].lv) return WEAPONS[i]; }
  return WEAPONS[0];
}
function nextWeapon() {
  for (var i = 0; i < WEAPONS.length; i++) { if (WEAPONS[i].lv > S.level) return WEAPONS[i].e + ' ' + WEAPONS[i].n + ' (Lv.' + WEAPONS[i].lv + ')'; }
  return 'MAX LEVEL';
}

// --- Game Balance Constants (no more magic numbers) ---
var BALANCE = {
  XP_PER_LEVEL: 25,
  HP_PER_LEVEL: 10,
  MP_PER_LEVEL: 5,
  BASE_DAMAGE: 10,
  DAMAGE_PER_LEVEL: 3,
  STREAK_BONUS: 1.5,
  STREAK_THRESHOLD: 3,
  CRIT_DAMAGE_MULT: 2,
  DIFF_DAMAGE: { beginner:2, intermediate:3, advanced:4, expert:6 },
  DIFF_XP: { beginner:8, intermediate:14, advanced:20, expert:30 },
  DIFF_THRESHOLDS: { intermediate:0.45, advanced:0.75, expert:0.9 },
  RECENT_COUNT: 10,
  SKILL_COSTS: { powerStrike:10, manaShield:15, criticalEdge:20 },
  LEVEL_UNLOCK: { powerStrike:3, manaShield:5, criticalEdge:7 },
  HEAL_ON_WIN: 20, 
  DEFEAT_HP_RESTORE: 0.4,
  WRONG_LIST_MAX: 200,
  ALBUM_BG: 0,
};

// --- Learning Path ---
var LEARNING_PATH = [
  { id:'beginner',    n:'🌸 Beginner',        desc:'Daily Conversations',  topics:'问候·点餐·问路·购物·自我介绍', goal:'日常对话无障碍',       unlockAt:0   },
  { id:'intermediate',n:'⭐ Intermediate',     desc:'Slang & Hip-Hop',     topics:'俚语·嘻哈词·短语动词·地道表达', goal:'听懂歌词·聊天有范',     unlockAt:80  },
  { id:'advanced',    n:'💎 Advanced',         desc:'Opinions & Debates',  topics:'观点表达·辩论·讲故事·习语',   goal:'看电影不用字幕',         unlockAt:160 },
  { id:'expert',      n:'🎓 Expert (IELTS)',   desc:'Academic English',    topics:'学术讨论·社会议题·批判思维',   goal:'雅思口语6.5+·英语面试', unlockAt:240 }
];

// --- Achievements ---
var ACHIEVEMENTS = [
  { id:'firstWin',   n:'First Blood',     e:'🩸', desc:'击败第一个怪物',       check:function() { return S.wins >= 1; } },
  { id:'streak5',    n:'On Fire',         e:'🔥', desc:'连续答对5题',           check:function() { return S.mxStreak >= 5; } },
  { id:'streak10',   n:'Monster Mode',    e:'👹', desc:'连续答对10题',          check:function() { return S.mxStreak >= 10; } },
  { id:'wins10',     n:'Battler',         e:'⚔️', desc:'赢得10场战斗',          check:function() { return S.wins >= 10; } },
  { id:'wins50',     n:'Warrior',         e:'🛡️', desc:'赢得50场战斗',          check:function() { return S.wins >= 50; } },
  { id:'level5',     n:'Rising Star',     e:'⭐', desc:'达到等级5',             check:function() { return S.level >= 5; } },
  { id:'level10',    n:'Superstar',       e:'🌟', desc:'达到等级10',            check:function() { return S.level >= 10; } },
  { id:'accuracy80', n:'Sharpshooter',    e:'🎯', desc:'总正确率超过80%(50题+)',check:function() { var t=S.ok+S.ng; return t>=50 && S.ok/t>=0.8; } },
  { id:'accuracy90', n:'Genius',          e:'🧠', desc:'总正确率超过90%(100题+)',check:function() { var t=S.ok+S.ng; return t>=100 && S.ok/t>=0.9; } },
  { id:'bossKill',   n:'Boss Slayer',     e:'💀', desc:'击败任意Boss',         check:function() { return (S.bossKills||0) >= 1; } },
  { id:'daily7',     n:'Consistent King', e:'📅', desc:'累计7天有练习记录',     check:function() { return Object.keys(S.history).length >= 7; } },
  { id:'chat10',     n:'Socializer',      e:'💬', desc:'进行10次AI对话',        check:function() { return (S.chatCount||0) >= 10; } },
  { id:'wrongReview',n:'Learner',         e:'📝', desc:'回顾错题5次',           check:function() { return (S.reviewCount||0) >= 5; } },
];

function checkAchievements() {
  var newly = [];
  ACHIEVEMENTS.forEach(function(a) {
    if ((S.badges||[]).indexOf(a.id) < 0 && a.check()) {
      if (!S.badges) S.badges = [];
      S.badges.push(a.id);
      newly.push(a);
    }
  });
  return newly;
}
