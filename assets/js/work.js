/* Έργα: υπολογίζει για κάθε πλαίσιο πόσο πρέπει να κυλήσει η εικόνα (ολόκληρη αρχική) και σε πόση ώρα.
   Σε συσκευές χωρίς ποντίκι η κύλιση παίζει μόνη της όσο το πλαίσιο είναι ορατό. */
(function () {
  var sites = [].slice.call(document.querySelectorAll('.site'));
  if (!sites.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = !matchMedia('(hover: hover)').matches;
  function fit(site) {
    var img = site.querySelector('.screen img'), scr = site.querySelector('.screen');
    if (!img.naturalWidth) return;
    var h = scr.clientWidth * img.naturalHeight / img.naturalWidth, shift = Math.max(0, h - scr.clientHeight);
    site.style.setProperty('--shift', shift.toFixed(0) + 'px');
    site.style.setProperty('--dur', Math.max(2.5, Math.min(14, shift / 420)).toFixed(1) + 's');   /* ~420px/s */
  }
  sites.forEach(function (site) {
    var img = site.querySelector('.screen img');
    if (img.complete) fit(site); else img.addEventListener('load', function () { fit(site); });
  });
  addEventListener('resize', function () { sites.forEach(fit); });
  if (touch && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('auto', e.isIntersecting); }); }, { threshold: 0.35 });
    sites.forEach(function (s) { io.observe(s); });
  }
})();
