/* ===== Sidebar: Album Selection ===== */
function renderSidebar() {
  var al = document.getElementById('album-list');
  if (!al) return;
  al.innerHTML = ALBUMS.map(function(a, i) {
    var isOn = (S.curAlbum === i);
    var coverPath = '专辑封面/' + a.n + '.jpg';
    return '<div class="album-card'+(isOn?' on':'')+'" data-idx="'+i+'">'+
      '<div class="album-cover"><img src="'+coverPath+'" alt="'+a.sn+'" onerror="this.parentElement.textContent=\''+a.sn.charAt(0)+'\';this.parentElement.style.background=\''+a.c+'\'"></div>'+
      '<div class="album-info"><div class="an">'+a.sn+'</div><div class="ay">'+a.y+'</div></div></div>';
  }).join('');
  document.querySelectorAll('.album-card').forEach(function(card) {
    card.onclick = function() { selectAlbum(parseInt(this.dataset.idx)); };
  });
  var np = document.getElementById('now-playing');
  if (np) np.textContent = S.curAlbum >= 0 ? ALBUMS[S.curAlbum].sn : 'Pick an album';
}

function selectAlbum(idx) {
  S.curAlbum = idx;
  var a = ALBUMS[idx];
  document.body.className = 'bg-' + a.bg;
  var appEl = document.getElementById('app');
  if (appEl) { appEl.style.borderColor = a.c + '66'; appEl.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6), 0 0 40px '+a.c+'22'; }
  var side = document.getElementById('sidebar');
  if (side) side.style.borderColor = a.c + '33';
  renderSidebar();
}
