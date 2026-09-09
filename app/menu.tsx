'use client';
/* oxlint-disable next/no-img-element -- Supplied lossless WebP assets are already sized; preserve their original pixels. */
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  addLine,
  itemFor,
  keyFor,
  money,
  optionsFor,
  restoreLines,
  unitPrice,
  type Item,
  type Line,
} from '../lib/order';
import {
  Plus,
  Minus,
  X,
  Trash2,
  ArrowUpRight,
  ShoppingBag,
  Check,
} from 'lucide-react';
import data from '../lib/menu.json';
import sizes from '../lib/image-sizes.json';
export default function Menu() {
  const [active, setActive] = useState('soups');
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [option, setOption] = useState('');
  const [view, setView] = useState<'edit' | 'waiter' | 'clear' | null>(null);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((n, l) => n + unitPrice(l) * l.quantity, 0);
  const opened = Boolean(selected || view);
  // Restore device storage after hydration; the server cannot read it.
  useEffect(() => {
    try {
      // oxlint-disable-next-line react/react-compiler -- One-time hydration from browser-only storage.
      setLines(
        restoreLines(
          JSON.parse(localStorage.getItem('pho-viet-list-v1') || '[]'),
        ),
      );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem('pho-viet-list-v1', JSON.stringify(lines));
      } catch {}
  }, [lines, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2200);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!opened) return;
    const el = dialog.current;
    const prior = document.activeElement as HTMLElement | null;
    el?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, [opened]);
  useEffect(() => {
    const update = () => {
      let current = data.categories[0].id;
      for (const c of data.categories) {
        const section = document.getElementById(c.id);
        if (section && section.getBoundingClientRect().top <= 150)
          current = c.id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.categories');
    const link = nav?.querySelector<HTMLElement>('.active');
    if (!nav || !link) return;
    const bounds = nav.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (target.left < bounds.left)
      nav.scrollLeft += target.left - bounds.left - 12;
    else if (target.right > bounds.right)
      nav.scrollLeft += target.right - bounds.right + 12;
  }, [active]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: object,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'show_waiter_list',
            description:
              'Открыть текущий заказ для показа на кассе. Заказ никуда не отправляется.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('Ожидается пустой объект');
              flushSync(() => {
                setSelected(null);
                setView('waiter');
              });
              return { view: 'waiter', sent: false };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  function close() {
    setSelected(null);
    setView(null);
  }
  function add(item: Item, choice: string) {
    setLines((current) => addLine(current, item, choice));
    setNotice('Добавлено: ' + item.name.toLowerCase());
    close();
  }
  function choose(item: Item) {
    if (optionsFor(item).length) {
      setOption('');
      setSelected(item);
    } else add(item, '');
  }
  function change(line: Line, delta: number) {
    setLines((current) =>
      current
        .map((l) =>
          keyFor(l) === keyFor(line)
            ? { ...l, quantity: Math.min(99, l.quantity + delta) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  return (
    <>
      <header className="masthead" id="top">
        <a className="brand" href="#top">
          pho viet<span>ВЬЕТНАМСКАЯ КУХНЯ</span>
        </a>
        <span className="header-label">Меню · цены в BYN</span>
        <button className="bag" onClick={() => setView('edit')}>
          <ShoppingBag size={18} /> Мой список <span>{count}</span>
        </button>
      </header>
      <div className="intro">
        <div>
          <span className="eyebrow">PHO VIET / МЕНЮ</span>
          <h1>
            На любой <em>вкус.</em>
          </h1>
        </div>
        <p>
          От горячего фо до манго-шейка.
          <br />
          Выбирайте то, что хочется сегодня.
        </p>
      </div>
      <nav className="categories" aria-label="Категории меню">
        {data.categories.map((c) => (
          <a
            key={c.id}
            className={active === c.id ? 'active' : ''}
            aria-current={active === c.id ? 'location' : undefined}
            href={'#' + c.id}
            onClick={() => setActive(c.id)}
          >
            {c.name}
            <span>
              {data.items.filter((i) => i.category === c.name).length}
            </span>
          </a>
        ))}
      </nav>
      <main>
        {data.categories.map((cat, index) => (
          <section id={cat.id} key={cat.id} className="menu-section">
            <div className="section-heading">
              <h2>
                <span>0{index + 1}</span>
                {cat.name}
              </h2>
              <span>
                {data.items.filter((i) => i.category === cat.name).length} в
                меню <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="dish-grid">
              {data.items
                .filter((i) => i.category === cat.name)
                .map((item) => (
                  <article className="dish" key={item.id}>
                    <div className="dish-photo">
                      <img
                        src={'/' + item.image}
                        alt={item.name}
                        width={sizes[item.id as keyof typeof sizes][0]}
                        height={sizes[item.id as keyof typeof sizes][1]}
                        loading={cat.id === 'soups' ? 'eager' : 'lazy'}
                      />
                    </div>
                    <div className="dish-info">
                      <h3>{item.name.toLocaleLowerCase('ru')}</h3>
                      <p>{'description' in item ? item.description : ''}</p>
                      {'weight' in item && (
                        <span className="weight">{item.weight}</span>
                      )}
                      <div className="dish-bottom">
                        <strong>{item.display_price}</strong>
                        {(!lines.some((line) => line.itemId === item.id) ||
                          optionsFor(item).length > 0) && (
                          <button
                            className="add"
                            disabled={!ready}
                            onClick={() => choose(item)}
                            aria-label={'Добавить ' + item.name}
                          >
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                      {lines
                        .filter((line) => line.itemId === item.id)
                        .map((line) => (
                          <div className="card-quantity" key={keyFor(line)}>
                            {line.option && (
                              <span className="card-option">{line.option}</span>
                            )}
                            <div
                              className="stepper"
                              aria-label={item.name + ' ' + line.option}
                            >
                              <button
                                onClick={() => change(line, -1)}
                                aria-label={
                                  'Уменьшить ' + item.name + ' ' + line.option
                                }
                              >
                                <Minus size={16} />
                              </button>
                              <span aria-live="polite">{line.quantity}</span>
                              <button
                                disabled={line.quantity === 99}
                                onClick={() => change(line, 1)}
                                aria-label={
                                  'Увеличить ' + item.name + ' ' + line.option
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </main>
      <footer className={count > 0 ? 'with-order-bar' : ''}>
        <div className="footer-brand">
          <span className="brand">pho viet</span>
          <p>Все цены в белорусских рублях · BYN</p>
        </div>
        <div className="footer-legal">
          <p>
            Общество с ограниченной ответственностью <strong>«Фо Вьет»</strong>
          </p>
          <p>УНП 193811859</p>
          <p>Адрес кафе: Леонида Беды 45</p>
        </div>
      </footer>
      {count > 0 && (
        <div className="order-bar">
          <button className="bar-summary" onClick={() => setView('edit')}>
            <span className="count-box">{count}</span>
            <span>
              Мой список<strong>{money(total)}</strong>
            </span>
          </button>
          <button className="primary" onClick={() => setView('waiter')}>
            Показать заказ <ArrowUpRight size={18} />
          </button>
        </div>
      )}
      <output className={notice ? 'toast visible' : 'toast'}>
        {notice && (
          <>
            <Check size={16} />
            {notice}
          </>
        )}
      </output>
      <dialog
        aria-labelledby="dialog-title"
        ref={dialog}
        className={'order-dialog ' + (view === 'waiter' ? 'waiter' : '')}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <button className="close" onClick={close} aria-label="Закрыть">
          <X size={22} />
        </button>
        {selected ? (
          <>
            <div className="option-photo">
              <img src={'/' + selected.image} alt={selected.name} />
            </div>
            <div className="dialog-content">
              <span className="eyebrow">ВАШ ВЫБОР</span>
              <h2 id="dialog-title" className="item-title">
                {selected.name.toLowerCase()}
              </h2>
              {'description' in selected && <p>{selected.description}</p>}
              <fieldset>
                <legend>
                  {selected.name.toLowerCase().includes('с гарниром')
                    ? 'Выберите гарнир · включён в цену'
                    : 'Выберите вариант'}
                </legend>
                {optionsFor(selected).map((o) => (
                  <label
                    className={'option ' + (option === o.name ? 'chosen' : '')}
                    key={o.name}
                  >
                    <input
                      type="radio"
                      name="dish-option"
                      value={o.name}
                      checked={option === o.name}
                      onChange={() => setOption(o.name)}
                    />
                    <span>{o.name}</span>
                    <strong>{money(Math.round(o.price * 100))}</strong>
                  </label>
                ))}
              </fieldset>
              <button
                className="primary full"
                disabled={!option}
                onClick={() => add(selected, option)}
              >
                Добавить в список <Plus size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="dialog-content">
            <span className="eyebrow">PHO VIET</span>
            <h2 id="dialog-title">
              {view === 'clear'
                ? 'Очистить список?'
                : view === 'waiter'
                  ? 'Заказ'
                  : 'Мой список'}
            </h2>
            {view === 'clear' ? (
              <>
                <p>Все выбранные блюда будут удалены из списка.</p>
                <div className="confirm-actions">
                  <button className="secondary" onClick={() => setView('edit')}>
                    Оставить список
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      setLines([]);
                      setView('edit');
                    }}
                  >
                    Да, очистить
                  </button>
                </div>
              </>
            ) : (
              <>
                {view === 'waiter' && (
                  <p className="waiter-note">
                    Покажите этот список на кассе, чтобы передать заказ
                  </p>
                )}
                {lines.length === 0 ? (
                  <div className="empty">
                    <ShoppingBag size={38} />
                    <h3>Пока ничего не выбрано</h3>
                    <p>Добавьте блюда из меню — они появятся здесь.</p>
                    <button className="primary" onClick={close}>
                      Вернуться к меню
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="order-lines">
                      {lines.map((line) => (
                        <div className="order-line" key={keyFor(line)}>
                          <div className="line-description">
                            <h3 className="item-title">
                              {itemFor(line).name.toLowerCase()}
                            </h3>
                            {line.option && <p>{line.option}</p>}
                            <span>
                              {money(unitPrice(line))} × {line.quantity}
                            </span>
                          </div>
                          <strong>
                            {money(unitPrice(line) * line.quantity)}
                          </strong>
                          {view === 'edit' && (
                            <div className="line-actions">
                              <div className="stepper">
                                <button
                                  onClick={() => change(line, -1)}
                                  aria-label={
                                    'Уменьшить ' +
                                    itemFor(line).name +
                                    ' ' +
                                    line.option
                                  }
                                >
                                  <Minus size={16} />
                                </button>
                                <span>{line.quantity}</span>
                                <button
                                  disabled={line.quantity === 99}
                                  onClick={() => change(line, 1)}
                                  aria-label={
                                    'Увеличить ' +
                                    itemFor(line).name +
                                    ' ' +
                                    line.option
                                  }
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                              <button
                                className="remove"
                                aria-label={
                                  'Удалить ' +
                                  itemFor(line).name +
                                  ' ' +
                                  line.option
                                }
                                onClick={() =>
                                  setLines((current) =>
                                    current.filter(
                                      (l) => keyFor(l) !== keyFor(line),
                                    ),
                                  )
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="total">
                      <span>Итого</span>
                      <strong>{money(total)}</strong>
                    </div>
                    {view === 'edit' ? (
                      <>
                        <button
                          className="primary full"
                          onClick={() => setView('waiter')}
                        >
                          Показать заказ <ArrowUpRight size={18} />
                        </button>
                        <button
                          className="text-button"
                          onClick={() => setView('clear')}
                        >
                          Очистить список
                        </button>
                      </>
                    ) : (
                      <button
                        className="secondary full"
                        onClick={() => setView('edit')}
                      >
                        Изменить список
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
