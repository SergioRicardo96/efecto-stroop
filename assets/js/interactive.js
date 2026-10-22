(function () {
  var INKS = ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja'];

  function pickIncongruent(word, current) {
    var options = INKS.filter(function (ink) { return ink !== word && ink !== current; });
    return options[Math.floor(Math.random() * options.length)];
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function avg(list) {
    if (!list.length) return 0;
    return list.reduce(function (s, r) { return s + r.rt; }, 0) / list.length;
  }

  /* 1. Reto rápido en el hero */
  var board = document.querySelector('.stroop-board');
  var chBtn = document.querySelector('.challenge-btn');
  var caption = document.querySelector('.stroop-board-caption');
  if (board && chBtn && caption) {
    var tiles = Array.prototype.slice.call(board.querySelectorAll('span'));
    var active = false, target = null, score = 0, streak = 0, best = 0, timeLeft = 0, clock = null;
    var defaultCaption = caption.innerHTML;

    var reshuffle = function () {
      tiles.forEach(function (t) {
        var w = t.textContent.trim().toLowerCase();
        t.setAttribute('data-ink', pickIncongruent(w, t.getAttribute('data-ink')));
      });
    };
    var newTarget = function () {
      var inks = tiles.map(function (t) { return t.getAttribute('data-ink'); });
      target = inks[Math.floor(Math.random() * inks.length)];
      var labelInk = pickIncongruent(target, null);
      caption.innerHTML = 'Toca una palabra escrita en tinta <strong class="stroop" data-ink="' + labelInk + '">' + target + '</strong>' +
        ' · <span class="ch-score">' + score + ' aciertos</span> · <span class="ch-time">' + timeLeft.toFixed(1) + ' s</span>';
    };
    var end = function () {
      active = false;
      clearInterval(clock);
      document.body.classList.remove('challenge-on');
      caption.innerHTML = 'Se acabó el tiempo: <strong>' + score + ' aciertos</strong>, mejor racha de ' + best + '. ¿Otra vez?';
      chBtn.textContent = 'Repetir el reto';
      chBtn.hidden = false;
    };
    var start = function () {
      active = true; score = 0; streak = 0; best = 0; timeLeft = 10;
      document.body.classList.add('challenge-on');
      chBtn.hidden = true;
      reshuffle();
      newTarget();
      var last = performance.now();
      clearInterval(clock);
      clock = setInterval(function () {
        var now = performance.now();
        timeLeft -= (now - last) / 1000;
        last = now;
        if (timeLeft <= 0) { end(); return; }
        var el = caption.querySelector('.ch-time');
        if (el) el.textContent = timeLeft.toFixed(1) + ' s';
      }, 100);
    };
    tiles.forEach(function (t) {
      t.setAttribute('tabindex', '0');
      var hit = function () {
        if (!active) return;
        if (t.getAttribute('data-ink') === target) {
          score++; streak++; best = Math.max(best, streak);
          t.classList.add('hit');
          setTimeout(function () { t.classList.remove('hit'); }, 250);
          reshuffle();
          newTarget();
        } else {
          streak = 0;
          t.classList.add('miss');
          setTimeout(function () { t.classList.remove('miss'); }, 300);
        }
      };
      t.addEventListener('click', hit);
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(); } });
    });
    chBtn.addEventListener('click', start);
  }

  /* 3. Minijuegos: Simon y Flanker */
  function miniGame(el, cfg) {
    var intro = el.querySelector('.mini-intro');
    var play = el.querySelector('.mini-play');
    var results = el.querySelector('.mini-results');
    var stage = el.querySelector('.mini-stage');
    var choices = el.querySelector('.mini-choices');
    var feedback = el.querySelector('.mini-feedback');
    var counter = el.querySelector('.mini-counter');
    var dlg = el.closest('dialog');
    var trials = [], index = 0, shownAt = 0, locked = false, records = [], nextTimer = null;

    choices.innerHTML = '';
    cfg.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = o.label;
      b.addEventListener('click', function () { answer(o.key); });
      choices.appendChild(b);
    });

    function showTrial() {
      var t = trials[index];
      stage.innerHTML = cfg.render(t);
      counter.textContent = (index + 1) + ' / ' + trials.length;
      feedback.textContent = '';
      locked = false;
      shownAt = performance.now();
    }
    function answer(key) {
      if (locked || play.hidden) return;
      locked = true;
      var t = trials[index];
      var ok = key === t.answer;
      records.push({ rt: performance.now() - shownAt, correct: ok, congruent: t.congruent });
      feedback.textContent = ok ? '✓ Correcto' : '✗ Era ' + cfg.name(t.answer);
      feedback.style.color = ok ? 'var(--verde)' : 'var(--rojo)';
      index++;
      clearTimeout(nextTimer);
      nextTimer = setTimeout(function () { if (index < trials.length) showTrial(); else finish(); }, ok ? 300 : 700);
    }
    function finish() {
      play.hidden = true;
      results.hidden = false;
      var con = records.filter(function (r) { return r.congruent && r.correct; });
      var inc = records.filter(function (r) { return !r.congruent && r.correct; });
      var errors = records.filter(function (r) { return !r.correct; }).length;
      var a = avg(con), b = avg(inc), diff = b - a;
      results.querySelector('[data-out="con"]').textContent = Math.round(a) + ' ms';
      results.querySelector('[data-out="inc"]').textContent = Math.round(b) + ' ms';
      results.querySelector('[data-out="diff"]').textContent = (diff >= 0 ? '+' : '') + Math.round(diff) + ' ms';
      results.querySelector('[data-out="errors"]').textContent = errors + ' de ' + records.length;
      results.querySelector('.mini-summary').textContent = (!con.length || !inc.length)
        ? 'Hubo demasiados errores para comparar. Intenta de nuevo.'
        : (diff > 20 ? cfg.effectText(diff) : 'Esta vez casi no hubo diferencia. Suele notarse más al responder rápido.');
    }
    function start() {
      trials = cfg.build();
      records = []; index = 0;
      intro.hidden = true; results.hidden = true; play.hidden = false;
      showTrial();
    }
    el.querySelectorAll('.mini-start').forEach(function (b) { b.addEventListener('click', start); });
    document.addEventListener('keydown', function (e) {
      if (!dlg || !dlg.open || play.hidden) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); answer('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); answer('right'); }
    });
    if (dlg) dlg.addEventListener('close', function () {
      clearTimeout(nextTimer);
      play.hidden = true; results.hidden = true; intro.hidden = false;
    });
  }

  var dirOptions = [{ key: 'left', label: '&larr; Izquierda' }, { key: 'right', label: 'Derecha &rarr;' }];
  var dirName = function (k) { return k === 'left' ? 'izquierda' : 'derecha'; };

  var simonEl = document.querySelector('[data-mini="simon"]');
  if (simonEl) miniGame(simonEl, {
    options: dirOptions,
    name: dirName,
    build: function () {
      var list = [];
      ['left', 'right'].forEach(function (dir) {
        ['left', 'right'].forEach(function (pos) {
          list.push({ answer: dir, pos: pos, congruent: dir === pos });
          list.push({ answer: dir, pos: pos, congruent: dir === pos });
        });
      });
      return shuffle(list);
    },
    render: function (t) {
      return '<div class="simon-box"><span class="simon-arrow" style="grid-column:' + (t.pos === 'left' ? 1 : 2) + '">' + (t.answer === 'left' ? '&larr;' : '&rarr;') + '</span></div>';
    },
    effectText: function (diff) { return 'Tardaste ' + Math.round(diff) + ' ms más cuando la flecha apareció del lado contrario al que señalaba. La posición interfiere aunque no importe: ese es el efecto Simon.'; }
  });

  var flankerEl = document.querySelector('[data-mini="flanker"]');
  if (flankerEl) miniGame(flankerEl, {
    options: dirOptions,
    name: dirName,
    build: function () {
      var list = [];
      ['left', 'right'].forEach(function (dir) {
        for (var i = 0; i < 2; i++) {
          list.push({ answer: dir, congruent: true });
          list.push({ answer: dir, congruent: false });
        }
      });
      return shuffle(list);
    },
    render: function (t) {
      var c = t.answer === 'left' ? '&larr;' : '&rarr;';
      var f = t.congruent ? c : (t.answer === 'left' ? '&rarr;' : '&larr;');
      return '<div class="flanker">' + f + f + '<b>' + c + '</b>' + f + f + '</div>';
    },
    effectText: function (diff) { return 'Tardaste ' + Math.round(diff) + ' ms más cuando las flechas de los lados apuntaban al contrario. Los distractores cuestan atención: ese es el efecto Flanker.'; }
  });

  /* 4. Quiz */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var QUESTIONS = [
      { q: '¿En qué año publicó John Ridley Stroop su estudio sobre la interferencia?', options: ['1905', '1935', '1965', '1991'], answer: 1, why: 'El artículo "Studies of Interference in Serial Verbal Reactions" se publicó en 1935.' },
      { q: 'Ves la palabra VERDE escrita con tinta roja. En la prueba de Stroop debes decir…', options: ['Verde', 'Rojo', 'Las dos', 'Ninguna'], answer: 1, why: 'La tarea es nombrar el color de la tinta, no leer la palabra.' },
      { q: '¿Por qué tardamos más con las palabras incongruentes?', options: ['Porque son más largas', 'Porque leer es automático y el significado interfiere', 'Porque los colores son difíciles de ver', 'Porque hay menos luz'], answer: 1, why: 'Leer es un proceso automático; el significado de la palabra compite con el color de la tinta.' },
      { q: 'En el experimento de 1935, ¿cuánto más tardaron los participantes con las palabras conflictivas?', options: ['10 %', '35 %', '74.3 %', '150 %'], answer: 2, why: 'Pasaron de 63.3 s con cuadrados de color a 110.3 s con palabras conflictivas: un 74.3 % más.' },
      { q: '¿Qué mide la prueba Flanker?', options: ['La memoria a largo plazo', 'La atención selectiva ante estímulos distractores', 'La velocidad de lectura', 'La percepción del color'], answer: 1, why: 'Hay que responder a la flecha central ignorando las de los lados, que distraen.' }
    ];
    var list = quiz.querySelector('.quiz-list');
    var scoreEl = quiz.querySelector('.quiz-score');
    var resetBtn = quiz.querySelector('.quiz-reset');
    var answered = 0, correct = 0;

    var render = function () {
      answered = 0; correct = 0;
      scoreEl.hidden = true;
      list.innerHTML = '';
      QUESTIONS.forEach(function (item, qi) {
        var wrap = document.createElement('div');
        wrap.className = 'quiz-q card';
        wrap.innerHTML = '<span class="tag">Pregunta ' + (qi + 1) + ' de ' + QUESTIONS.length + '</span><h3>' + item.q + '</h3><div class="quiz-options"></div><p class="quiz-explain muted" hidden></p>';
        var opts = wrap.querySelector('.quiz-options');
        var explain = wrap.querySelector('.quiz-explain');
        item.options.forEach(function (text, oi) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = text;
          b.addEventListener('click', function () {
            if (wrap.classList.contains('is-done')) return;
            wrap.classList.add('is-done');
            var ok = oi === item.answer;
            b.classList.add(ok ? 'is-correct' : 'is-wrong');
            opts.children[item.answer].classList.add('is-correct');
            explain.textContent = (ok ? '✓ Correcto. ' : '✗ No. ') + item.why;
            explain.hidden = false;
            answered++; if (ok) correct++;
            if (answered === QUESTIONS.length) {
              scoreEl.hidden = false;
              scoreEl.querySelector('strong').textContent = correct + ' de ' + QUESTIONS.length;
              scoreEl.querySelector('span').textContent = correct === QUESTIONS.length ? 'Perfecto, no te confundió ni una.' : (correct >= 3 ? 'Bien. Revisa las pestañas de Proyectos para las que fallaste.' : 'Vuelve a leer Proyectos e inténtalo otra vez.');
              scoreEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
          opts.appendChild(b);
        });
        list.appendChild(wrap);
      });
    };
    resetBtn.addEventListener('click', render);
    render();
  }
})();
