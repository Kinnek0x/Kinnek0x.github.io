// Tema claro/escuro.
// Este ficheiro é carregado no <head> SEM "defer" de propósito: aplica o tema
// antes da página aparecer, para não haver um "flash" da cor errada.
(function () {
  var CHAVE = 'tema';
  var raiz = document.documentElement;

  function guardado() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function guardar(valor) {
    try { localStorage.setItem(CHAVE, valor); } catch (e) { /* modo privado: ignora */ }
  }
  function sistema() {
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function aplicar(tema) {
    raiz.setAttribute('data-theme', tema);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'light' ? '#f5f7fb' : '#0a0e16');
    var botao = document.getElementById('alternar-tema');
    if (botao) {
      botao.setAttribute('aria-label', tema === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro');
      var ico = botao.querySelector('.ico');
      if (ico) ico.className = 'ico ' + (tema === 'light' ? 'i-moon' : 'i-sun');
    }
    // Avisa outros scripts (ex.: partículas mudam de cor).
    document.dispatchEvent(new CustomEvent('tema-mudou', { detail: tema }));
  }

  aplicar(guardado() || sistema());

  // Se o utilizador nunca escolheu, segue o sistema quando este muda.
  if (window.matchMedia) {
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (!guardado()) aplicar(sistema());
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    aplicar(raiz.getAttribute('data-theme'));
    var botao = document.getElementById('alternar-tema');
    if (!botao) return;
    botao.addEventListener('click', function () {
      var novo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      guardar(novo);
      aplicar(novo);
    });
  });
})();
