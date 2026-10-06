// Shared site behavior: "how can we help?" chooser on every page.
// Any link to get-started.html opens the chooser instead (add data-direct to opt out).
(function () {
  var css = '@keyframes gs-in{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:none}}' +
    '#gs-modal-overlay{display:none;position:fixed;inset:0;z-index:1000;background:rgba(20,30,45,.45);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:24px}' +
    '#gs-modal-overlay.open{display:flex}' +
    '#gs-modal{background:#fff;border-radius:20px;max-width:480px;width:100%;padding:36px 28px;box-shadow:0 24px 64px rgba(0,0,0,.2);position:relative;animation:gs-in .25s ease-out;font-family:Karla,Arial,sans-serif}' +
    '#gs-modal h2{font-family:Petrona,Georgia,serif;font-style:italic;font-size:26px;color:#0057B8;margin:0 0 6px;font-weight:500}' +
    '#gs-modal .gs-lede{font-size:14px;color:#666;margin:0 0 24px}' +
    '#gs-close{position:absolute;top:12px;right:12px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:none;border:none;border-radius:8px;cursor:pointer;color:#666}' +
    '#gs-close:hover{background:#f3f5f8}' +
    '.gs-list{display:flex;flex-direction:column;gap:12px}' +
    '.gs-option{display:flex;align-items:flex-start;gap:16px;padding:16px 18px;border-radius:14px;border:1.5px solid #e5e7eb;text-decoration:none;transition:border-color .2s,box-shadow .2s,transform .15s}' +
    '.gs-option:hover,.gs-option:focus-visible{border-color:#5DBED8;box-shadow:0 4px 16px rgba(93,190,216,.2);transform:translateY(-2px);outline:none}' +
    '.gs-icon{width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5DBED8,#0057B8)}' +
    '.gs-title{font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:3px}' +
    '.gs-sub{font-size:13px;color:#666;line-height:1.5}';
  var ico = function (p) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var opts = [
    ['checkout.html', ico('<polyline points="5,12 10,17 19,7"/>'), "I'm ready to buy", 'Start using Integrate today and begin saving time immediately.'],
    ['schedule.html', ico('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'), 'I want to speak to sales', "Have questions? Let's walk through your workflow and see if it's a fit."],
    ['get-started.html', ico('<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3,7 12,13 21,7"/>'), 'Email me a demo', 'Get a quick overview of how Integrate works, sent straight to your inbox.']
  ];
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var o = document.createElement('div'); o.id = 'gs-modal-overlay';
    o.innerHTML = '<div id="gs-modal" role="dialog" aria-modal="true" aria-labelledby="gs-h">' +
      '<button id="gs-close" type="button" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '<h2 id="gs-h">how can we help?</h2><p class="gs-lede">choose the best next step for you</p><div class="gs-list">' +
      opts.map(function (x) { return '<a class="gs-option" data-direct href="' + x[0] + '"><span class="gs-icon">' + x[1] + '</span><span><span class="gs-title" style="display:block">' + x[2] + '</span><span class="gs-sub">' + x[3] + '</span></span></a>'; }).join('') +
      '</div></div>';
    document.body.appendChild(o);
    var last = null;
    function open() { last = document.activeElement; o.classList.add('open'); o.querySelector('.gs-option').focus(); }
    function close() { o.classList.remove('open'); if (last) last.focus(); }
    window.openGsModal = open; window.closeGsModal = close;
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    o.querySelector('#gs-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && o.classList.contains('open')) close(); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="get-started.html"]');
      if (!a || a.hasAttribute('data-direct') || a.closest('#gs-modal-overlay')) return;
      e.preventDefault(); open();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
