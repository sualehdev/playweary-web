/** A calm loading card for the moments between placing an order and seeing the receipt. */
export default function OrderLoader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="coWait card" role="status" aria-live="polite">
      <span className="coSpinner" aria-hidden="true" />
      <h1>{title}</h1>
      {note ? <p>{note}</p> : null}
    </div>
  );
}
