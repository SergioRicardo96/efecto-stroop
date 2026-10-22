(function () {
  var INKS = ['rojo', 'azul', 'verde', 'amarillo', 'morado', 'naranja'];

  function pickIncongruent(word, current) {
    var options = INKS.filter(function (ink) { return ink !== word && ink !== current; });
    return options[Math.floor(Math.random() * options.length)];
  }

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle.click();
    });
  }

  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var current = function () {
      return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
    };
    var label = function () {
      themeBtn.setAttribute('aria-label', current() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    };
    themeBtn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    });
    label();
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var swappers = document.querySelectorAll('[data-swap]');
  if (swappers.length && !reduced) {
    setInterval(function () {
      swappers.forEach(function (el) {
        var word = (el.getAttribute('data-word') || el.textContent).trim().toLowerCase();
        el.setAttribute('data-ink', pickIncongruent(word, el.getAttribute('data-ink')));
      });
    }, 2600);
  }

  var track = document.querySelector('.ticker-track');
  if (track) {
    var base = track.innerHTML;
    var fillTicker = function () {
      track.innerHTML = base;
      var reps = Math.max(1, Math.ceil(window.innerWidth / track.scrollWidth));
      var half = new Array(reps + 1).join(base);
      track.innerHTML = half + half;
    };
    fillTicker();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillTicker, 150);
    });
  }

  var mark = document.querySelector('.brand .mark');
  if (mark && !reduced) {
    var letters = mark.querySelectorAll('span');
    setInterval(function () {
      letters.forEach(function (l) { l.setAttribute('data-ink', pickIncongruent('', l.getAttribute('data-ink'))); });
    }, 4000);
  }

  document.querySelectorAll('.collapsible').forEach(function (box) {
    var body = box.querySelector('.collapsible-body');
    var btn = box.querySelector('.collapsible-btn');
    var sel = box.getAttribute('data-match');
    var match = sel ? document.querySelector(sel) : null;
    var openText = btn.textContent;
    var fit = function () {
      if (box.classList.contains('is-open')) { body.style.maxHeight = body.scrollHeight + 'px'; return; }
      var target = 440;
      if (match && window.innerWidth > 600 && match.offsetHeight) {
        var frame = box.getBoundingClientRect().height - body.getBoundingClientRect().height;
        target = match.getBoundingClientRect().height - frame;
      }
      body.style.maxHeight = Math.max(220, target) + 'px';
    };
    btn.addEventListener('click', function () {
      var open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Mostrar menos' : openText;
      fit();
      if (!open) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    fit();
    window.addEventListener('load', fit);
    window.addEventListener('resize', fit);
  });

  var targets = document.querySelectorAll('.section-head, .card, .tile, .figure, .board, .stat, .test, .placeholder, .poem, .letter, .ref');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
  }
})();
