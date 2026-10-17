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
