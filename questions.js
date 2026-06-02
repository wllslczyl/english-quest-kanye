/* ===== Questions Loader =====
 * Assembles QQ from per-level files.
 * Format: { q:"question", a:"answer", o:["w1","w2","w3","correct"], t:"type", s:"hint(optional)", speak:"text" }
 * Types: vocab, grammar, spelling, sentence, listening
 * Broken questions are auto-removed on load.
 */
(function() {
  var QQ = {
    beginner: typeof _QB !== 'undefined' ? _QB : [],
    intermediate: typeof _QI !== 'undefined' ? _QI : [],
    advanced: typeof _QA !== 'undefined' ? _QA : [],
    expert: typeof _QE !== 'undefined' ? _QE : []
  };

  // Validate and remove broken questions
  var types = {vocab:1, grammar:1, spelling:1, sentence:1, listening:1};
  var total = 0, bad = 0;
  for (var level in QQ) {
    var arr = QQ[level];
    if (!Array.isArray(arr)) { console.warn('QQ.'+level+' is not an array, skipping'); continue; }
    for (var i = arr.length-1; i >= 0; i--) {
      var q = arr[i];
      if (!q || !q.q || !q.a || !q.t || !types[q.t]) {
        console.warn('Removed bad question at '+level+'['+i+']: '+(q?JSON.stringify({q:q.q,t:q.t,a:q.a}).substring(0,80):'null'));
        arr.splice(i, 1);
        bad++;
      }
    }
    total += arr.length;
    if (arr.length === 0) console.warn('QQ.'+level+' is EMPTY after validation!');
  }
  console.log('Questions loaded: '+total+' valid, '+bad+' removed');

  // Export to global
  window.QQ = QQ;
})();
