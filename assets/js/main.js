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
  if (track) track.innerHTML += track.innerHTML;

  var mark = document.querySelector('.brand .mark');
  if (mark && !reduced) {
    var letters = mark.querySelectorAll('span');
    setInterval(function () {
      letters.forEach(function (l) { l.setAttribute('data-ink', pickIncongruent('', l.getAttribute('data-ink'))); });
    }, 4000);
  }

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
