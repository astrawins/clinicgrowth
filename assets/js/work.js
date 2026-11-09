/* Ιστοσελίδες σε τροχιά: Κρόνος στο κέντρο, οι 24 ιστοσελίδες πάνω στον δακτύλιο.
   Η σκηνή μένει καρφωμένη και το scroll γυρίζει τον δακτύλιο· όποια έρχεται μπροστά είναι η «τρέχουσα». */
(function () {
  var sec = document.querySelector('.work'); if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll('.work-card'));
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var run = sec.querySelector('.warp-run'), stage = sec.querySelector('.warp-stage');
  var nameEl = sec.querySelector('.warp-name'), specEl = sec.querySelector('.warp-spec'), countEl = sec.querySelector('.warp-count b');
  var linkEl = sec.querySelector('.warp-link'), ledeEl = sec.querySelector('.warp-lede'), nowEl = sec.querySelector('.warp-now');
  var N = cards.length, STEP = 0.5, TILT = -9 * Math.PI / 180;
  sec.classList.add('warp-on');
  run.style.height = ((N - 1) * STEP + 1.4) * 100 + 'vh';
  var data = cards.map(function (c) {
    return { name: c.querySelector('.work-name').textContent, spec: c.querySelector('.work-spec').textContent, href: c.getAttribute('href') };
  });
  var cur = -1, raf = 0, pNow = 0, pGoal = 0;
  function setInfo(i) {
    if (i === cur) return; cur = i;
    nowEl.classList.add('warp-swap');
    setTimeout(function () {
      nameEl.textContent = data[i].name; specEl.textContent = data[i].spec; linkEl.href = data[i].href;
      countEl.textContent = String(i + 1).padStart(2, '0');
      nowEl.classList.remove('warp-swap');
    }, 180);
    cards.forEach(function (c, k) { c.classList.toggle('now', k === i); });
  }
  function frame() {
    raf = 0;
    pNow += (pGoal - pNow) * 0.14; if (Math.abs(pGoal - pNow) < 0.0005) pNow = pGoal;
    var W = innerWidth, H = innerHeight, mob = W < 768;
    var cx = W * (mob ? 0.5 : 0.58), cy = H * (mob ? 0.64 : 0.6);
    var rx = mob ? W * 0.47 : Math.min(W * 0.38, H * 0.85), ry = rx * (mob ? 0.3 : 0.24);
    var gd = rx * 0.78;
    var cs = Math.cos(TILT), sn = Math.sin(TILT);
    stage.style.setProperty('--cx', cx + 'px'); stage.style.setProperty('--cy', cy + 'px');
    stage.style.setProperty('--rx', rx + 'px'); stage.style.setProperty('--sq', (ry / rx).toFixed(4));
    stage.style.setProperty('--gd', gd + 'px'); stage.style.setProperty('--tilt', (TILT * 180 / Math.PI) + 'deg');
    stage.style.setProperty('--prog', (pNow / (N - 1)).toFixed(4));
    ledeEl.style.opacity = Math.max(0, 1 - pNow * 2.5).toFixed(3);
    for (var i = 0; i < N; i++) {
      var c = cards[i];
      var th = (i - pNow) / N * Math.PI * 2;                 /* 0 = μπροστά, κάτω στον δακτύλιο */
      var lx = Math.sin(th) * rx, ly = Math.cos(th) * ry;    /* θέση στην έλλειψη πριν την κλίση */
      var x = cx + lx * cs - ly * sn, y = cy + lx * sn + ly * cs;
      var depth = Math.cos(th);                               /* 1 μπροστά, -1 πίσω */
      var front = Math.pow(Math.max(0, depth), 22);           /* «φούσκωμα» μόνο της μπροστινής */
      var sc = 0.16 + 0.2 * (depth + 1) / 2 + 0.62 * front;
      var op = depth < 0 ? 0.22 + 0.45 * (depth + 1) : 0.62 + 0.38 * Math.pow(depth, 3);
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-78%) scale(' + sc.toFixed(4) + ')';
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = depth < -0.05 ? 10 + Math.round((depth + 1) * 8) : 40 + Math.round(depth * 20);
      c.style.filter = depth < 0 ? 'brightness(' + (0.55 + 0.45 * (depth + 1)).toFixed(2) + ')' : '';
    }
    setInfo(((Math.round(pNow) % N) + N) % N);
    if (pNow !== pGoal) raf = requestAnimationFrame(frame);
  }
  function onScroll() {
    var r = run.getBoundingClientRect(), total = run.offsetHeight - innerHeight;
    pGoal = Math.max(0, Math.min(1, -r.top / total)) * (N - 1);
    if (!raf) raf = requestAnimationFrame(frame);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
