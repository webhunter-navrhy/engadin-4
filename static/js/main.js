// Engadin Hotel – hlavička, mobilní menu, záložky ubytování, odhalení sekcí.
(function () {
  var hl = document.querySelector('.hl');
  var plna = function () { hl.classList.toggle('plna', scrollY > 60 || !document.querySelector('.hero')); };
  addEventListener('scroll', plna, { passive: true }); plna();

  var burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', function () {
    var o = hl.classList.toggle('otevreno');
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });

  var tabs = [].slice.call(document.querySelectorAll('.zal [role=tab]'));
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on);
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
    });
  });

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('videt'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-odhal]').forEach(function (el) { el.classList.add('odhal'); io.observe(el); });
  }
})();

// fotogalerie: zvětšení fotky
(function () {
  var d = document.querySelector('dialog.lightbox');
  if (!d) return;
  var im = d.querySelector('img');
  document.querySelectorAll('[data-velka]').forEach(function (b) {
    b.addEventListener('click', function () { im.src = b.dataset.velka; im.alt = b.querySelector('img').alt; d.showModal(); });
  });
  d.addEventListener('click', function () { d.close(); });
})();

// formulář poptávky: odesílá přes administraci WebHunter (e-mail na recepci)
document.querySelectorAll('form.formular').forEach(function (f) {
  var stav = f.querySelector('.formular-stav');
  var t0 = Date.now();
  var q = new URLSearchParams(location.search);
  if (q.get('pobyt') && f.elements.skupina) f.elements.skupina.value = q.get('pobyt');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var hp = f.querySelector('.past input').value;
    var btn = f.querySelector('button[type=submit],button:not([type])');
    var pole = {}, popis = {jmeno:'Jméno',email:'E-mail',telefon:'Telefon',organizace:'Škola / klub / oddíl',skupina:'Typ pobytu',prijezd:'Příjezd',odjezd:'Odjezd',deti:'Počet dětí',dospeli:'Počet dospělých',strava:'Strava',zprava:'Poznámka'};
    Object.keys(popis).forEach(function (k) { if (f.elements[k] && f.elements[k].value) pole[popis[k]] = f.elements[k].value; });
    stav.textContent = 'Odesílám…'; if (btn) btn.disabled = true;
    fetch('https://webhunter-admin.webhunter.workers.dev/api/engadin/form', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'poptavka', fields: pole, page: location.href, hp: hp, ms: Date.now() - t0 })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok !== false, j: j }; }); })
    .then(function (r) {
      if (r.ok) { f.reset(); stav.textContent = 'Děkujeme, poptávku jsme přijali a brzy se Vám ozveme.'; }
      else { stav.textContent = (r.j && r.j.error) || 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo nám napište e-mail.'; }
    }).catch(function () { stav.textContent = 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo nám napište e-mail.'; })
    .then(function () { if (btn) btn.disabled = false; });
  });
});

(function(){var p=document.getElementById('popup');if(!p)return;
var klic='engadin-popup',videl=false;try{videl=sessionStorage.getItem(klic)}catch(e){}
function zavrit(){p.hidden=true;try{sessionStorage.setItem(klic,'1')}catch(e){}}
p.addEventListener('click',function(e){if(e.target===p||e.target.hasAttribute('data-popup-zavrit'))zavrit()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!p.hidden)zavrit()});
if(!videl)setTimeout(function(){p.hidden=false},2500);})();
