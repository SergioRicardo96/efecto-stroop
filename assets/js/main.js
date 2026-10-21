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
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle.click();
    });
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
})();
