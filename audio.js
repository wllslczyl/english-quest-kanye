/* ===== Audio: SFX + TTS + Voice Recorder ===== */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
var _muted = localStorage.getItem('eq_muted') === '1';

function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('eq_muted', _muted ? '1' : '0');
  return _muted;
}

function _ensureAudio() {
  if (actx) return;
  try { actx = new AudioCtx(); } catch(e) {}
}

function sfx(type) {
  if (_muted) return;
  try {
    _ensureAudio(); if (!actx) return;
    var o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination); var n = actx.currentTime;
    if (type === 'ok') { o.type = 'triangle'; o.frequency.setValueAtTime(523,n); o.frequency.setValueAtTime(784,n+0.15); g.gain.setValueAtTime(0.12,n); g.gain.exponentialRampToValueAtTime(0.01,n+0.3); o.start(n); o.stop(n+0.3); }
    else if (type === 'ng') { o.type = 'square'; o.frequency.setValueAtTime(180,n); o.frequency.setValueAtTime(140,n+0.12); g.gain.setValueAtTime(0.08,n); g.gain.exponentialRampToValueAtTime(0.01,n+0.25); o.start(n); o.stop(n+0.25); }
    else if (type === 'win') { o.type = 'triangle'; o.frequency.setValueAtTime(523,n); o.frequency.setValueAtTime(784,n+0.15); o.frequency.setValueAtTime(1047,n+0.3); g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.01,n+0.5); o.start(n); o.stop(n+0.5); }
    else if (type === 'lose') { o.type = 'sawtooth'; o.frequency.setValueAtTime(300,n); o.frequency.setValueAtTime(100,n+0.4); g.gain.setValueAtTime(0.12,n); g.gain.exponentialRampToValueAtTime(0.01,n+0.5); o.start(n); o.stop(n+0.5); }
  } catch(e) {}
}

function speakTTS(text) {
  if (_muted) return;
  try { var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.speak(u); } catch(e) {}
}

// Voice Recorder
var _mediaRecorder = null, _audioChunks = [], _isRecording = false;

async function toggleRecord() {
  if (_isRecording) { stopRecording(); return; }
  try {
    var stream = await navigator.mediaDevices.getUserMedia({audio:true});
    _audioChunks = [];
    _mediaRecorder = new MediaRecorder(stream, {mimeType:'audio/webm'});
    _mediaRecorder.ondataavailable = function(e) { if (e.data.size > 0) _audioChunks.push(e.data); };
    _mediaRecorder.onstop = function() {
      var blob = new Blob(_audioChunks, {type:'audio/webm'});
      var pb = document.getElementById('chat-playback');
      if (pb) { pb.src = URL.createObjectURL(blob); pb.style.display = 'inline-block'; }
      stream.getTracks().forEach(function(t) { t.stop(); });
    };
    _mediaRecorder.start(); _isRecording = true;
    var mic = document.getElementById('chat-mic');
    if (mic) { mic.textContent = '🔴'; mic.style.background = 'rgba(255,68,68,0.3)'; mic.style.borderColor = '#ff4444'; }
  } catch(e) {
    var mic = document.getElementById('chat-mic');
    if (mic) { mic.textContent = '🚫'; mic.title = 'Microphone blocked. Check browser site permissions.'; mic.style.background = 'rgba(255,68,68,0.3)'; mic.style.borderColor = '#ff4444'; }
    // Show inline toast
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(255,68,68,0.9);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:200;white-space:nowrap';
    t.textContent = '🎤 Mic blocked — check browser permissions';
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; t.style.transition = 'opacity 0.5s'; setTimeout(function() { t.remove(); }, 500); }, 3000);
  }
}

function stopRecording() {
  if (!_isRecording) return; _isRecording = false;
  try { _mediaRecorder.stop(); } catch(e) {}
  var mic = document.getElementById('chat-mic');
  if (mic) { mic.textContent = '🎤'; mic.style.background = 'rgba(255,215,0,0.1)'; mic.style.borderColor = 'rgba(255,215,0,0.3)'; }
}

// iOS Safari freezes AudioContext until user gesture — resume on first touch/click
(function _resumeOnGesture() {
  function resume() {
    if (actx && actx.state === 'suspended') actx.resume();
    document.removeEventListener('touchend', resume);
    document.removeEventListener('click', resume);
  }
  document.addEventListener('touchend', resume);
  document.addEventListener('click', resume);
})();
