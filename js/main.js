// Ponto de entrada: liga todas as partes da página.
import { iniciarConteudo } from './conteudo.js';
import { iniciarTerminal } from './terminal.js';
import { iniciarParticulas } from './particulas.js';
import { iniciarRevelar } from './revelar.js';

const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

iniciarParticulas(document.getElementById('particulas'), { reduzir });
iniciarTerminal(document.getElementById('terminal'), { reduzir });
iniciarConteudo().then(() => iniciarRevelar({ reduzir }));
navegacao();
copiarEmail();

const ano = document.getElementById('ano');
if (ano) ano.textContent = String(new Date().getFullYear());

// Navegação: ganha fundo ao fazer scroll e marca a secção atual.
function navegacao() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const atualizar = () => nav.classList.toggle('nav--fundo', window.scrollY > 10);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });

  if (!('IntersectionObserver' in window)) return;
  const links = new Map([...nav.querySelectorAll('.nav__links a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const link = links.get(e.target.id);
      if (link && e.isIntersecting) {
        links.forEach((a) => a.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) obs.observe(s); });
}

// Botão "Copiar" do e-mail, com alternativa se a área de transferência não estiver disponível.
function copiarEmail() {
  const botao = document.getElementById('copiar-email');
  const email = document.getElementById('email');
  const estado = document.getElementById('copiar-estado');
  if (!botao || !email) return;
  const texto = botao.querySelector('.copiar__texto');

  botao.addEventListener('click', async () => {
    const endereco = email.textContent.trim();
    try {
      await navigator.clipboard.writeText(endereco);
      botao.classList.add('copiado');
      texto.textContent = 'Copiado';
      if (estado) estado.textContent = 'E-mail copiado.';
      setTimeout(() => { botao.classList.remove('copiado'); texto.textContent = 'Copiar'; }, 2000);
    } catch {
      // Seleciona o texto para o visitante copiar à mão.
      const sel = window.getSelection();
      const intervalo = document.createRange();
      intervalo.selectNodeContents(email);
      sel.removeAllRanges();
      sel.addRange(intervalo);
      if (estado) estado.textContent = 'Selecionei o e-mail: carregue em Ctrl+C para copiar.';
    }
  });
}
