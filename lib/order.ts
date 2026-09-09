import data from './menu.json';
export type Item = (typeof data.items)[number];
export type Line = { itemId: string; option: string; quantity: number };
export type Option = { name: string; price: number };
export const garnishes = ['Пюре', 'Фри', 'Рис', 'Макароны'];
export const money = (kopecks: number) =>
  (kopecks / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' р.';
export function optionsFor(item: Item): Option[] {
  if (item.name.toLowerCase().includes('с гарниром'))
    return garnishes.map((name) => ({ name, price: item.price }));
  if (item.id === 'tom-sao')
    return ['Креветки', 'Кальмар'].map((name) => ({ name, price: item.price }));
  return 'variants' in item && item.variants ? item.variants : [];
}
export function itemFor(line: Line) {
  return data.items.find((i) => i.id === line.itemId)!;
}
export function unitPrice(line: Line) {
  const item = itemFor(line);
  return Math.round(
    (optionsFor(item).find((o) => o.name === line.option)?.price ??
      item.price) * 100,
  );
}
export const keyFor = (line: Line) =>
  JSON.stringify([line.itemId, line.option]);
export function addLine(lines: Line[], item: Item, option: string): Line[] {
  const options = optionsFor(item);
  if (options.length ? !options.some((o) => o.name === option) : option !== '')
    throw new Error('Выберите вариант блюда');
  const line = { itemId: item.id, option, quantity: 1 };
  const key = keyFor(line);
  return lines.some((l) => keyFor(l) === key)
    ? lines.map((l) =>
        keyFor(l) === key
          ? { ...l, quantity: Math.min(99, l.quantity + 1) }
          : l,
      )
    : [...lines, line];
}
export function restoreLines(value: unknown): Line[] {
  if (!Array.isArray(value)) return [];
  const result: Line[] = [];
  for (const row of value) {
    if (
      !row ||
      typeof row !== 'object' ||
      !Number.isInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 99 ||
      typeof row.option !== 'string'
    )
      continue;
    const item = data.items.find((i) => i.id === row.itemId);
    if (!item) continue;
    const options = optionsFor(item);
    if (
      options.length
        ? !options.some((o) => o.name === row.option)
        : row.option !== ''
    )
      continue;
    const line = {
      itemId: item.id,
      option: row.option,
      quantity: row.quantity,
    };
    const existing = result.find((l) => keyFor(l) === keyFor(line));
    if (existing)
      existing.quantity = Math.min(99, existing.quantity + line.quantity);
    else result.push(line);
  }
  return result;
}
