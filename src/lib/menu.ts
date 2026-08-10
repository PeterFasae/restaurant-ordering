import menu from '../../content/menu.json';
import type { Restaurant } from './basket';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  pricePence: number;
  tags: string[];
};

export type Category = { id: string; name: string; items: MenuItem[] };

/**
 * The content layer.
 *
 * A local JSON file stands in for the headless CMS. Everything downstream
 * reads through these functions, so pointing them at a CMS client is the whole
 * change. The point of the original build was that the owner could edit prices
 * and specials without calling me, which meant no price could be hard-coded in
 * a component.
 */
export function getCategories(): Category[] {
  return menu.categories as Category[];
}

export function getRestaurant(): Restaurant {
  return menu.restaurant as Restaurant;
}

export function getAllItems(): MenuItem[] {
  return getCategories().flatMap((category) => category.items);
}
