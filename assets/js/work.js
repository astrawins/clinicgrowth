/* Ταξίδι στις ιστοσελίδες: η σκηνή μένει καρφωμένη και το scroll «οδηγεί».
   Οι επόμενες έρχονται από τον πλανήτη, η τρέχουσα είναι μπροστά, οι περασμένες
   πετούν προς τα έξω και μένουν στον ουρανό ως αστέρια. */
(function () {
  var sec = document.querySelector('.work'); if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll('.work-card'));
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var run = sec.querySelector('.warp-run'), stage = sec.querySelector('.warp-stage'), sky = sec.querySelector('.warp-sky');
  var nameEl = sec.querySelector('.warp-name'), specEl = sec.querySelector('.warp-spec'), countEl = sec.querySelector('.warp-count b');
  var linkEl = sec.querySelector('.warp-link'), ledeEl = sec.querySelector('.warp-lede'), nowEl = sec.querySelector('.warp-now');
  var N = cards.length, STEP = 0.62;                       /* ύψος scroll ανά ιστοσελίδα, σε οθόνες */
  sec.classList.add('warp-on');
  run.style.height = ((N - 1) * STEP + 1.6) * 100 + 'vh';

  /* σταθερό «τυχαίο» για κάθε κάρτα: προς τα πού φεύγει και πού μένει ως αστέρι */
  var rnd = function (k) { var x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  var stars = cards.map(function (c, i) {
    var st = document.createElement('span'); st.className = 'warp-star'; sky.appendChild(st);
    var side = i % 2 ? 1 : -1;
    /* τελική θέση: πλέγμα 6×4 στον πάνω ουρανό με λίγο «τυχαίο», ώστε να μένουν όλα μέσα στην οθόνη */
    var col = i % 6, row = Math.floor(i / 6);
    return { el: st, side: side, gx: 0.05 + (col + 0.15 + rnd(i) * 0.7) / 6 * 0.9, gy: 0.07 + (row + 0.1 + rnd(i + 50) * 0.8) / 4 * 0.5, sz: 0.8 + rnd(i + 99) * 0.7 };
  });
  var data = cards.map(function (c) {
    return { name: c.querySelector('.work-name').textContent, spec: c.querySelector('.work-spec').textContent, href: c.getAttribute('href') };
  });

  var cur = -1, raf = 0, pNow = 0, pGoal = 0;
  var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

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
    pNow += (pGoal - pNow) * 0.16; if (Math.abs(pGoal - pNow) < 0.0005) pNow = pGoal;
    var W = innerWidth, H = innerHeight, mob = W < 768;
    var X0 = mob ? W * 0.5 : W * 0.66, Y0 = mob ? H * 0.6 : H * 0.5;      /* θέση «μπροστά μας» */
    var HX = W * 0.5, HY = H * (mob ? 0.86 : 0.8) - pNow / (N - 1) * H * 0.1;   /* ορίζοντας πλανήτη */
    stage.style.setProperty('--pp', (pNow / (N - 1)).toFixed(4));
    stage.style.setProperty('--prog', (pNow / (N - 1)).toFixed(4));
    ledeEl.style.opacity = Math.max(0, 1 - pNow * 2.5).toFixed(3);
    for (var i = 0; i < N; i++) {
      var c = cards[i], s = stars[i], t = i - pNow, x, y, sc, op, z;
      if (t >= 0) {                                   /* έρχεται από τον πλανήτη */
        var k = Math.min(t, 5) / 5, kk = Math.pow(k, 0.55);
        x = lerp(X0, HX + s.side * W * 0.05 * (1 - k), kk);
        y = lerp(Y0, HY, kk);
        sc = lerp(1, 0.06, kk);
        op = t < 1 ? 1 : Math.max(0, 1 - (t - 1) / 3) * 0.8;   /* όσο πιο μακριά, τόσο πιο αχνή */
        z = 40 - Math.round(t * 6);
        s.el.style.opacity = 0;
      } else {                                        /* περνάει δίπλα μας και γίνεται αστέρι */
        var u = Math.min(-t, 1), e = ease(u);
        var fx = s.gx * W, fy = s.gy * H;
        x = lerp(X0, fx, e); y = lerp(Y0, fy, e);
        sc = lerp(1, 0.02, Math.pow(u, 0.8)) * (1 + Math.sin(u * Math.PI) * 0.35);
        op = 1 - Math.pow(u, 1.6);
        z = 45;
        s.el.style.opacity = Math.min(1, Math.max(0, (u - 0.55) / 0.45)).toFixed(3);
        s.el.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0) scale(' + s.sz.toFixed(2) + ')';
      }
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(4) + ')';
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = z;
    }
    setInfo(Math.max(0, Math.min(N - 1, Math.round(pNow))));
    if (pNow !== pGoal) raf = requestAnimationFrame(frame);
  }
  function onScroll() {
    var r = run.getBoundingClientRect(), total = run.offsetHeight - innerHeight;
    var f = Math.max(0, Math.min(1, -r.top / total));
    pGoal = f * (N - 1);
    if (!raf) raf = requestAnimationFrame(frame);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
