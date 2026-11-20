/* clinicgrowth — Παλμός
   Το φόντο του site: αντί για αστέρια, γραμμές καρδιογραφήματος που «γράφονται» σαν σε οθόνη ιατρείου,
   πάνω σε αχνό πλέγμα. Η κύρια γραμμή ανεβαίνει ελαφρά προς τα δεξιά (growth).
   Διακοσμητικό μόνο (aria-hidden)· με «μειωμένη κίνηση» ζωγραφίζεται μία φορά, ακίνητο. */
(function () {
  var cv = document.createElement('canvas');
  cv.id = 'pulse';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 767px)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  var W = 0, H = 0, grid = null, traces = [], raf = 0, last = 0;
  var COL = '127,224,226';

  function g(u, c, w, a) { var d = (u - c) / w; return a * Math.exp(-d * d); }
  /* ένας χτύπος: P, QRS, T — u στο [0,1) */
  function beat(u) {
    return g(u, 0.16, 0.035, 0.11) - g(u, 0.275, 0.011, 0.14) + g(u, 0.3, 0.013, 1) - g(u, 0.327, 0.013, 0.27) + g(u, 0.5, 0.06, 0.2);
  }

  function makeGrid() {
    grid = document.createElement('canvas');
    grid.width = cv.width; grid.height = cv.height;
    var gx = grid.getContext('2d');
    gx.scale(DPR, DPR);
    var step = mobile ? 30 : 38;
    gx.fillStyle = 'rgba(' + COL + ',0.07)';
    for (var y = step / 2; y < H; y += step)
      for (var x = step / 2; x < W; x += step) gx.fillRect(x, y, 1.2, 1.2);
    gx.fillStyle = 'rgba(' + COL + ',0.13)';
    for (y = step / 2; y < H; y += step * 5)
      for (x = step / 2; x < W; x += step * 5) gx.fillRect(x - 0.4, y - 0.4, 2, 2);
  }

  function seed() {
    traces = [];
    var rows = mobile
      ? [[0.2, 0.5, 46, 150, 0.2], [0.62, 1, 64, 190, 0.34], [0.9, 0.45, 40, 140, 0.16]]
      : [[0.16, 0.45, 52, 210, 0.2], [0.44, 0.6, 60, 250, 0.26], [0.7, 1, 92, 300, 0.46], [0.92, 0.45, 48, 200, 0.18]];
    rows.forEach(function (r, i) {
      traces.push({
        y: r[0], amp: r[2] * r[1], period: r[3], alpha: r[4],
        rise: i === (mobile ? 1 : 2) ? 0.09 : 0,            /* η κύρια γραμμή ανεβαίνει προς τα δεξιά */
        head: Math.random() * W, speed: (mobile ? 110 : 170) * (0.8 + Math.random() * 0.5),
        phase: Math.random() * 1000, tail: W * (0.55 + Math.random() * 0.25)
      });
    });
  }

  function yAt(t, x) {
    var u = ((x + t.phase) / t.period) % 1;
    return H * t.y - (x - W / 2) * t.rise - beat(u) * t.amp;
  }

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    makeGrid(); seed();
  }

  function stroke(t, x0, x1, a) {
    if (x1 <= x0) return;
    ctx.strokeStyle = 'rgba(' + COL + ',' + a.toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(x0, yAt(t, x0));
    for (var x = x0 + 2; x <= x1; x += 2) ctx.lineTo(x, yAt(t, x));
    ctx.stroke();
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(grid, 0, 0, W, H);
    ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    traces.forEach(function (t) {
      if (still) { stroke(t, 0, W, t.alpha * 0.7); return; }
      t.head += t.speed * dt;
      if (t.head - t.tail > W) { t.head = -20; t.phase = Math.random() * 1000; }
      /* ουρά που σβήνει πίσω από την κεφαλή, σε 14 κομμάτια */
      var N = 14, seg = t.tail / N;
      for (var i = 0; i < N; i++) {
        var x1 = t.head - i * seg, x0 = x1 - seg - 2;
        if (x1 < 0 || x0 > W) continue;
        stroke(t, Math.max(0, x0), Math.min(W, x1), t.alpha * Math.pow(1 - i / N, 1.6));
      }
      if (t.head >= 0 && t.head <= W) {
        var hy = yAt(t, t.head);
        var glow = ctx.createRadialGradient(t.head, hy, 0, t.head, hy, 14);
        glow.addColorStop(0, 'rgba(' + COL + ',' + Math.min(1, t.alpha * 2.4).toFixed(3) + ')');
        glow.addColorStop(1, 'rgba(' + COL + ',0)');
        ctx.fillStyle = glow; ctx.fillRect(t.head - 14, hy - 14, 28, 28);
        ctx.fillStyle = 'rgba(236,252,252,' + Math.min(1, t.alpha * 2.6).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(t.head, hy, 1.8, 0, 6.283); ctx.fill();
      }
    });
  }

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    draw(dt);
    raf = requestAnimationFrame(tick);
  }
  function play() { if (still || raf) return; last = performance.now(); raf = requestAnimationFrame(tick); }
  function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  size();
  if (still) draw(0); else play();
  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { if (window.innerWidth !== W || !mobile) { size(); if (still) draw(0); } }, 180);
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else play(); });
})();
