/* ===== Review & Stats ===== */
function renderReview() {
  S.reviewCount = (S.reviewCount||0) + 1; saveState();
  // 7-day accuracy chart
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var key = d.toDateString(), entry = S.history[key] || {ok:0, ng:0};
    var total = entry.ok + entry.ng, rate = total > 0 ? Math.round(entry.ok / total * 100) : 0;
    days.push({label: d.toLocaleDateString('zh-CN', {month:'short',day:'numeric'}), rate: rate, total: total, ok: entry.ok, ng: entry.ng});
  }

  var chartHTML = '<div style="margin:10px 0"><b style="color:#ffd700">📊 7日正确率趋势</b></div>';
  chartHTML += '<div style="display:flex;align-items:flex-end;gap:8px;height:80px;padding:4px 0;overflow-x:auto">';
  days.forEach(function(d) {
    var h = Math.max(4, d.rate), color = d.rate >= 80 ? '#4cd964' : d.rate >= 50 ? '#ffd700' : '#ff4444';
    chartHTML += '<div style="flex:1;text-align:center;font-size:10px">'+
      '<div style="height:'+h+'px;background:'+color+';border-radius:3px 3px 0 0;margin-bottom:4px;min-width:30px" title="'+d.ok+'✓ '+d.ng+'✗"></div>'+
      '<div style="color:#888;line-height:1.2">'+d.rate+'%</div><div style="color:#666;font-size:9px">'+d.label+'</div></div>';
  });
  chartHTML += '</div>';

  var totalQ = S.ok + S.ng, overallRate = totalQ > 0 ? Math.round(S.ok/totalQ*100) : 0;
  chartHTML += '<div class="stats-panel">'+
    '<b>总答题数:</b> '+totalQ+' | <b>正确率:</b> '+overallRate+'% | <b>等级:</b> Lv.'+S.level+'<br>'+
    '<b>胜场:</b> '+S.wins+' | <b>败场:</b> '+S.losses+' | <b>最大连击:</b> '+S.mxStreak+'<br>'+
    '<b>今日:</b> '+S.todayOK+'✓ '+S.todayNG+'✗</div>';

  var wrongHTML = '<div style="margin:10px 0"><b style="color:#ff6b6b">❌ 错题回顾</b> (共'+S.wrongList.length+'题)</div>';
  var recent = S.wrongList.slice(-15).reverse();
  if (recent.length === 0) {
    wrongHTML += '<div style="color:#888;font-size:13px">还没有错题，继续加油！🎉</div>';
  } else {
    wrongHTML += '<div style="max-height:200px;overflow-y:auto">';
    recent.forEach(function(w) {
      var enText = esc(w.q), cnHint = '';
      if (w.type === 'vocab' || w.type === 'listening') { cnHint = ' → ' + esc(w.a); }
      else { cnHint = ' → ' + esc(w.a); if (SC && SC[w.q]) cnHint += ' (' + SC[w.q] + ')'; }
      wrongHTML += '<div style="padding:4px 8px;margin:2px 0;background:rgba(255,68,68,0.06);border-radius:6px;font-size:12px">'+
        '<span style="color:#aaa">['+w.type+']</span> '+enText+'<br><span style="color:#4cd964">✔ '+cnHint+'</span>';
      var note = getGrammarNote(w.a); if (note) wrongHTML += ' <span style="color:#ffd700;font-size:11px">📝 '+note+'</span>';
      wrongHTML += '</div>';
    });
    wrongHTML += '</div>';
  }

  var html = '<div class="ye">'+AV+'<div><span class="ye-tag">KANYE WEST</span><div class="ye-dlg">"You can\'t look at a glass half full if it\'s overflowing." Track your progress. 📊<br><span style="font-size:11px;color:#aaa;font-style:normal">追踪你的学习进度。</span></div></div></div>'+
    chartHTML + wrongHTML + '<button class="btn gold" onclick="renderMenu()" style="margin-top:10px">Back</button>';
  renderApp(html);
}
