/* ===== AI Chat: Scene Selection, Streaming Chat, Translation ===== */
var _chatMsgs = [], _chatScene = -1;

function renderChatScenes() {
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">Yo, let\'s practice real English conversations. Pick a scene. 🎤<br><span style="font-size:11px;color:#aaa;font-style:normal">来练真实英语对话吧，选一个场景。</span></div></div></div>'+
    '<div style="font-size:13px;color:#ffd700;margin-bottom:8px">Choose a scenario:</div>'+
    CHAT_SCENES.map(function(s, i) { return '<button class="btn gold" data-i="'+i+'" style="text-align:left;font-weight:normal">'+s.n+'</button>'; }).join('')+
    '<button class="btn" onclick="renderMenu()">Back</button>';
  renderApp(html);
  document.querySelectorAll('.btn.gold').forEach(function(b) { b.onclick = function() { startChat(parseInt(this.dataset.i)); }; });
}

function startChat(idx) {
  _chatScene = idx; _chatMsgs = [{role:'assistant', text:CHAT_SCENES[idx].prompt}];
  S.chatCount = (S.chatCount||0) + 1;
  if (!API.hasKey()) { API.promptKey(); }
  renderChatUI();
}

function renderChatUI() {
  var s = CHAT_SCENES[_chatScene];
  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">'+s.n+' | Type or tap 🎤 to speak.</div></div></div>';
  html += '<div id="chat-msgs">';
  _chatMsgs.forEach(function(m, i) {
    if (m.role === 'user') {
      html += '<div class="chat-msg-user"><span>'+esc(m.text)+'</span>'+
        (m.text ? ' <span class="tts-btn" data-tr="'+m.text.replace(/"/g,'&quot;')+'" title="Translate your sentence" onclick="window._translateMsg(this)" style="font-size:11px">译</span>' : '')+
        '</div>';
    } else {
      html += '<div class="chat-msg-ai"><span class="ai-bubble">'+esc(m.text)+(m.text?'':' <span style="color:#ffd700">Kanye is thinking...</span>')+'</span>'+
        (m.text ? ' <span class="tts-btn" data-text="'+esc(m.text)+'" title="Read aloud">🔊</span>' : '')+
        (m.text ? ' <span class="tts-btn" data-tr="'+m.text.replace(/"/g,'&quot;')+'" title="Translate" onclick="window._translateMsg(this)" style="font-size:12px">译</span>' : '')+'</div>';
    }
  });
  html += '</div>';
  html += '<div style="display:flex;gap:6px">'+
    '<button class="ctrl-btn" id="chat-mic" onclick="window._toggleRecord()" style="width:44px;height:44px;font-size:18px;flex-shrink:0">🎤</button>'+
    '<audio id="chat-playback" style="display:none;height:44px;width:80px;flex-shrink:0" controls></audio>'+
    '<input id="chat-input" class="spell-input" style="margin-top:0;flex:1;text-align:left;font-size:14px" placeholder="Type English, or tap 🎤 to record..." onkeydown="if(event.key===\'Enter\')window._sendChat()">'+
    '<button class="btn gold" id="chat-send" style="width:auto;padding:10px 16px;flex-shrink:0">Send</button></div>'+
    '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;justify-content:center">'+
      '<span class="sk" onclick="window._quickReply(\'Can you repeat that?\')">Can you repeat?</span>'+
      '<span class="sk" onclick="window._quickReply(\'What does that mean?\')">What does that mean?</span>'+
      '<span class="sk" onclick="window._quickReply(\'Can you speak slower?\')">Speak slower</span>'+
    '</div>'+
    '<button class="btn" onclick="renderMenu()" style="margin-top:8px">Back to Menu</button>';

  renderApp(html);
  document.getElementById('chat-send').onclick = sendChat;
  document.querySelectorAll('.tts-btn[data-text]').forEach(function(b) { b.onclick = function() { speakTTS(this.dataset.text); }; });

  // Expose to window for inline onclick
  window._toggleRecord = toggleRecord;
  window._sendChat = sendChat;
  window._quickReply = function(t) { document.getElementById('chat-input').value = t; sendChat(); };
  window._retryChat = function() {
    _chatMsgs.pop(); // Remove error message
    var lastUser = _chatMsgs[_chatMsgs.length - 1];
    if (lastUser && lastUser.role === 'user') {
      document.getElementById('chat-input').value = lastUser.text;
      sendChat();
    } else { renderChatUI(); }
  };
  window._translateMsg = async function(el) {
    var text = el.dataset.tr;
    if (!text) return;
    // Check local dictionary first
    var localCN = '';
    if (typeof WD !== 'undefined' && WD[text.toLowerCase()]) {
      localCN = WD[text.toLowerCase()];
    } else if (typeof SC !== 'undefined' && SC[text]) {
      localCN = SC[text];
    }
    if (localCN) {
      el.style.pointerEvents = 'none';
      var parent = el.parentElement, tn = document.createElement('div');
      tn.style.cssText = 'font-size:12px;color:#ffd700;margin-top:3px;padding:4px 8px;background:rgba(255,215,0,0.08);border-radius:4px';
      tn.textContent = localCN; parent.appendChild(tn); el.remove();
      return;
    }
    if (!API.hasKey()) { if (!API.promptKey()) { el.textContent = '!'; return; } }
    el.textContent = '...'; el.style.pointerEvents = 'none';
    try {
      var resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+API.getKey()},
        body:JSON.stringify({model:'deepseek-chat', messages:[{role:'user',content:'Translate to Chinese, output only the translation:\n\n'+text}], max_tokens:200, temperature:0.3})
      });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      var data = await resp.json();
      var cn = (data.choices && data.choices[0].message.content) || 'No translation';
      var parent = el.parentElement, tn = document.createElement('div');
      tn.style.cssText = 'font-size:12px;color:#ffd700;margin-top:3px;padding:4px 8px;background:rgba(255,215,0,0.08);border-radius:4px';
      tn.textContent = cn; parent.appendChild(tn); el.remove();
    } catch(e) { el.textContent = '译'; el.style.pointerEvents = 'auto'; }
  };

  var inp = document.getElementById('chat-input'); if (inp) inp.focus();
  var msgs = document.getElementById('chat-msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

async function sendChat() {
  var inp = document.getElementById('chat-input'); if (!inp) return;
  var text = inp.value.trim(); if (!text) return;
  inp.value = ''; inp.disabled = true; document.getElementById('chat-send').disabled = true;
  _chatMsgs.push({role:'user', text:text}); _chatMsgs.push({role:'assistant', text:''}); renderChatUI();

  try {
    if (!API.hasKey()) { API.promptKey(); if (!API.hasKey()) { _chatMsgs.pop(); _chatMsgs.push({role:'assistant', text:'API key not set. Get one at platform.deepseek.com'}); renderChatUI(); inp.disabled = false; document.getElementById('chat-send').disabled = false; return; }}
    var s = CHAT_SCENES[_chatScene];
    var msgs = [{role:'system', content:s.sys+' User is learning English. Keep responses SHORT (1-2 sentences). Be encouraging.'}];
    for (var i = 0; i < _chatMsgs.length - 1; i++) msgs.push({role:_chatMsgs[i].role, content:_chatMsgs[i].text});
    var resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+API.getKey()},
      body:JSON.stringify({model:'deepseek-chat', messages:msgs, max_tokens:120, temperature:0.8, stream:true})
    });
    var reader = resp.body.getReader(), decoder = new TextDecoder(), fullText = '';
    while (true) {
      var chunk = await reader.read(); if (chunk.done) break;
      var lines = decoder.decode(chunk.value, {stream:true}).split('\n');
      for (var j = 0; j < lines.length; j++) {
        if (!lines[j].startsWith('data: ')) continue; var ds = lines[j].substring(6).trim(); if (ds === '[DONE]') continue;
        try { var json = JSON.parse(ds); if (json.choices && json.choices[0].delta && json.choices[0].delta.content) fullText += json.choices[0].delta.content; } catch(e) {}
      }
      _chatMsgs[_chatMsgs.length-1].text = fullText;
      var bubbles = document.querySelectorAll('.ai-bubble'), last = bubbles[bubbles.length-1];
      if (last) last.innerHTML = esc(fullText);
      var msgsEl = document.getElementById('chat-msgs'); if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  } catch(e) { _chatMsgs[_chatMsgs.length-1].text = 'Network error. <a href="#" onclick="window._retryChat()" style="color:#ffd700;text-decoration:underline">Click to retry</a>'; renderChatUI(); }
  inp.disabled = false; document.getElementById('chat-send').disabled = false;

  // 流式结束后 AI 回复已有完整文本，但按钮从未被创建（renderChatUI 时文本为空）
  // 直接往 DOM 里注入缺失的 🔊 译 按钮
  var allAi = document.querySelectorAll('.chat-msg-ai');
  var lastAi = allAi[allAi.length-1];
  if (lastAi && _chatMsgs.length >= 2) {
    var finalText = _chatMsgs[_chatMsgs.length-1].text;
    if (finalText && !lastAi.querySelector('.tts-btn')) {
      var ttsBtn = document.createElement('span');
      ttsBtn.className = 'tts-btn'; ttsBtn.dataset.text = finalText;
      ttsBtn.textContent = '🔊'; ttsBtn.title = 'Read aloud';
      ttsBtn.onclick = function() { speakTTS(this.dataset.text); };
      lastAi.appendChild(document.createTextNode(' '));
      lastAi.appendChild(ttsBtn);

      var trBtn = document.createElement('span');
      trBtn.className = 'tts-btn'; trBtn.dataset.tr = finalText;
      trBtn.textContent = '译'; trBtn.title = 'Translate';
      trBtn.style.fontSize = '12px';
      trBtn.onclick = function() { window._translateMsg(this); };
      lastAi.appendChild(document.createTextNode(' '));
      lastAi.appendChild(trBtn);
    }
  }
}
