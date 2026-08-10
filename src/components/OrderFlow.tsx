'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addLine,
  calculateTotals,
  countItems,
  formatPence,
  loadBasket,
  saveBasket,
  setQuantity,
  type BasketLine,
  type Fulfilment,
  type Restaurant,
} from '../lib/basket';
import type { Category, MenuItem } from '../lib/menu';
import { Checkout } from './Checkout';

export function OrderFlow({
  categories,
  allItems,
  restaurant,
}: {
  categories: Category[];
  allItems: MenuItem[];
  restaurant: Restaurant;
}) {
  const [lines, setLines] = useState<BasketLine[]>([]);
  const [fulfilment, setFulfilment] = useState<Fulfilment>('collection');
  const [checkingOut, setCheckingOut] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');
  const [restored, setRestored] = useState(false);

  // Restore before the first save, so an empty initial state cannot overwrite
  // a saved basket.
  useEffect(() => {
    setLines(loadBasket(allItems));
    setRestored(true);
  }, [allItems]);

  useEffect(() => {
    if (restored) saveBasket(lines);
  }, [lines, restored]);

  const totals = useMemo(
    () => calculateTotals(lines, fulfilment, restaurant),
    [lines, fulfilment, restaurant]
  );

  if (checkingOut) {
    return (
      <Checkout
        lines={lines}
        totals={totals}
        fulfilment={fulfilment}
        restaurant={restaurant}
        onBack={() => setCheckingOut(false)}
        onDone={() => {
          setLines([]);
          setCheckingOut(false);
        }}
      />
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">{restaurant.area}</p>
        <h1>{restaurant.name}</h1>
        <p className="hero-note">
          Collection in about {restaurant.collectionMinutes} minutes · Delivery in about{' '}
          {restaurant.deliveryMinutes} minutes
        </p>
      </header>

      <CategoryNav
        categories={categories}
        active={activeCategory}
        onActive={setActiveCategory}
      />

      <main className="layout">
        <div className="menu">
          {categories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="category">
              <h2>{category.name}</h2>
              <ul className="items">
                {category.items.map((item) => (
                  <li key={item.id} className="item">
                    <div className="item-text">
                      <h3>
                        {item.name}
                        {item.tags.includes('v') && (
                          <span className="veg" title="Vegetarian" aria-label="Vegetarian">
                            v
                          </span>
                        )}
                      </h3>
                      <p>{item.description}</p>
                      <span className="price">{formatPence(item.pricePence)}</span>
                    </div>
                    <button
                      className="add"
                      onClick={() => setLines((current) => addLine(current, item))}
                      aria-label={`Add ${item.name} to basket`}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Basket
          lines={lines}
          totals={totals}
          fulfilment={fulfilment}
          restaurant={restaurant}
          onFulfilment={setFulfilment}
          onQuantity={(id, quantity) => setLines((current) => setQuantity(current, id, quantity))}
          onCheckout={() => setCheckingOut(true)}
        />
      </main>
    </div>
  );
}

/**
 * Sticky category navigation.
 *
 * Most of the traffic was on phones, where the old menu was one long reflowed
 * list with no way to get to the puddings without scrolling past everything.
 */
function CategoryNav({
  categories,
  active,
  onActive,
}: {
  categories: Category[];
  active: string;
  onActive: (id: string) => void;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) onActive(visible.target.id.replace('cat-', ''));
      },
      { rootMargin: '-96px 0px -70% 0px' }
    );

    for (const category of categories) {
      const element = document.getElementById(`cat-${category.id}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [categories, onActive]);

  // Keep the active chip in view on narrow screens.
  useEffect(() => {
    navRef.current
      ?.querySelector(`[data-cat="${active}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  return (
    <nav className="catnav" ref={navRef} aria-label="Menu sections">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`#cat-${category.id}`}
          data-cat={category.id}
          data-active={active === category.id}
        >
          {category.name}
        </a>
      ))}
    </nav>
  );
}

function Basket({
  lines,
  totals,
  fulfilment,
  restaurant,
  onFulfilment,
  onQuantity,
  onCheckout,
}: {
  lines: BasketLine[];
  totals: ReturnType<typeof calculateTotals>;
  fulfilment: Fulfilment;
  restaurant: Restaurant;
  onFulfilment: (value: Fulfilment) => void;
  onQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  const count = countItems(lines);

  return (
    <aside className="basket" aria-label="Your order">
      <div className="basket-inner">
        <div className="fulfilment" role="group" aria-label="Collection or delivery">
          <button data-active={fulfilment === 'collection'} onClick={() => onFulfilment('collection')}>
            Collection
          </button>
          <button data-active={fulfilment === 'delivery'} onClick={() => onFulfilment('delivery')}>
            Delivery
          </button>
        </div>

        <h2 className="basket-title">
          Your order {count > 0 && <span className="count">{count}</span>}
        </h2>

        {lines.length === 0 ? (
          <p className="basket-empty">Nothing here yet.</p>
        ) : (
          <>
            <ul className="lines">
              {lines.map((line) => (
                <li key={line.item.id}>
                  <div className="line-name">
                    <span>{line.item.name}</span>
                    <span className="line-price">
                      {formatPence(line.item.pricePence * line.quantity)}
                    </span>
                  </div>
                  <div className="qty">
                    <button
                      onClick={() => onQuantity(line.item.id, line.quantity - 1)}
                      aria-label={`Remove one ${line.item.name}`}
                    >
                      −
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button
                      onClick={() => onQuantity(line.item.id, line.quantity + 1)}
                      aria-label={`Add one ${line.item.name}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPence(totals.subtotalPence)}</dd>
              </div>
              {fulfilment === 'delivery' && (
                <div>
                  <dt>Delivery</dt>
                  <dd>
                    {totals.deliveryFeePence === 0 ? 'Free' : formatPence(totals.deliveryFeePence)}
                  </dd>
                </div>
              )}
              <div className="grand">
                <dt>Total</dt>
                <dd>{formatPence(totals.totalPence)}</dd>
              </div>
            </dl>

            {totals.freeDeliveryShortfallPence > 0 && (
              <p className="nudge">
                {formatPence(totals.freeDeliveryShortfallPence)} more for free delivery.
              </p>
            )}

            <button className="checkout" onClick={onCheckout}>
              Checkout · {formatPence(totals.totalPence)}
            </button>
            <p className="guest-note">
              No account needed. {restaurant.name} will have this ready in about{' '}
              {fulfilment === 'collection' ? restaurant.collectionMinutes : restaurant.deliveryMinutes}{' '}
              minutes.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
