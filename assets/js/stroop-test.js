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
  var STROOP_1935 = 74.3;

  var intro = root.querySelector('.test-intro');
  var play = root.querySelector('.test-play');
  var results = root.querySelector('.test-results');
  var word = root.querySelector('.test-word');
  var choices = root.querySelector('.test-choices');
  var feedback = root.querySelector('.test-feedback');
  var counter = root.querySelector('.test-counter');
  var bar = root.querySelector('.progress i');
  var startBtn = root.querySelector('.test-start');
  var restartBtns = root.querySelectorAll('.test-restart');

  var trials = [];
  var index = 0;
  var shownAt = 0;
  var locked = false;
  var records = [];

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
  }

  function answer(key) {
    if (locked) return;
    locked = true;
    var t = trials[index];
    var rt = performance.now() - shownAt;
    var ok = key === t.ink.key;
    records.push({ congruent: t.congruent, rt: rt, correct: ok });
    feedback.textContent = ok ? '✓ Correcto' : '✗ La tinta era ' + t.ink.label.toLowerCase();
    feedback.style.color = ok ? 'var(--verde)' : 'var(--rojo)';
    index++;
    setTimeout(function () {
      if (index < trials.length) showTrial(); else finish();
    }, ok ? 300 : 700);
  }

  function avg(list) {
    if (!list.length) return 0;
    return list.reduce(function (s, r) { return s + r.rt; }, 0) / list.length;
  }

  function finish() {
    bar.style.width = '100%';
    play.hidden = true;
    results.hidden = false;

    var con = records.filter(function (r) { return r.congruent && r.correct; });
    var inc = records.filter(function (r) { return !r.congruent && r.correct; });
    var errors = records.filter(function (r) { return !r.correct; }).length;
    var avgCon = avg(con);
    var avgInc = avg(inc);
    var diff = avgInc - avgCon;
    var pct = avgCon ? (diff / avgCon * 100) : 0;

    results.querySelector('[data-out="con"]').textContent = Math.round(avgCon) + ' ms';
    results.querySelector('[data-out="inc"]').textContent = Math.round(avgInc) + ' ms';
    results.querySelector('[data-out="diff"]').textContent = (diff >= 0 ? '+' : '') + Math.round(diff) + ' ms';
    results.querySelector('[data-out="pct"]').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + ' %';
    results.querySelector('[data-out="errors"]').textContent = errors + ' de ' + records.length;

    var msg;
    if (!con.length || !inc.length) {
      msg = 'Hubo demasiados errores para comparar los dos tipos de palabra. Intenta de nuevo.';
    } else if (pct > 5) {
      msg = 'Tardaste un ' + pct.toFixed(1) + ' % más cuando la palabra y la tinta no coincidían. Eso es el efecto Stroop: tu cerebro leyó antes de ver. En el experimento de 1935 la diferencia fue de ' + STROOP_1935 + ' %.';
    } else {
      msg = 'Esta vez casi no se notó la interferencia. Suele aparecer con más claridad al repetir la prueba o al responder más rápido.';
    }
    results.querySelector('.test-summary').textContent = msg;
  }

  function start() {
    trials = buildTrials();
    records = [];
    index = 0;
    intro.hidden = true;
    results.hidden = true;
    play.hidden = false;
    renderChoices();
    showTrial();
  }

  startBtn.addEventListener('click', start);
  restartBtns.forEach(function (b) { b.addEventListener('click', start); });

  document.addEventListener('keydown', function (e) {
    if (play.hidden) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= COLORS.length) answer(COLORS[n - 1].key);
  });
})();
