import type { MenuItem } from './menu';

export type BasketLine = { item: MenuItem; quantity: number };
export type Fulfilment = 'collection' | 'delivery';

export type Totals = {
  subtotalPence: number;
  deliveryFeePence: number;
  totalPence: number;
  freeDeliveryShortfallPence: number;
};

export type Restaurant = {
  name: string;
  area: string;
  collectionMinutes: number;
  deliveryMinutes: number;
  deliveryFeePence: number;
  freeDeliveryOverPence: number;
};

export function addLine(lines: BasketLine[], item: MenuItem): BasketLine[] {
  const existing = lines.find((line) => line.item.id === item.id);
  if (!existing) return [...lines, { item, quantity: 1 }];

  return lines.map((line) =>
    line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
  );
}

export function setQuantity(lines: BasketLine[], itemId: string, quantity: number): BasketLine[] {
  if (quantity <= 0) return lines.filter((line) => line.item.id !== itemId);
  return lines.map((line) => (line.item.id === itemId ? { ...line, quantity } : line));
}

export function countItems(lines: BasketLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/**
 * All money is integer pence. The delivery fee is waived above a threshold,
 * and the shortfall is returned so the basket can tell someone how close they
 * are rather than leaving them to work it out.
 */
export function calculateTotals(
  lines: BasketLine[],
  fulfilment: Fulfilment,
  restaurant: Restaurant
): Totals {
  const subtotalPence = lines.reduce(
    (sum, line) => sum + line.item.pricePence * line.quantity,
    0
  );

  // An empty basket costs nothing, including delivery. Without this it is
  // charged the fee for having ordered nothing, because zero is below the
  // free-delivery threshold like any other small number.
  if (subtotalPence === 0) {
    return {
      subtotalPence: 0,
      deliveryFeePence: 0,
      totalPence: 0,
      freeDeliveryShortfallPence: 0,
    };
  }

  const qualifiesForFreeDelivery = subtotalPence >= restaurant.freeDeliveryOverPence;
  const deliveryFeePence =
    fulfilment === 'delivery' && !qualifiesForFreeDelivery ? restaurant.deliveryFeePence : 0;

  return {
    subtotalPence,
    deliveryFeePence,
    totalPence: subtotalPence + deliveryFeePence,
    freeDeliveryShortfallPence:
      fulfilment === 'delivery' && !qualifiesForFreeDelivery
        ? restaurant.freeDeliveryOverPence - subtotalPence
        : 0,
  };
}

export function formatPence(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

const STORAGE_KEY = 'larder.basket.v1';

/**
 * The basket survives a reload.
 *
 * Losing a basket to an accidental back button was one of the things people
 * were dropping out on, and it is the cheapest of all of this to fix. Only ids
 * and quantities are stored: prices are re-read from the menu on load, so a
 * stale basket cannot pin an old price.
 */
export function saveBasket(lines: BasketLine[]): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = lines.map((line) => ({ id: line.item.id, quantity: line.quantity }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // A full or blocked storage quota should not take the page down.
  }
}

export function loadBasket(allItems: MenuItem[]): BasketLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) return [];
      const { id, quantity } = entry as { id?: unknown; quantity?: unknown };

      const item = allItems.find((candidate) => candidate.id === id);
      // An item pulled from the menu since the basket was saved is dropped
      // rather than resurrected as a ghost line.
      if (!item || typeof quantity !== 'number' || quantity <= 0) return [];

      return [{ item, quantity: Math.min(Math.floor(quantity), 99) }];
    });
  } catch {
    return [];
  }
}
