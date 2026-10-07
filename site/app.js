/* Acelere Screen — comportamento da landing: idioma, sistema operacional, formulário e download. */
(function () {
  var CFG = window.ACELERE_SCREEN || { downloads: {} }, I18N = window.ACELERE_I18N || { js: { pt: {} } };
  var $ = function (id) { return document.getElementById(id); };
  var NAMES = { mac: 'macOS', win: 'Windows' };
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';

  // ---- Idioma: acompanha o navegador (português, espanhol ou, para qualquer outro, inglês). ?lang=en força um deles. ----
  var forced = (location.search.match(/[?&]lang=(pt|en|es)(&|$)/) || [])[1];
  var code = (forced || navigator.language || 'pt').toLowerCase();
  var lang = code.indexOf('pt') === 0 ? 'pt' : code.indexOf('es') === 0 ? 'es' : 'en';
  var JS = I18N.js[lang] || I18N.js.pt;
  function T(key) {
    var args = arguments, out = JS[key] != null ? JS[key] : (I18N.js.pt[key] || key);
    return out.replace(/\{(\d)\}/g, function (m, i) { return args[+i + 1] != null ? args[+i + 1] : ''; });
  }
  if (lang !== 'pt') {
    var D = I18N[lang] || {};
    document.documentElement.lang = lang;
    if (D.title) document.title = D.title;
    var md = document.querySelector('meta[name=description]');
    if (md && D.desc) md.setAttribute('content', D.desc);
    document.querySelectorAll('[data-t]').forEach(function (el) { var v = D[el.getAttribute('data-t')]; if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-tp]').forEach(function (el) { var v = D[el.getAttribute('data-tp')]; if (v != null) el.setAttribute('placeholder', v); });
    document.querySelectorAll('[data-ta]').forEach(function (el) { var v = D[el.getAttribute('data-ta')]; if (v != null) el.setAttribute('aria-label', v); });
  }

  // Quem pediu menos movimento ao sistema não recebe o vídeo tocando sozinho.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { var dv = $('demo'); dv.removeAttribute('autoplay'); dv.pause(); }

  // ---- Sistema operacional ----
  function detectOS() {
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '').toLowerCase();
    var ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|android/.test(ua) || (p === 'macintel' && navigator.maxTouchPoints > 1)) return 'mobile';
    if (p.indexOf('win') === 0 || ua.indexOf('windows') > -1) return 'win';
    if (p.indexOf('mac') === 0 || ua.indexOf('mac os') > -1) return 'mac';
    return 'other';
  }
  var os = detectOS(), known = os === 'mac' || os === 'win';

  // ---- Processador do Mac: chip Apple (M1 em diante) ou Intel ----
  // O navegador não informa isso diretamente. O Chrome e o Edge respondem pela API de "client hints";
  // no Safari e no Firefox a pista é a placa de vídeo. Sem certeza, a página mostra as duas versões.
  var chip = null; // 'arm' | 'intel' | null (não deu para saber)
  function chipFromGPU() {
    try {
      var gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return null;
      var info = gl.getExtension('WEBGL_debug_renderer_info');
      var r = (info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || '';
      if (/intel|amd|radeon|nvidia|geforce/i.test(r)) return 'intel';
      if (/apple m\d/i.test(r)) return 'arm';
      // O Safari esconde o nome ("Apple GPU") nos dois casos; só os Macs Intel têm esta compressão de textura.
      if (/apple/i.test(r)) return gl.getSupportedExtensions().indexOf('WEBGL_compressed_texture_s3tc_srgb') === -1 ? 'arm' : 'intel';
    } catch (e) {}
    return null;
  }
  var chipReady = os !== 'mac' ? Promise.resolve() : new Promise(function (done) {
    var finish = function (v) { chip = v || chipFromGPU(); done(); };
    var uad = navigator.userAgentData;
    if (!uad || !uad.getHighEntropyValues) return finish(null);
    uad.getHighEntropyValues(['architecture']).then(function (v) {
      finish(v.architecture === 'arm' ? 'arm' : v.architecture === 'x86' ? 'intel' : null);
    }, function () { finish(null); });
    setTimeout(function () { finish(null); }, 1500);
  });

  document.querySelectorAll('[data-os]').forEach(function (el) { if (el.dataset.os === os) el.classList.add('you'); });
  document.querySelectorAll('[data-os-label]').forEach(function (el) {
    var inForm = !!el.closest('form');
    el.textContent = known ? T(inForm ? 'unlockFor' : 'dlFor', NAMES[os]) : T(inForm ? 'unlock' : 'tryFree');
  });
  $('osLead').textContent = known ? T('leadKnown', NAMES[os]) : os === 'mobile' ? T('leadMobile') : T('leadOther');
  $('ver').textContent = CFG.version ? 'v' + CFG.version : '';

  // ---- Código de indicação (link ?ref=CODIGO) ----
  // Fica guardado neste navegador para continuar aparecendo depois do download.
  var ref = (location.search.match(/[?&]ref=([A-Za-z0-9]{6,12})(&|$)/) || [])[1];
  try { if (ref) localStorage.setItem('acelere-screen-ref', ref.toUpperCase()); ref = localStorage.getItem('acelere-screen-ref'); } catch (_) { ref = ref && ref.toUpperCase(); }
  if (ref) { $('refCode').textContent = ref; $('refBox').hidden = false; }

  // ---- Telefone ----
  // No Brasil o campo segue o formato brasileiro (DDD + número); fora dele aceita número internacional.
  // Só o português do Brasil (ou sem região) usa o formato com DDD; pt-PT e os demais idiomas digitam o número internacional.
  var BR = /^pt(-br)?$/.test(code);
  var digits = function (v) { v = (v || '').replace(/\D/g, ''); return BR ? v.replace(/^55(?=\d{10,11}$)/, '') : v; };
  function mask(v) {
    if (!BR) return (v || '').replace(/[^\d+()\-\s]/g, '').slice(0, 22);
    var d = digits(v).slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  var intl = function (v) { var d = digits(v); return d.length >= 8 && d.length <= 15; };
  var validPhone = function (v) { if (!BR) return intl(v); var d = digits(v); return (d.length === 10 || d.length === 11) && +d.slice(0, 2) >= 11; };
  var validCell = function (v) { if (!BR) return intl(v); var d = digits(v); return d.length === 11 && d[2] === '9' && +d.slice(0, 2) >= 11; };
  // Português de fora do Brasil: a página segue em português, mas o exemplo e os avisos do telefone são os internacionais.
  var PT_INTL = lang === 'pt' && !BR, INTL_MSG = 'Digite o telefone com o código do país.';
  if (PT_INTL) ['fTel', 'fWpp'].forEach(function (id) { $(id).setAttribute('placeholder', '+351 912 345 678'); });
  ['fTel', 'fWpp'].forEach(function (id) {
    $(id).addEventListener('input', function (e) { e.target.value = mask(e.target.value); });
  });
  $('fSame').addEventListener('change', function (e) { $('wField').hidden = e.target.checked; });

  // ---- Envio do lead para o CRM (mesma tabela "leads" da Acelere Tech) ----
  function saveLead(data) {
    var s = CFG.supabase;
    if (!s || !s.url || !s.key) return Promise.resolve(false);
    var utm = location.search.replace(/^\?/, '');
    return fetch(s.url + '/rest/v1/leads', {
      method: 'POST',
      headers: { apikey: s.key, Authorization: 'Bearer ' + s.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        source: 'acelere-screen', status: 'novo', finalizado: true,
        nome: data.nome, whatsapp: data.whatsapp, email: '',
        mensagem: 'Download do Acelere Screen (' + (NAMES[os] || os) + (chip ? ', ' + (chip === 'arm' ? 'chip Apple' : 'Intel') : '') + ', idioma ' + lang + ') · Telefone: ' + data.telefone + (utm ? ' · ' + utm : ''),
        orcamento: { tipo: 'Acelere Screen', origem: 'Landing de download', sistema: os, idioma: lang, telefone: data.telefone }
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; });
  }

  // ---- Download ----
  var dlName = function (k) { return k === 'mac' ? T('macArm') : k === 'macIntel' ? T('macIntel') : 'Windows'; };
  var GAP = '<div style="height:10px"></div>';
  function dlButton(k, primary) {
    var d = CFG.downloads[k];
    return '<a class="' + (primary ? 'btn' : 'other') + '" href="' + d.url + '" download="' + d.file + '">' +
      (primary ? ICON + T('dlPrimary', dlName(k), d.size) : T('dlOther', dlName(k))) + '</a>';
  }
  function showDownload(auto) {
    $('leadForm').hidden = true;
    $('done').hidden = false;
    var mine = chip === 'intel' ? 'macIntel' : 'mac', notMine = chip === 'intel' ? 'mac' : 'macIntel';
    // No Mac sem certeza do processador, as duas versões aparecem lado a lado e nada baixa sozinho.
    var sure = os === 'win' || (os === 'mac' && !!chip);
    $('dlButtons').innerHTML = os === 'win' ? dlButton('win', true) + dlButton('mac', false) + dlButton('macIntel', false)
      : os === 'mac' && chip ? dlButton(mine, true) + dlButton(notMine, false) + dlButton('win', false)
      : os === 'mac' ? dlButton('mac', true) + GAP + dlButton('macIntel', true) + dlButton('win', false)
      : dlButton('mac', true) + GAP + dlButton('macIntel', true) + GAP + dlButton('win', true);
    $('doneHint').textContent = os === 'mobile' ? T('hintMobile')
      : os === 'mac' && chip ? T(chip === 'arm' ? 'hintArm' : 'hintIntel') + (auto ? T('hintAuto') : '') + T('howChip')
      : os === 'mac' ? T('hintUnknown') + T('howChip')
      : known && auto ? T('hintStart', NAMES[os]) : T('hintChoose');
    $('helpMac').hidden = os === 'win'; $('helpWin').hidden = os === 'mac';
    if (known) $(os === 'mac' ? 'helpMac' : 'helpWin').open = true;
    $('doneTitle').focus({ preventScroll: true });
    if (sure && auto) setTimeout(function () { $('dlButtons').querySelector('a').click(); }, 900);
  }

  function setErr(input, errId, msg) {
    $(errId).textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  $('leadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = $('fNome').value.trim(), tel = $('fTel').value, same = $('fSame').checked, wpp = same ? tel : $('fWpp').value;
    var ok = [
      setErr($('fNome'), 'eNome', nome.length < 2 ? T('errNome') : ''),
      setErr($('fTel'), 'eTel', !validPhone(tel) ? (PT_INTL ? INTL_MSG : T('errTel')) : same && !validCell(tel) ? (PT_INTL ? INTL_MSG : T('errCell')) : ''),
      same || setErr($('fWpp'), 'eWpp', !validCell(wpp) ? (PT_INTL ? INTL_MSG : T('errWpp')) : '')
    ].every(Boolean);
    if (!ok) { var bad = this.querySelector('[aria-invalid=true]'); if (bad) bad.focus(); return; }

    var btn = $('fGo');
    btn.disabled = true; btn.firstElementChild.textContent = T('sending');
    // Se o CRM estiver fora do ar, a pessoa não fica sem o download: o erro só vai para o console.
    saveLead({ nome: nome, telefone: mask(tel), whatsapp: mask(wpp) })
      .catch(function (err) { console.error('Lead não salvo:', err); })
      .then(function () {
        try { localStorage.setItem('acelere-screen-lead', '1'); } catch (_) {}
        chipReady.then(function () { showDownload(true); });
      });
  });

  // Quem já preencheu neste navegador não preenche de novo.
  try { if (localStorage.getItem('acelere-screen-lead')) chipReady.then(function () { showDownload(false); }); } catch (_) {}
})();
