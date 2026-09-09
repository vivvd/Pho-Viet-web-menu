/* oxlint-disable typescript/no-require-imports -- Test harness loads the TypeScript module as CommonJS without adding a runtime dependency. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/order.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { addLine, optionsFor, restoreLines, unitPrice } = loaded.exports;
const menu = require('../lib/menu.json');
const item = (id) => menu.items.find((i) => i.id === id);
test('48 unique dishes, seven valid categories and every supplied photo', () => {
  assert.equal(menu.items.length, 48);
  assert.equal(new Set(menu.items.map((i) => i.id)).size, 48);
  assert.equal(menu.categories.length, 7);
  for (const i of menu.items) {
    assert.ok(menu.categories.some((c) => c.name === i.category));
    assert.ok(
      fs.statSync(path.resolve(__dirname, '../public', i.image)).size > 0,
    );
  }
});
test('different soup sizes stay separate, identical sizes merge, total 56 BYN', () => {
  let rows = addLine([], item('fo-bo'), '600 мл');
  rows = addLine(rows, item('fo-bo'), '800 мл');
  rows = addLine(rows, item('fo-bo'), '600 мл');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].quantity, 2);
  assert.equal(
    rows.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0),
    5600,
  );
});
test('every garnish dish has four free choices, nuggets keep fries', () => {
  for (const i of menu.items.filter((i) => i.name.includes('с гарниром'))) {
    assert.deepEqual(
      optionsFor(i).map((o) => o.name),
      ['Пюре', 'Фри', 'Рис', 'Макароны'],
    );
    assert.ok(optionsFor(i).every((o) => o.price === i.price));
  }
  assert.deepEqual(optionsFor(item('naggetsy-fri')), []);
});
test('garnishes produce distinct lines; missing or forged options rejected', () => {
  let rows = addLine([], item('nem-garnir'), 'Пюре');
  rows = addLine(rows, item('nem-garnir'), 'Рис');
  assert.equal(rows.length, 2);
  assert.throws(() => addLine(rows, item('nem-garnir'), ''));
  assert.throws(() => addLine(rows, item('fo-bo'), '900 мл'));
  assert.throws(() => addLine(rows, item('borsh'), 'Рис'));
});
test('wok and seafood options retain source prices', () => {
  assert.equal(unitPrice(addLine([], item('fo-sao'), 'Креветки')[0]), 2400);
  assert.deepEqual(optionsFor(item('tom-sao')), [
    { name: 'Креветки', price: 22 },
    { name: 'Кальмар', price: 22 },
  ]);
});
test('fractional prices sum exactly in kopecks', () => {
  let rows = addLine([], item('borsh'), '');
  rows = addLine(rows, item('borsh'), '');
  rows = addLine(rows, item('borsh'), '');
  assert.equal(unitPrice(rows[0]) * rows[0].quantity, 2250);
});
test('storage restore ignores corrupt items, options and quantities', () => {
  const good = { itemId: 'fo-bo', option: '800 мл', quantity: 2 };
  assert.deepEqual(
    restoreLines([
      good,
      null,
      { ...good, itemId: 'missing' },
      { ...good, quantity: -1 },
      { ...good, quantity: 1.2 },
      { ...good, option: 'unknown' },
    ]),
    [good],
  );
  assert.deepEqual(restoreLines({}), []);
  assert.equal(restoreLines([good, good])[0].quantity, 4);
});
