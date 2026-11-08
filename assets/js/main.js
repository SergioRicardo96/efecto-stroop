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
    var current = function () {
      return root.getAttribute('data-theme') || 'dark';
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

  var navLinks = document.querySelectorAll('.nav a[href^="#"]');
  if (navLinks.length) {
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        if (nav && nav.classList.contains('is-open')) toggle.click();
      });
    });
    var sections = [];
    navLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) sections.push({ el: sec, link: a });
    });
    var setCurrent = function (link) {
      navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
      link.setAttribute('aria-current', 'page');
    };
    var spy = function () {
      var y = window.scrollY + window.innerHeight * 0.35;
      var current = sections[0];
      sections.forEach(function (s) { if (s.el.offsetTop <= y) current = s; });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = sections[sections.length - 1];
      if (current) setCurrent(current.link);
    };
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  document.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    var btns = tabs.querySelectorAll('[role="tab"]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) {
          var on = b === btn;
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          var panel = document.getElementById(b.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      });
    });
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var swappers = document.querySelectorAll('[data-swap]');
  if (swappers.length && !reduced) {
    setInterval(function () {
      if (document.body.classList.contains('challenge-on')) return;
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

  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = document.getElementById(btn.getAttribute('data-open'));
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });
  document.querySelectorAll('dialog.reader').forEach(function (dlg) {
    dlg.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { dlg.close(); });
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  });

  document.querySelectorAll('.video-embed video').forEach(function (video) {
    var box = video.parentNode;
    var overlay = box.querySelector('.play-overlay');
    var sync = function () { box.classList.toggle('is-playing', !video.paused && !video.ended); };
    ['play', 'pause', 'ended'].forEach(function (ev) { video.addEventListener(ev, sync); });
    if (overlay) overlay.addEventListener('click', function () { video.play(); });
    video.addEventListener('click', function () { if (video.paused) video.play(); });
    sync();
  });

  var targets = document.querySelectorAll('.section-head, .card, .tile, .figure, .board, .stat, .test, .placeholder, .poem, .letter, .ref');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el, i) {
      if (el.closest('dialog')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
  }
})();
