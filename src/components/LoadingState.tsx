export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="empty-state" aria-live="polite">
      {label}
    </p>
  );
}