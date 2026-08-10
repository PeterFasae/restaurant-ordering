import { describe, expect, test } from 'vitest';
import { addLine, calculateTotals, countItems, setQuantity, type BasketLine } from './basket';
import type { MenuItem } from './menu';

const item = (id: string, pricePence: number): MenuItem => ({
  id,
  name: `Item ${id}`,
  description: '',
  pricePence,
  tags: [],
});

const restaurant = {
  name: 'Test',
  area: 'Test',
  collectionMinutes: 25,
  deliveryMinutes: 45,
  deliveryFeePence: 299,
  freeDeliveryOverPence: 3000,
};

describe('basket lines', () => {
  test('adding a new item appends a line', () => {
    expect(addLine([], item('a', 500))).toEqual([{ item: item('a', 500), quantity: 1 }]);
  });

  test('adding the same item increments rather than duplicating', () => {
    const lines = addLine(addLine([], item('a', 500)), item('a', 500));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  test('setting a quantity to zero removes the line', () => {
    const lines: BasketLine[] = [{ item: item('a', 500), quantity: 3 }];
    expect(setQuantity(lines, 'a', 0)).toEqual([]);
  });

  test('counts every unit, not every line', () => {
    expect(
      countItems([
        { item: item('a', 500), quantity: 2 },
        { item: item('b', 300), quantity: 3 },
      ])
    ).toBe(5);
  });
});

describe('totals', () => {
  const lines: BasketLine[] = [
    { item: item('a', 1850), quantity: 1 },
    { item: item('b', 550), quantity: 2 },
  ];

  test('subtotal multiplies price by quantity', () => {
    expect(calculateTotals(lines, 'collection', restaurant).subtotalPence).toBe(2950);
  });

  test('collection is never charged a delivery fee', () => {
    expect(calculateTotals(lines, 'collection', restaurant).deliveryFeePence).toBe(0);
  });

  test('delivery under the threshold is charged', () => {
    const totals = calculateTotals(lines, 'delivery', restaurant);
    expect(totals.deliveryFeePence).toBe(299);
    expect(totals.totalPence).toBe(3249);
  });

  test('the shortfall tells you how close you are', () => {
    // 2950 spent, free over 3000.
    expect(calculateTotals(lines, 'delivery', restaurant).freeDeliveryShortfallPence).toBe(50);
  });

  test('delivery at exactly the threshold is free', () => {
    const atThreshold: BasketLine[] = [{ item: item('a', 3000), quantity: 1 }];
    const totals = calculateTotals(atThreshold, 'delivery', restaurant);
    expect(totals.deliveryFeePence).toBe(0);
    expect(totals.freeDeliveryShortfallPence).toBe(0);
  });

  test('an empty basket totals zero', () => {
    expect(calculateTotals([], 'delivery', restaurant).totalPence).toBe(0);
  });
});
