export function ActionFeedback({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="status" className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">
      {message}
    </p>
  );
}
