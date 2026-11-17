// Testes das funções que validam e desenham competências e projetos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  escapar, validarCompetencias, validarProjetos, htmlCompetencias, htmlProjetos,
} from '../js/conteudo.js';

const lerJSON = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const competencias = lerJSON('competencias.json');
const projetos = lerJSON('projetos.json');

test('escapar neutraliza < > & " \'', () => {
  const r = escapar(`<img src=x onerror="alert('x')"> & fim`);
  assert.ok(!r.includes('<img'));
  assert.ok(!r.includes('"'));
  assert.ok(!r.includes("'"));
  assert.ok(r.includes('&amp; fim'));
});

test('dados reais são válidos', () => {
  assert.deepEqual(validarCompetencias(competencias), []);
  assert.deepEqual(validarProjetos(projetos), []);
});

test('projeto sem título é reportado', () => {
  const erros = validarProjetos({ projetos: [{ resumo: 'x', tags: [], estado: 'em-breve' }] });
  assert.ok(erros.some((e) => e.includes('projetos[0].titulo')), erros.join('\n'));
});

test('em-breve não precisa de link', () => {
  assert.deepEqual(validarProjetos({ projetos: [{ titulo: 'A', resumo: 'B', tags: [], estado: 'em-breve' }] }), []);
});

test('concluido sem link nem codigo é erro', () => {
  const erros = validarProjetos({ projetos: [{ titulo: 'A', resumo: 'B', tags: [], estado: 'concluido' }] });
  assert.ok(erros.some((e) => e.includes('projetos[0]')), erros.join('\n'));
});

test('competência com ícone desconhecido é reportada', () => {
  const erros = validarCompetencias({ grupos: [{ nome: 'G', itens: [{ nome: 'X', icone: 'nao-existe' }] }] });
  assert.ok(erros.some((e) => e.includes('grupos[0].itens[0].icone')), erros.join('\n'));
});

test("Python marcado a-aprender aparece com a etiqueta 'A aprender'", () => {
  const html = htmlCompetencias(competencias);
  const bloco = html.slice(html.indexOf('>Python<') - 300, html.indexOf('>Python<') + 200);
  assert.ok(bloco.includes('A aprender'), bloco);
});

test('mostra erro quando os dados faltam', () => {
  for (const html of [htmlProjetos(null), htmlCompetencias(undefined)]) {
    assert.ok(html.includes('https://github.com/Kinnek0x'), html);
    assert.ok(html.includes('aviso'));
  }
});

test('texto dos dados é escapado no HTML gerado', () => {
  const html = htmlProjetos({ projetos: [{ titulo: '<script>x</script>', resumo: 'r', tags: ['<b>'], estado: 'em-breve' }] });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<b>'));
});

test('links externos dos projetos levam rel noopener noreferrer', () => {
  const html = htmlProjetos(projetos);
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
  }
});

test('só aceita links https nos projetos', () => {
  const erros = validarProjetos({ projetos: [{ titulo: 'A', resumo: 'B', tags: [], estado: 'concluido', link: 'javascript:alert(1)' }] });
  assert.ok(erros.some((e) => e.includes('projetos[0].link')), erros.join('\n'));
});

test('ícones com versão colorida usam <img> local, os outros usam máscara', () => {
  const html = htmlCompetencias({ grupos: [{ nome: 'G', itens: [
    { nome: 'Python', icone: 'python' },
    { nome: 'AnyDesk', icone: 'anydesk' },
  ] }] });
  assert.match(html, /<img class="ico-cor" src="assets\/icons\/cor\/python\.svg" alt=""/);
  assert.match(html, /<span class="ico i-anydesk"/);
});

test('Windows e PowerShell têm ícone próprio', () => {
  assert.deepEqual(validarCompetencias({ grupos: [{ nome: 'G', itens: [
    { nome: 'Windows', icone: 'windows' }, { nome: 'PowerShell', icone: 'powershell' },
  ] }] }), []);
});
