// Testes de segurança e privacidade do site.
// Garantem que dados pessoais não vazam e que a CSP não é quebrada por engano.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => readFileSync(join(raiz, f), 'utf8');

const CSP_ESPERADA = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'";
const PAGINAS = ['index.html', '404.html'];

// E-mail que pode aparecer em público. Qualquer outro Gmail é tratado como fuga.
const EMAIL_PUBLICO = 'guilhermegrafica57@gmail.com';

// Procura dados pessoais num texto, sem guardar os dados verdadeiros neste ficheiro
// (o repositório é público: escrever aqui o número a proteger seria publicá-lo).
// - qualquer telemóvel português (9 dígitos a começar por 91, 92, 93 ou 96, com ou sem +351)
// - qualquer endereço Gmail que não seja o público
export function dadosProibidos(texto) {
  const problemas = [];
  if (/(?:\+351[\s.-]?)?\b9[1236]\d(?:[\s.-]?\d{3}){2}\b/.test(texto)) problemas.push('número de telemóvel');
  for (const [email] of texto.matchAll(/[\w.+-]+@gmail\.com/gi)) {
    if (email.toLowerCase() !== EMAIL_PUBLICO) problemas.push(`e-mail ${email}`);
  }
  return problemas;
}

// Todos os ficheiros de texto que vão para o GitHub (o que o Git conhece, menos binários).
// Inclui documentação e testes, porque tudo no repositório público fica visível.
function ficheirosPublicos() {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: raiz, encoding: 'utf8' });
  // Ícones SVG ficam de fora: os números dos desenhos parecem telefones.
  const binario = /\.(woff2?|webp|png|jpe?g|gif|ico|pdf|svg)$/i;
  if (!r.error && r.status === 0) {
    return r.stdout.split('\n').filter((f) => f && !binario.test(f) && existsSync(join(raiz, f)));
  }
  // Sem Git: verifica pelo menos as páginas e as pastas do site.
  const lista = [...PAGINAS, 'README.md'].filter((f) => existsSync(join(raiz, f)));
  for (const pasta of ['css', 'js', 'data']) {
    const dir = join(raiz, pasta);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (statSync(join(dir, f)).isFile()) lista.push(join(pasta, f));
    }
  }
  return lista;
}

test('dadosProibidos apanha telemóveis e Gmails que não são o público', () => {
  assert.deepEqual(dadosProibidos(`Contacto: ${EMAIL_PUBLICO}`), []);
  // Exemplos falsos montados por partes, para este ficheiro não disparar o próprio teste.
  assert.ok(dadosProibidos(['Tel: 91', '2 345 678'].join('')).length);
  assert.ok(dadosProibidos(['Tel: +351 96', '1234567'].join('')).length);
  assert.ok(dadosProibidos(['outra.pessoa', 'gmail.com'].join('@')).length);
  assert.deepEqual(dadosProibidos('Set 2025 – Mai 2026 · 170 partículas'), []);
});

test('nenhum ficheiro do repositório contém telemóvel ou Gmail privado', () => {
  for (const f of ficheirosPublicos()) {
    assert.deepEqual(dadosProibidos(ler(f)), [], `${f} contém dados pessoais`);
  }
});

// O texto dentro de um PDF vem comprimido, por isso o teste acima não o vê.
// Aqui usamos o `pdftotext` (pacote poppler-utils) para ler cada CV público.
// Se o programa não existir no computador, o teste é saltado com aviso.
export function textoDoPdf(caminho) {
  const r = spawnSync('pdftotext', [caminho, '-'], { encoding: 'utf8' });
  if (r.error) return null;
  return r.stdout;
}

test('o CV público não contém telemóvel nem Gmail privado', (t) => {
  const pasta = join(raiz, 'assets', 'cv');
  const pdfs = existsSync(pasta) ? readdirSync(pasta).filter((f) => f.endsWith('.pdf')) : [];
  for (const f of pdfs) {
    const texto = textoDoPdf(join(pasta, f));
    if (texto === null) { t.skip('pdftotext não instalado'); return; }
    assert.deepEqual(dadosProibidos(texto), [], `assets/cv/${f} contém dados pessoais`);
  }
});

for (const pagina of PAGINAS) {
  test(`${pagina} tem a CSP exata`, () => {
    const html = ler(pagina);
    const m = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
    assert.ok(m, 'meta CSP em falta');
    assert.equal(m[1], CSP_ESPERADA);
  });

  test(`${pagina} não tem script inline, atributo style nem handlers on*`, () => {
    const html = ler(pagina);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const [, attrs, corpo] of scripts) {
      assert.match(attrs, /\bsrc=/, 'script sem src (inline)');
      assert.equal(corpo.trim(), '', 'script com conteúdo inline');
    }
    assert.ok(!/<style\b/i.test(html), 'bloco <style> inline');
    assert.ok(!/\sstyle\s*=/i.test(html), 'atributo style=');
    assert.ok(!/\son[a-z]+\s*=/i.test(html), 'handler on*=');
  });

  test(`${pagina}: todos os src/href locais existem no disco`, () => {
    const html = ler(pagina);
    const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/gi)].map((m) => m[1]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
      const caminho = ref.replace(/^\//, '').split(/[?#]/)[0];
      assert.ok(existsSync(join(raiz, caminho)), `${pagina} referencia ficheiro inexistente: ${ref}`);
    }
  });

  test(`${pagina}: links target=_blank têm rel noopener noreferrer`, () => {
    const html = ler(pagina);
    for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
      assert.match(tag, /rel="[^"]*noopener[^"]*"/, `falta noopener: ${tag}`);
      assert.match(tag, /rel="[^"]*noreferrer[^"]*"/, `falta noreferrer: ${tag}`);
    }
  });
}
