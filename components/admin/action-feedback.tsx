export function ActionFeedback({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="status" className="mb-5 rounded-card bg-success-subtle px-4 py-3 text-label font-bold text-success ring-1 ring-success-subtle">
      {message}
    </p>
  );
}
