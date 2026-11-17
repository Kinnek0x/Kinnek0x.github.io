// Terminal do topo: escreve comandos e respostas em ciclo.
// Com "reduzir movimento" ativo, mostra tudo de uma vez, sem animação.

const PROMPT = 'guilherme@lab:~$';

// Cada entrada: [comando, linhas de resposta]. [[texto]] fica realçado.
// O nmap é feito só ao próprio laboratório (lab.local), nunca a um alvo real.
export const SESSAO = [
  ['whoami', ['guilherme · suporte de TI, a estudar cibersegurança']],
  ['cat competencias.txt', ['windows · linux · redes · suporte remoto · php · mysql']],
  ['ping -c 2 192.168.1.1', [
    '64 bytes de 192.168.1.1: icmp_seq=1 ttl=64 tempo=1.2 ms',
    '64 bytes de 192.168.1.1: icmp_seq=2 ttl=64 tempo=0.9 ms',
  ]],
  ['nmap -F lab.local', [
    'PORTA    ESTADO  SERVIÇO',
    '22/tcp   aberta  ssh',
    '80/tcp   aberta  http',
    '443/tcp  aberta  https',
  ]],
  ['./estado.sh', ['[[ok]] disponível para Help Desk / Suporte N1', '[[..]] a aprender Python e a montar o home lab']],
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Cria os elementos com textContent: nunca se usa innerHTML aqui.
function span(classe, texto) {
  const el = document.createElement('span');
  el.className = classe;
  el.textContent = texto;
  return el;
}

function linhaSaida(texto) {
  const frag = document.createDocumentFragment();
  // Separa os trechos [[realçados]] do texto normal.
  texto.split(/(\[\[.*?\]\])/).forEach((parte) => {
    if (!parte) return;
    const realce = parte.startsWith('[[');
    frag.append(span(realce ? 't-realce' : 't-saida', realce ? parte.slice(2, -2) : parte));
  });
  frag.append('\n');
  return frag;
}

function mostrarTudo(ecra) {
  ecra.textContent = '';
  for (const [cmd, saida] of SESSAO) {
    ecra.append(span('t-prompt', PROMPT + ' '), cmd + '\n');
    saida.forEach((l) => ecra.append(linhaSaida(l)));
  }
  ecra.append(span('t-prompt', PROMPT + ' '));
}

export function iniciarTerminal(ecra, { reduzir = false } = {}) {
  if (!ecra) return;
  if (reduzir) { mostrarTudo(ecra); return; }

  const cursor = span('t-cursor', '');
  const descer = () => { ecra.scrollTop = ecra.scrollHeight; };

  (async function ciclo() {
    for (;;) {
      ecra.textContent = '';
      for (const [cmd, saida] of SESSAO) {
        ecra.append(span('t-prompt', PROMPT + ' '));
        const escrito = document.createTextNode('');
        ecra.append(escrito, cursor);
        for (const letra of cmd) {
          escrito.data += letra;
          await esperar(45 + Math.random() * 65);
        }
        cursor.remove();
        ecra.append('\n');
        await esperar(260);
        for (const l of saida) {
          ecra.append(linhaSaida(l));
          descer();
          await esperar(110);
        }
        descer();
        await esperar(750);
      }
      ecra.append(span('t-prompt', PROMPT + ' '), cursor);
      descer();
      await esperar(4500);
    }
  })();
}
