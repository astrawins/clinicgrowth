/* Έργα: υπολογίζει για κάθε πλαίσιο πόσο πρέπει να κυλήσει η εικόνα (ολόκληρη αρχική) και σε πόση ώρα.
   Σε συσκευές χωρίς ποντίκι η κύλιση παίζει μόνη της όσο το πλαίσιο είναι ορατό. */
(function () {
  var sites = [].slice.call(document.querySelectorAll('.site'));
  if (!sites.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = !matchMedia('(hover: hover)').matches;
  /* κάθε οθόνη (υπολογιστής / κινητό) έχει δικό της --shift και --dur, ίδια ταχύτητα ~420px/s */
  function fitScreen(scr) {
    var img = scr.querySelector('img'); if (!img.naturalWidth) return;
    var h = scr.clientWidth * img.naturalHeight / img.naturalWidth, shift = Math.max(0, h - scr.clientHeight);
    scr.style.setProperty('--shift', shift.toFixed(0) + 'px');
    scr.style.setProperty('--dur', Math.max(2.5, Math.min(16, shift / 420)).toFixed(1) + 's');
  }
  function fit(site) { [].forEach.call(site.querySelectorAll('.screen'), fitScreen); }
  sites.forEach(function (site) {
    [].forEach.call(site.querySelectorAll('.screen img'), function (img) {
      if (img.complete) fitScreen(img.parentNode); else img.addEventListener('load', function () { fitScreen(img.parentNode); });
    });
  });
  addEventListener('resize', function () { sites.forEach(fit); });
  /* κινητά: κυλάει μόνο όσο κρατάς το δάχτυλο πάνω της (press & hold)· γρήγορο πάτημα = ανοίγει το site */
  if (touch && !reduce) {
    sites.forEach(function (site) {
      var timer = 0, held = false, x0 = 0, y0 = 0;
      var stop = function () { clearTimeout(timer); timer = 0; site.classList.remove('touching'); };
      site.addEventListener('touchstart', function (e) {
        var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; held = false;
        timer = setTimeout(function () { held = true; site.classList.add('touching'); }, 180);
      }, { passive: true });
      site.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        if (Math.abs(t.clientX - x0) > 8 || Math.abs(t.clientY - y0) > 8) stop();   /* ο χρήστης σκρολάρει τη σελίδα */
      }, { passive: true });
      site.addEventListener('touchend', function (e) { stop(); if (held) { e.preventDefault(); } }, { passive: false });
      site.addEventListener('touchcancel', stop, { passive: true });
      site.addEventListener('click', function (e) { if (held) { e.preventDefault(); held = false; } });
      site.addEventListener('contextmenu', function (e) { if (held) e.preventDefault(); });
    });
  }
})();
