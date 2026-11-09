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
  if (touch && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('auto', e.isIntersecting); }); }, { threshold: 0.35 });
    sites.forEach(function (s) { io.observe(s); });
  }
})();
