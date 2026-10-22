(function () {
  var root = document.getElementById('stroop-test');
  if (!root) return;

  var COLORS = [
    { key: 'rojo', label: 'Rojo' },
    { key: 'azul', label: 'Azul' },
    { key: 'verde', label: 'Verde' },
    { key: 'amarillo', label: 'Amarillo' }
  ];
  var TRIALS_PER_TYPE = 12;
  var TRIAL_LIMIT = 3000;
  var STROOP_1935 = 74.3;
  var HISTORY_KEY = 'stroop-history';

  var intro = root.querySelector('.test-intro');
  var play = root.querySelector('.test-play');
  var results = root.querySelector('.test-results');
  var word = root.querySelector('.test-word');
  var choices = root.querySelector('.test-choices');
  var feedback = root.querySelector('.test-feedback');
  var counter = root.querySelector('.test-counter');
  var bar = root.querySelector('.progress i');
  var timer = root.querySelector('.test-timer strong');
  var trialBar = root.querySelector('.trial-bar');
  var trialFill = root.querySelector('.trial-bar i');
  var startBtn = root.querySelector('.test-start');
  var resetBtn = root.querySelector('.test-reset');
  var restartBtns = root.querySelectorAll('.test-restart');
  var voiceWrap = root.querySelector('.test-voice');
  var voiceCheck = root.querySelector('#voice-mode');
  var voiceStatus = root.querySelector('.voice-status');
  var historyBox = root.querySelector('.test-history');
  var shareBtn = root.querySelector('.test-share');
  var clearBtn = root.querySelector('.test-clear-history');

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR && voiceWrap) voiceWrap.hidden = true;

  var trials = [];
  var index = 0;
  var shownAt = 0;
  var locked = false;
  var records = [];
  var startedAt = 0;
  var ticker = null;
  var trialTicker = null;
  var nextTimer = null;
  var rec = null;
  var voiceOn = false;
  var handledUpTo = 0;
  var lastResult = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildTrials() {
    var list = [];
    for (var i = 0; i < TRIALS_PER_TYPE; i++) {
      var c = COLORS[i % COLORS.length];
      list.push({ word: c, ink: c, congruent: true });
      var others = COLORS.filter(function (x) { return x.key !== c.key; });
      list.push({ word: c, ink: others[Math.floor(Math.random() * others.length)], congruent: false });
    }
    return shuffle(list);
  }

  function formatTime(ms) {
    var s = ms / 1000;
    var m = Math.floor(s / 60);
    var rest = s - m * 60;
    return m + ':' + (rest < 10 ? '0' : '') + rest.toFixed(1);
  }

  function startClock() {
    startedAt = performance.now();
    timer.textContent = '0:00.0';
    clearInterval(ticker);
    ticker = setInterval(function () { timer.textContent = formatTime(performance.now() - startedAt); }, 100);
  }

  function stopClock() {
    clearInterval(ticker);
    var total = performance.now() - startedAt;
    timer.textContent = formatTime(total);
    return total;
  }

  function stopTrialClock() {
    clearInterval(trialTicker);
    trialTicker = null;
  }

  function startTrialClock() {
    stopTrialClock();
    trialBar.classList.remove('is-warning');
    trialFill.style.transform = 'scaleX(1)';
    trialTicker = setInterval(function () {
      var elapsed = performance.now() - shownAt;
      var left = Math.max(0, 1 - elapsed / TRIAL_LIMIT);
      trialFill.style.transform = 'scaleX(' + left + ')';
      if (left < .34) trialBar.classList.add('is-warning');
      if (elapsed >= TRIAL_LIMIT) timeout();
    }, 50);
  }

  /* Modo voz */
  function detectColor(text) {
    var t = text.toLowerCase();
    if (/roj/.test(t)) return 'rojo';
    if (/azul/.test(t)) return 'azul';
    if (/verd/.test(t)) return 'verde';
    if (/amarill/.test(t)) return 'amarillo';
    return null;
  }

  function startVoice() {
    if (!SR) return;
    stopVoice();
    voiceOn = true;
    handledUpTo = 0;
    rec = new SR();
    rec.lang = 'es-MX';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (i < handledUpTo) continue;
        var key = detectColor(e.results[i][0].transcript);
        if (key) { handledUpTo = i + 1; answer(key); break; }
      }
    };
    rec.onend = function () {
      if (voiceOn && !play.hidden) { handledUpTo = 0; try { rec.start(); } catch (err) {} }
    };
    rec.onerror = function (ev) {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        voiceStatus.textContent = 'No hay permiso para usar el micrófono. Responde con los botones.';
        voiceOn = false;
      }
    };
    try {
      rec.start();
      voiceStatus.hidden = false;
      voiceStatus.textContent = '🎤 Escuchando: di el color de la tinta en voz alta.';
    } catch (err) {
      voiceStatus.hidden = false;
      voiceStatus.textContent = 'No se pudo iniciar el micrófono. Responde con los botones.';
    }
  }

  function stopVoice() {
    voiceOn = false;
    if (rec) { rec.onend = null; try { rec.stop(); } catch (e) {} rec = null; }
    if (voiceStatus) voiceStatus.hidden = true;
  }

  function clearAll() {
    clearInterval(ticker);
    stopTrialClock();
    clearTimeout(nextTimer);
    stopVoice();
  }

  function renderChoices() {
    choices.innerHTML = '';
    COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-answer', c.key);
      b.innerHTML = '<span class="swatch bg-' + c.key + '"></span><span>' + c.label + '</span><kbd>' + (i + 1) + '</kbd>';
      b.addEventListener('click', function () { answer(c.key); });
      choices.appendChild(b);
    });
  }

  function showTrial() {
    var t = trials[index];
    word.textContent = t.word.label;
    word.setAttribute('data-ink', t.ink.key);
    counter.textContent = (index + 1) + ' / ' + trials.length;
    bar.style.width = (index / trials.length * 100) + '%';
    feedback.textContent = '';
    locked = false;
    shownAt = performance.now();
    startTrialClock();
  }

  function advance(delay) {
    index++;
    clearTimeout(nextTimer);
    nextTimer = setTimeout(function () {
      if (index < trials.length) showTrial(); else finish();
    }, delay);
  }

  function answer(key) {
    if (locked || play.hidden) return;
    locked = true;
    stopTrialClock();
    var t = trials[index];
    var rt = performance.now() - shownAt;
    var ok = key === t.ink.key;
    records.push({ congruent: t.congruent, rt: rt, correct: ok, timeout: false });
    feedback.textContent = ok ? '✓ Correcto' : '✗ La tinta era ' + t.ink.label.toLowerCase();
    feedback.style.color = ok ? 'var(--verde)' : 'var(--rojo)';
    advance(ok ? 300 : 700);
  }

  function timeout() {
    if (locked) return;
    locked = true;
    stopTrialClock();
    var t = trials[index];
    records.push({ congruent: t.congruent, rt: TRIAL_LIMIT, correct: false, timeout: true });
    feedback.textContent = '⏱ Se acabó el tiempo. La tinta era ' + t.ink.label.toLowerCase();
    feedback.style.color = 'var(--rojo)';
    advance(900);
  }

  function avg(list) {
    if (!list.length) return 0;
    return list.reduce(function (s, r) { return s + r.rt; }, 0) / list.length;
  }

  /* Historial */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function renderHistory(list) {
    if (!historyBox) return;
    var bars = historyBox.querySelector('.history-bars');
    var note = historyBox.querySelector('.history-note');
    if (!list.length) { historyBox.hidden = true; return; }
    historyBox.hidden = false;
    var max = Math.max(10, Math.max.apply(null, list.map(function (h) { return Math.abs(h.pct); })));
    bars.innerHTML = '';
    list.forEach(function (h, i) {
      var item = document.createElement('div');
      item.className = 'history-bar' + (i === list.length - 1 ? ' is-last' : '');
      var hgt = Math.max(6, Math.abs(h.pct) / max * 100);
      item.innerHTML = '<span class="history-val">' + (h.pct >= 0 ? '+' : '') + h.pct.toFixed(0) + ' %</span><i style="height:' + hgt + '%"></i><span class="history-lbl">' + (i + 1) + '</span>';
      bars.appendChild(item);
    });
    var bestIdx = 0;
    list.forEach(function (h, i) { if (h.pct < list[bestIdx].pct) bestIdx = i; });
    note.textContent = list.length === 1
      ? 'Primer intento guardado en este navegador. Repite la prueba para comparar.'
      : 'Intentos guardados: ' + list.length + '. Tu menor interferencia fue en el intento ' + (bestIdx + 1) + ' (' + (list[bestIdx].pct >= 0 ? '+' : '') + list[bestIdx].pct.toFixed(1) + ' %).';
  }

  function finish() {
    var total = stopClock();
    stopVoice();
    bar.style.width = '100%';
    play.hidden = true;
    results.hidden = false;
    results.querySelector('[data-out="total"]').textContent = total < 60000 ? (total / 1000).toFixed(1) + ' s' : formatTime(total) + ' min';

    var con = records.filter(function (r) { return r.congruent && r.correct; });
    var inc = records.filter(function (r) { return !r.congruent && r.correct; });
    var errors = records.filter(function (r) { return !r.correct && !r.timeout; }).length;
    var timeouts = records.filter(function (r) { return r.timeout; }).length;
    var avgCon = avg(con);
    var avgInc = avg(inc);
    var diff = avgInc - avgCon;
    var pct = avgCon ? (diff / avgCon * 100) : 0;

    results.querySelector('[data-out="con"]').textContent = Math.round(avgCon) + ' ms';
    results.querySelector('[data-out="inc"]').textContent = Math.round(avgInc) + ' ms';
    results.querySelector('[data-out="diff"]').textContent = (diff >= 0 ? '+' : '') + Math.round(diff) + ' ms';
    results.querySelector('[data-out="pct"]').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + ' %';
    results.querySelector('[data-out="errors"]').textContent = errors + ' de ' + records.length;
    results.querySelector('[data-out="timeouts"]').textContent = timeouts + ' de ' + records.length;

    var msg;
    if (!con.length || !inc.length) {
      msg = 'Hubo demasiados errores o palabras sin responder para comparar los dos tipos. Intenta de nuevo.';
    } else if (pct > 5) {
      msg = 'Tardaste un ' + pct.toFixed(1) + ' % más cuando la palabra y la tinta no coincidían. Eso es el efecto Stroop: tu cerebro leyó antes de ver. En el experimento de 1935 la diferencia fue de ' + STROOP_1935 + ' %.';
    } else {
      msg = 'Esta vez casi no se notó la interferencia. Suele aparecer con más claridad al repetir la prueba o al responder más rápido.';
    }
    results.querySelector('.test-summary').textContent = msg;

    lastResult = { pct: pct, total: total, errors: errors + timeouts };
    if (con.length && inc.length) {
      var hist = loadHistory();
      hist.push({ t: Date.now(), pct: Math.round(pct * 10) / 10, total: Math.round(total / 100) / 10, errors: errors + timeouts });
      if (hist.length > 10) hist = hist.slice(-10);
      saveHistory(hist);
      renderHistory(hist);
    } else {
      renderHistory(loadHistory());
    }
  }

  function start() {
    clearAll();
    trials = buildTrials();
    records = [];
    index = 0;
    intro.hidden = true;
    results.hidden = true;
    play.hidden = false;
    renderChoices();
    startClock();
    if (voiceCheck && voiceCheck.checked && SR) startVoice();
    showTrial();
  }

  function shareText() {
    if (!lastResult) return '';
    var url = location.href.split('#')[0] + '#prueba';
    return 'Hice la prueba del efecto Stroop en "No leas, ¡observa!": ' + (lastResult.pct >= 0 ? '+' : '') + lastResult.pct.toFixed(1) +
      ' % de interferencia, ' + (lastResult.total / 1000).toFixed(1) + ' s en total y ' + lastResult.errors + ' fallos. ¿Puedes hacerlo mejor? ' + url;
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var text = shareText();
      if (!text) return;
      var done = function (label) {
        var old = shareBtn.textContent;
        shareBtn.textContent = label;
        setTimeout(function () { shareBtn.textContent = old; }, 2000);
      };
      if (navigator.share) {
        navigator.share({ text: text }).then(function () { done('Compartido'); }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { done('Copiado al portapapeles'); });
      } else {
        window.prompt('Copia tu resultado:', text);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      saveHistory([]);
      renderHistory([]);
    });
  }

  startBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', start);
  restartBtns.forEach(function (b) { b.addEventListener('click', start); });

  document.addEventListener('keydown', function (e) {
    if (play.hidden) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= COLORS.length) answer(COLORS[n - 1].key);
  });
})();
