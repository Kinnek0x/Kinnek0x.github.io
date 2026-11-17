// Secções aparecem suavemente quando entram no ecrã.
// Sem JavaScript, ou com "reduzir movimento", tudo fica visível desde o início.

export function iniciarRevelar({ reduzir = false } = {}) {
  const alvos = document.querySelectorAll('.revelar');
  if (reduzir || !('IntersectionObserver' in window)) return;

  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) {
        e.target.classList.add('revelado');
        observador.unobserve(e.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Só esconde o que ainda está abaixo do ecrã; o que já se vê fica visível.
  const altura = window.innerHeight;
  alvos.forEach((el) => {
    if (el.getBoundingClientRect().top < altura) el.classList.add('revelado');
    else observador.observe(el);
  });
  document.documentElement.classList.add('js-anima');
}
