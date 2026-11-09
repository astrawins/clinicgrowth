/* Αστερισμός έργων: κάθε κινητό κινείται με το scroll ανάλογα με το «βάθος» του (data-depth) */
(function () {
  var cards = [].slice.call(document.querySelectorAll('.work-card[data-depth]'));
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var field = document.querySelector('.work-field');
  var raf = 0;
  function tick() {
    raf = 0;
    if (matchMedia('(max-width: 767px)').matches) { cards.forEach(function (c) { c.style.setProperty('--py', '0px'); }); return; }
    var vh = innerHeight, r = field.getBoundingClientRect();
    if (r.bottom < -vh || r.top > 2 * vh) return;
    cards.forEach(function (c) {
      var b = c.getBoundingClientRect(), mid = b.top + b.height / 2 - parseFloat(c.style.getPropertyValue('--py') || 0);
      var off = (mid - vh / 2) * -parseFloat(c.dataset.depth);
      c.style.setProperty('--py', off.toFixed(1) + 'px');
    });
  }
  function req() { if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  req();
})();
