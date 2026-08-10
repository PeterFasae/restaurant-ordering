# Restaurant ordering flow

A rebuilt ordering flow for a small restaurant: guest checkout, two steps instead of
four, and a basket that survives a reload.

```bash
npm install
npm run dev     # http://localhost:5175
npm test        # 10 tests on the basket and totals
```

## The problem

The site took online orders and rarely finished them. People arrived, browsed the menu,
and left somewhere between the basket and the confirmation. The owner thought it was the
prices.

The funnel said otherwise. Drop-off clustered at two points:

1. **The account wall.** Checkout demanded an account before it would take an order.
2. **The menu on a phone.** It reflowed into one long unusable list, and most of the
   traffic was mobile.

Neither of those is a pricing problem, and both are a removal rather than a redesign.

## What changed

**Guest checkout.** There is no login in this codebase at all. Nothing on the checkout
screen is something a customer has to remember for next time.

**Four steps became two.** Details, then confirm. The old flow had a separate step for
account creation and another for choosing collection or delivery; the second is now a
toggle in the basket where it belongs, next to the price it affects.

**The basket survives a reload.** Losing a basket to an accidental back button was the
cheapest thing on the list to fix. Only ids and quantities are persisted, and prices are
re-read from the menu on load, so a stale basket cannot pin an old price. An item removed
from the menu is dropped rather than restored as a ghost line.

**One scannable menu with sticky category navigation.** The category chips stay at the
top, track which section you are in, and scroll the active chip into view on narrow
screens.

## The content layer

Prices and specials are never hard-coded in a component. Everything reads through
`src/lib/menu.ts`, which is currently backed by `content/menu.json` standing in for the
headless CMS. Pointing those functions at a CMS client is the whole change.

That mattered more than any of the rest of it: the point of the original build was that
the owner could change the menu without calling me, and she has been doing exactly that
since.

## Tests

10 tests on `src/lib/basket.ts`, the part where being wrong costs money. They cover
adding and incrementing lines, removing at zero, and the total arithmetic including the
free-delivery threshold and the shortfall message.

One of them found a real bug while building this: an empty basket was charged the £2.99
delivery fee, because zero is below the free-delivery threshold like any other small
number.

## Notes

All money is integer pence and formatted only at the edge. Floats for currency is a
rounding bug waiting for the right input.

The page is a server component, so the menu is prerendered as HTML and is readable before
any JavaScript runs.

Phone validation is deliberately loose. Rejecting a valid UK number over a space or a
`+44` is a worse outcome than accepting something odd, and the kitchen rings the number
anyway.

This build takes no payment and collects no card details. It is a demo, and the confirm
screen says so.

## What this is

A reconstruction, built to make the case study inspectable. The original was client work
for a restaurant through Acumen Digital in 2024, and that code and branding are theirs.
The problem, the funnel reasoning and the changes are the same; the +22% figure in my
portfolio is from the real site over its first two months.
