import { OrderFlow } from '../components/OrderFlow';
import { getAllItems, getCategories, getRestaurant } from '../lib/menu';

/**
 * A server component. The menu is read at build time from the content layer
 * and shipped as HTML, so the page is useful before any JavaScript runs and
 * there is no spinner between arriving and seeing the food.
 */
export default function Page() {
  return (
    <OrderFlow
      categories={getCategories()}
      allItems={getAllItems()}
      restaurant={getRestaurant()}
    />
  );
}
