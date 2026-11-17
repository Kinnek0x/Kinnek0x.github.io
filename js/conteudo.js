// Lê data/competencias.json e data/projetos.json e desenha as secções.
// As funções de validação e de HTML são "puras" (não tocam no DOM),
// por isso podem ser testadas em Node: ver tests/conteudo.test.mjs.

const GITHUB = 'https://github.com/Kinnek0x';

// Ícones que existem em css/estilo.css (classes .i-<nome>).
export const ICONES = new Set([
  'linux', 'linuxmint', 'popos', 'fedora', 'anydesk', 'teamviewer', 'html5', 'css',
  'javascript', 'php', 'mysql', 'git', 'github-marca', 'virtualbox', 'python',
  'arrow-up-right', 'car', 'check', 'cloud', 'copy', 'cpu', 'file-spreadsheet',
  'file-text', 'github', 'globe', 'linkedin', 'mail', 'map-pin', 'monitor',
  'monitor-smartphone', 'moon', 'network', 'presentation', 'server',
  'square-terminal', 'sun', 'wifi', 'wrench', 'windows', 'powershell',
]);

// Ícones com versão a cores em assets/icons/cor/ (Devicon, licença MIT).
// Estes são mostrados como imagem; os restantes usam máscara com a cor da marca (ver CSS).
export const ICONES_COR = new Set([
  'python', 'javascript', 'php', 'mysql', 'html5', 'css', 'git', 'linux', 'fedora', 'windows', 'powershell',
]);

/** Escapa texto para poder ir dentro de HTML sem risco de XSS. */
export function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

const textoValido = (v) => typeof v === 'string' && v.trim() !== '';
const urlValida = (v) => typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/.test(v);

/** Devolve a lista de erros encontrados (vazia se estiver tudo bem). */
export function validarCompetencias(dados) {
  const erros = [];
  if (!dados || !Array.isArray(dados.grupos)) return ['grupos: tem de ser uma lista'];
  dados.grupos.forEach((g, i) => {
    if (!textoValido(g?.nome)) erros.push(`grupos[${i}].nome em falta`);
    if (!Array.isArray(g?.itens)) { erros.push(`grupos[${i}].itens: tem de ser uma lista`); return; }
    g.itens.forEach((it, j) => {
      const onde = `grupos[${i}].itens[${j}]`;
      if (!textoValido(it?.nome)) erros.push(`${onde}.nome em falta`);
      if (!ICONES.has(it?.icone)) erros.push(`${onde}.icone desconhecido: ${it?.icone}`);
      if (it?.estado !== undefined && it.estado !== 'a-aprender') erros.push(`${onde}.estado inválido: ${it.estado}`);
    });
  });
  return erros;
}

export function validarProjetos(dados) {
  const erros = [];
  if (!dados || !Array.isArray(dados.projetos)) return ['projetos: tem de ser uma lista'];
  dados.projetos.forEach((p, i) => {
    const onde = `projetos[${i}]`;
    if (!textoValido(p?.titulo)) erros.push(`${onde}.titulo em falta`);
    if (!textoValido(p?.resumo)) erros.push(`${onde}.resumo em falta`);
    if (!Array.isArray(p?.tags)) erros.push(`${onde}.tags: tem de ser uma lista`);
    if (!['concluido', 'em-breve'].includes(p?.estado)) erros.push(`${onde}.estado inválido: ${p?.estado}`);
    for (const campo of ['link', 'codigo']) {
      if (p?.[campo] !== undefined && !urlValida(p[campo])) erros.push(`${onde}.${campo}: só links https://`);
    }
    if (p?.estado === 'concluido' && !p.link && !p.codigo) erros.push(`${onde}: projeto concluído precisa de link ou codigo`);
    if (p?.imagem !== undefined && !/^assets\/img\/[\w./-]+$/.test(p.imagem)) erros.push(`${onde}.imagem: tem de estar em assets/img/`);
    if (p?.seguranca !== undefined && !Array.isArray(p.seguranca)) erros.push(`${onde}.seguranca: tem de ser uma lista`);
  });
  return erros;
}

function aviso(oQue) {
  return `<p class="aviso">Não foi possível carregar ${oQue}. Veja-os no meu <a href="${GITHUB}">GitHub</a>.</p>`;
}

