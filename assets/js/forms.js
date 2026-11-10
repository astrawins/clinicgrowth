/* Φόρμες clinicgrowth: επιλογή αρχείων με προεπισκόπηση, σμίκρυνση φωτογραφιών στον browser, αποστολή στο backend.
   Το backend (data-endpoint) παίρνει JSON: πεδία + αρχεία ως base64 (το καθένα ≤ 1.5MB μετά τη σμίκρυνση). */
(function () {
  var form = document.querySelector('.cgform'); if (!form) return;
  var status = document.getElementById('status');
  var picked = {}; // name → [File]
  var MAXW = 2000, QUALITY = 0.84;

  function human(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; }
  function renderList(name) {
    var ul = form.querySelector('.files[data-for="' + name + '"]'); if (!ul) return;
    ul.innerHTML = (picked[name] || []).map(function (f, i) {
      var img = /^image\//.test(f.type) ? '<img src="' + URL.createObjectURL(f) + '" alt="">' : '';
      return '<li>' + img + '<span>' + f.name.replace(/[<>&]/g, '') + ' · ' + human(f.size) + '</span><button type="button" data-rm="' + name + ':' + i + '" aria-label="Αφαίρεση">×</button></li>';
    }).join('');
  }
  form.querySelectorAll('.drop input[type=file]').forEach(function (inp) {
    var drop = inp.closest('.drop');
    inp.addEventListener('change', function () {
      picked[inp.name] = inp.multiple ? (picked[inp.name] || []).concat([].slice.call(inp.files)) : [].slice.call(inp.files, 0, 1);
      renderList(inp.name); inp.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) {
      var fs = [].slice.call(e.dataTransfer.files);
      picked[inp.name] = inp.multiple ? (picked[inp.name] || []).concat(fs) : fs.slice(0, 1);
      renderList(inp.name);
    });
  });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var p = b.dataset.rm.split(':'); picked[p[0]].splice(+p[1], 1); renderList(p[0]);
  });

  /* σμίκρυνση εικόνας στον browser → JPEG/PNG base64 */
  function shrink(file) {
    return new Promise(function (res) {
      if (!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type) || file.size < 600000) return readB64(file).then(res);
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, MAXW / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var keepPng = file.type === 'image/png' && file.size < 1500000;
        var data = c.toDataURL(keepPng ? 'image/png' : 'image/jpeg', QUALITY);
        URL.revokeObjectURL(url);
        res({ name: file.name.replace(/\.(heic|heif|webp)$/i, '.jpg'), type: keepPng ? 'image/png' : 'image/jpeg', data: data.split(',')[1] });
      };
      img.onerror = function () { readB64(file).then(res); };
      img.src = url;
    });
  }
  function readB64(file) {
    return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res({ name: file.name, type: file.type || 'application/octet-stream', data: String(r.result).split(',')[1] }); }; r.readAsDataURL(file); });
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('.fld').forEach(function (f) { f.classList.remove('invalid'); });
    form.querySelectorAll('[required]').forEach(function (el) {
      var bad = el.type === 'radio' ? !form.querySelector('[name="' + el.name + '"]:checked') : el.type === 'checkbox' ? !el.checked : !el.value.trim();
      if (bad) { ok = false; var f = el.closest('.fld'); if (f) f.classList.add('invalid'); }
    });
    var em = form.querySelector('[name=contactEmail]'); if (em && em.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { ok = false; em.closest('.fld').classList.add('invalid'); }
    return ok;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (form.website.value) return;                 /* honeypot */
    if (!validate()) { status.textContent = 'Συμπληρώστε τα πεδία με αστερίσκο.'; status.classList.add('err'); form.querySelector('.invalid') && form.querySelector('.invalid').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    status.classList.remove('err'); status.textContent = 'Ετοιμάζουμε τα αρχεία…';
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    var fields = {};
    new FormData(form).forEach(function (v, k) { if (typeof v === 'string' && k !== 'website') fields[k] = v; });
    fields._form = form.id; fields._page = location.href; fields._at = new Date().toISOString();
    var files = {};
    for (var name in picked) { files[name] = []; for (var i = 0; i < picked[name].length; i++) { status.textContent = 'Σμίκρυνση ' + (i + 1) + '/' + picked[name].length + '…'; files[name].push(await shrink(picked[name][i])); } }
    status.textContent = 'Αποστολή…';
    try {
      var r = await fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fields, files: files }) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.hidden = true; document.getElementById('thanks').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      btn.disabled = false; status.classList.add('err');
      status.textContent = 'Κάτι πήγε στραβά. Δοκιμάστε ξανά ή στείλτε μας email στο info@astramarketing.gr';
    }
  });
})();
