'use client';

import { useState } from 'react';
import { calculateTotals, formatPence, type BasketLine, type Fulfilment, type Restaurant } from '../lib/basket';

type Details = { name: string; phone: string; address: string; notes: string };

/**
 * Two steps: details, then confirm.
 *
 * The version this replaced had four, and one of them was "create an account".
 * The funnel showed people leaving at exactly that point, so it is gone. There
 * is no login here at all, and there is nothing on this screen that a customer
 * has to remember for next time.
 */
export function Checkout({
  lines,
  totals,
  fulfilment,
  restaurant,
  onBack,
  onDone,
}: {
  lines: BasketLine[];
  totals: ReturnType<typeof calculateTotals>;
  fulfilment: Fulfilment;
  restaurant: Restaurant;
  onBack: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [placed, setPlaced] = useState(false);
  const [details, setDetails] = useState<Details>({ name: '', phone: '', address: '', notes: '' });
  const [touched, setTouched] = useState(false);

  const problems = validate(details, fulfilment);
  const ready = Object.keys(problems).length === 0;

  if (placed) {
    return (
      <div className="page narrow">
        <div className="done">
          <span className="done-tick" aria-hidden="true">✓</span>
          <h1>Order placed</h1>
          <p>
            Thanks {details.name.split(' ')[0]}. {restaurant.name} will have this ready in about{' '}
            {fulfilment === 'collection' ? restaurant.collectionMinutes : restaurant.deliveryMinutes}{' '}
            minutes, and will ring {details.phone} if there is a problem.
          </p>
          <p className="demo-note">
            This is a demo build. No order was sent and no payment was taken.
          </p>
          <button className="checkout" onClick={onDone}>
            Back to the menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <button className="back" onClick={step === 1 ? onBack : () => setStep(1)}>
        ← {step === 1 ? 'Back to menu' : 'Back to details'}
      </button>

      <ol className="steps" aria-label="Checkout progress">
        <li data-active={step === 1} data-done={step > 1}>1. Your details</li>
        <li data-active={step === 2}>2. Confirm</li>
      </ol>

      {step === 1 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (ready) setStep(2);
          }}
          noValidate
        >
          <Field
            label="Name"
            value={details.name}
            error={touched ? problems.name : undefined}
            autoComplete="name"
            onChange={(name) => setDetails((d) => ({ ...d, name }))}
          />
          <Field
            label="Phone"
            type="tel"
            value={details.phone}
            error={touched ? problems.phone : undefined}
            autoComplete="tel"
            hint="So the kitchen can ring you if something is off."
            onChange={(phone) => setDetails((d) => ({ ...d, phone }))}
          />
          {fulfilment === 'delivery' && (
            <Field
              label="Delivery address"
              value={details.address}
              error={touched ? problems.address : undefined}
              autoComplete="street-address"
              onChange={(address) => setDetails((d) => ({ ...d, address }))}
            />
          )}
          <Field
            label="Anything we should know?"
            value={details.notes}
            optional
            hint="Allergies, buzzer number, that sort of thing."
            onChange={(notes) => setDetails((d) => ({ ...d, notes }))}
          />

          <button className="checkout" type="submit">
            Continue
          </button>
          <p className="guest-note">No account, no password. We keep none of this after the order.</p>
        </form>
      ) : (
        <div className="confirm">
          <h2>Check this over</h2>

          <ul className="lines confirm-lines">
            {lines.map((line) => (
              <li key={line.item.id}>
                <div className="line-name">
                  <span>
                    {line.quantity} × {line.item.name}
                  </span>
                  <span className="line-price">
                    {formatPence(line.item.pricePence * line.quantity)}
                  </span>
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
                <dd>{totals.deliveryFeePence === 0 ? 'Free' : formatPence(totals.deliveryFeePence)}</dd>
              </div>
            )}
            <div className="grand">
              <dt>Total</dt>
              <dd>{formatPence(totals.totalPence)}</dd>
            </div>
          </dl>

          <div className="summary-card">
            <p>
              <strong>{fulfilment === 'collection' ? 'Collection' : 'Delivery'}</strong> ·{' '}
              {details.name} · {details.phone}
            </p>
            {fulfilment === 'delivery' && <p>{details.address}</p>}
            {details.notes && <p className="notes">“{details.notes}”</p>}
          </div>

          <p className="demo-note">
            Payment is taken in person. This is a demo build, so nothing is charged and no order
            is sent.
          </p>

          <button className="checkout" onClick={() => setPlaced(true)}>
            Place order · {formatPence(totals.totalPence)}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  optional = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  optional?: boolean;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, '-');
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">
        {label} {optional && <span className="optional">optional</span>}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function validate(details: Details, fulfilment: Fulfilment): Partial<Record<keyof Details, string>> {
  const problems: Partial<Record<keyof Details, string>> = {};

  if (details.name.trim().length < 2) problems.name = 'We need a name for the order.';

  // Deliberately loose. Rejecting a valid UK number because of a space or a
  // +44 is a worse outcome than accepting something odd.
  const digits = details.phone.replace(/[^0-9]/g, '');
  if (digits.length < 10) problems.phone = 'That does not look like a phone number.';

  if (fulfilment === 'delivery' && details.address.trim().length < 6) {
    problems.address = 'We need somewhere to bring it.';
  }

  return problems;
}