const icone = (nome) => `<span class="ico i-${escapar(nome)}" aria-hidden="true"></span>`;
const iconeCompetencia = (nome) => (ICONES_COR.has(nome)
  ? `<img class="ico-cor" src="assets/icons/cor/${escapar(nome)}.svg" alt="" width="28" height="28" loading="lazy" decoding="async">`
  : icone(nome));
const linkExterno = (href, texto, nomeIcone) =>
  `<a class="botao botao--pequeno" href="${escapar(href)}" target="_blank" rel="noopener noreferrer">${icone(nomeIcone)}${escapar(texto)}</a>`;

export function htmlCompetencias(dados) {
  if (validarCompetencias(dados).length) return aviso('as competências');
  return dados.grupos.map((g) => `
    <section class="grupo${g.itens.length >= 7 ? ' grupo--largo' : ''}">
      <h3>${escapar(g.nome)}</h3>
      <ul>${g.itens.map((it) => {
        const aprender = it.estado === 'a-aprender';
        return `<li class="competencia${aprender ? ' competencia--aprender' : ''}">${iconeCompetencia(it.icone)}<span>${escapar(it.nome)}</span>${aprender ? '<span class="competencia__etiqueta">A aprender</span>' : ''}</li>`;
      }).join('')}</ul>
    </section>`).join('');
}

export function htmlProjetos(dados) {
  if (validarProjetos(dados).length) return aviso('os projetos');
  return dados.projetos.map((p) => {
    const emBreve = p.estado === 'em-breve';
    const classes = ['projeto', p.destaque ? 'projeto--destaque' : '', emBreve ? 'projeto--em-breve' : ''].filter(Boolean).join(' ');
    const etiqueta = emBreve
      ? '<span class="etiqueta">Em breve</span>'
      : p.destaque ? '<span class="etiqueta etiqueta--destaque">Projeto principal</span>' : '<span class="etiqueta etiqueta--ativo">Concluído</span>';
    const imagem = p.imagem
      ? `<div class="projeto__imagem"><img src="${escapar(p.imagem)}" alt="${escapar(p.imagemAlt || p.titulo)}" width="1280" height="800" loading="lazy" decoding="async"></div>`
      : '';
    const seguranca = Array.isArray(p.seguranca) && p.seguranca.length
      ? `<p class="seguranca__titulo">Segurança</p><ul class="seguranca">${p.seguranca.map((s) => `<li>${icone('check')}<span>${escapar(s)}</span></li>`).join('')}</ul>`
      : '';
    const links = [
      p.link ? linkExterno(p.link, 'Ver online', 'arrow-up-right') : '',
      p.codigo ? linkExterno(p.codigo, 'Ver código', 'github') : '',
    ].join('');
    return `
    <article class="${classes}">
      ${imagem}
      <div class="projeto__corpo">
        <div class="projeto__topo">${etiqueta}</div>
        <h3>${escapar(p.titulo)}</h3>
        <p class="projeto__resumo">${escapar(p.resumo)}</p>
        <ul class="tags">${p.tags.map((t) => `<li>${escapar(t)}</li>`).join('')}</ul>
        ${seguranca}
        ${links ? `<div class="projeto__links">${links}</div>` : ''}
      </div>
    </article>`;
  }).join('');
}

async function lerJSON(caminho) {
  try {
    const resposta = await fetch(caminho, { cache: 'no-cache' });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

/** Vai buscar os dados e injeta o HTML (já escapado) nos contentores. */
export async function iniciarConteudo(doc = document) {
  const [competencias, projetos] = await Promise.all([
    lerJSON('data/competencias.json'),
    lerJSON('data/projetos.json'),
  ]);
  const alvoC = doc.getElementById('lista-competencias');
  const alvoP = doc.getElementById('lista-projetos');
  if (alvoC) alvoC.innerHTML = htmlCompetencias(competencias);
  if (alvoP) alvoP.innerHTML = htmlProjetos(projetos);
  // Ajuda quem edita os JSON: mostra os erros na consola do browser.
  for (const e of [...validarCompetencias(competencias), ...validarProjetos(projetos)]) console.warn('[dados]', e);
}
