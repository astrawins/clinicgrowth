/* Έργα: υπολογίζει για κάθε πλαίσιο πόσο πρέπει να κυλήσει η εικόνα (ολόκληρη αρχική) και σε πόση ώρα.
   Σε συσκευές χωρίς ποντίκι η κύλιση παίζει μόνη της όσο το πλαίσιο είναι ορατό. */
(function () {
  /* Μόνιμο «Κλείστε κλήση»: ανάβει όταν το κουμπί του hero βγει από την οθόνη */
  var cta = document.querySelector('.cta-float'), heroCta = document.querySelector('.hero-cta');
  if (cta && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { cta.classList.toggle('on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }, { threshold: 0 }).observe(heroCta);
  } else if (cta) { cta.classList.add('on'); }
  /* Κριτικές: ίδια ταχύτητα σε κάθε σειρά, ανεξάρτητα από το μήκος της */
  var revRows = [].slice.call(document.querySelectorAll('.rev-row'));
  var revSpeed = function () { revRows.forEach(function (r) { var set = r.querySelector('.rev-set'); if (set) r.querySelector('.rev-track').style.setProperty('--rev-dur', Math.max(30, set.offsetWidth / 55).toFixed(0) + 's'); }); };
  revSpeed(); addEventListener('resize', revSpeed); addEventListener('load', revSpeed);
  revRows.forEach(function (r) {
    r.addEventListener('touchstart', function () { r.classList.add('paused'); }, { passive: true });
    r.addEventListener('touchend', function () { setTimeout(function () { r.classList.remove('paused'); }, 1200); }, { passive: true });
  });
  var sites = [].slice.call(document.querySelectorAll('.site'));
  if (!sites.length) return;
  /* «Δείτε περισσότερες δουλειές»: ανοίγει τα υπόλοιπα έργα */
  /* Καρουζέλ έργων: βέλη, μετρητής, σύρσιμο με ποντίκι */
  var track = document.querySelector('.car-track');
  if (track) {
    var items = [].slice.call(track.querySelectorAll('.site')), countEl = document.querySelector('.car-count b');
    var btnPrev = document.querySelector('.car-btn[data-car="-1"]'), btnNext = document.querySelector('.car-btn[data-car="1"]');
    var idx = function () { var x = track.scrollLeft + 1, best = 0; items.forEach(function (it, i) { if (it.offsetLeft - items[0].offsetLeft <= x) best = i; }); return best; };
    var update = function () { var i = idx(); if (countEl) countEl.textContent = i + 1; btnPrev.disabled = i === 0; btnNext.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
    var go = function (d) { var i = Math.max(0, Math.min(items.length - 1, idx() + d)); track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' }); };
    btnPrev.addEventListener('click', function () { go(-1); }); btnNext.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', update, { passive: true }); update();
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } });
    /* σύρσιμο με ποντίκι στον υπολογιστή (τα κλικ πάνω σε κάρτα ανοίγουν κανονικά αν δεν έγινε σύρσιμο) */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = track.scrollLeft; track.classList.add('dragging'); });
    addEventListener('mousemove', function (e) { if (!down) return; var dx = e.pageX - sx; if (Math.abs(dx) > 6) moved = true; track.scrollLeft = sl - dx; });
    addEventListener('mouseup', function () { if (!down) return; down = false; track.classList.remove('dragging'); });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  }
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
