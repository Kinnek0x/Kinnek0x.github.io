// Campo de partículas no fundo: pontos ligados por linhas que fogem do rato
// e se deslocam com profundidade ao fazer scroll.
// Nível "intenso" escolhido no protótipo.

export const CONFIG = {
  quantidade: 170,      // partículas em ecrãs largos
  ligacao: 150,         // distância máxima (px) para desenhar uma linha
  repulsao: 170,        // raio (px) à volta do rato que afasta partículas
  ecraPequeno: 700,     // abaixo desta largura usa metade das partículas
};

export function iniciarParticulas(canvas, { reduzir = false } = {}) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const raiz = document.documentElement;
  let pts = [];
  let L = 0, A = 0;
  let cor = '91, 157, 255';
  const rato = { x: -9999, y: -9999 };
  let scrollAnterior = window.scrollY;
  let ativo = true;

  const lerCor = () => { cor = getComputedStyle(raiz).getPropertyValue('--dot').trim() || cor; };

  function semear() {
    const n = L < CONFIG.ecraPequeno ? Math.round(CONFIG.quantidade / 2) : CONFIG.quantidade;
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * L,
      y: Math.random() * A,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      prof: Math.random() * 0.8 + 0.2,   // profundidade: mais perto = mexe mais
    }));
  }

  function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const larguraAntiga = L;
    L = window.innerWidth;
    A = window.innerHeight;
    canvas.width = L * dpr;
    canvas.height = A * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // No telemóvel a barra do browser muda a altura ao fazer scroll: só recria se a largura mudar.
    if (L !== larguraAntiga) semear();
  }

  function desenhar() {
    const dy = window.scrollY - scrollAnterior;
    scrollAnterior = window.scrollY;
    ctx.clearRect(0, 0, L, A);

    for (const p of pts) {
      p.y -= dy * p.prof * 0.6;
      const dx = p.x - rato.x, dyR = p.y - rato.y, d = Math.hypot(dx, dyR);
      if (d < CONFIG.repulsao && d > 0) {
        const f = (1 - d / CONFIG.repulsao) * 2.2;
        p.x += (dx / d) * f;
        p.y += (dyR / d) * f;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = L + 20; else if (p.x > L + 20) p.x = -20;
      if (p.y < -20) p.y = A + 20; else if (p.y > A + 20) p.y = -20;
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const ddx = a.x - b.x, ddy = a.y - b.y;
        if (Math.abs(ddx) > CONFIG.ligacao || Math.abs(ddy) > CONFIG.ligacao) continue;
        const d = Math.hypot(ddx, ddy);
        if (d < CONFIG.ligacao) {
          ctx.strokeStyle = `rgba(${cor}, ${(1 - d / CONFIG.ligacao) * 0.28})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const perto = Math.hypot(a.x - rato.x, a.y - rato.y) < CONFIG.repulsao * 1.4;
      ctx.fillStyle = `rgba(${cor}, ${perto ? 0.95 : 0.55 * a.prof + 0.2})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, perto ? a.r + 1 : a.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function quadro() {
    if (!ativo) return;
    desenhar();
    requestAnimationFrame(quadro);
  }

  lerCor();
  redimensionar();
  window.addEventListener('resize', () => { redimensionar(); if (reduzir) desenhar(); });
  document.addEventListener('tema-mudou', () => { lerCor(); if (reduzir) desenhar(); });

  // Movimento reduzido: um único desenho parado, sem interação.
  if (reduzir) { desenhar(); return; }

  window.addEventListener('pointermove', (e) => { rato.x = e.clientX; rato.y = e.clientY; }, { passive: true });
  const largar = () => { rato.x = rato.y = -9999; };
  document.addEventListener('pointerleave', largar);
  window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') largar(); });
  // Para a animação quando o separador está escondido (poupa bateria).
  document.addEventListener('visibilitychange', () => {
    ativo = !document.hidden;
    if (ativo) { scrollAnterior = window.scrollY; requestAnimationFrame(quadro); }
  });
  requestAnimationFrame(quadro);
}
