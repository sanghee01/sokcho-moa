import { setEventReviewStatusAction } from "@/lib/actions/admin";

export function StatusControls({ id, slug, current }: { id: string; slug: string; current: string }) {
  const actions = [
    ["published", "공개", "bg-emerald-700 text-white"],
    ["pending", "비공개", "bg-slate-200 text-slate-800"],
    ["rejected", "반려", "bg-rose-100 text-rose-900"],
  ] as const;
  return (
    <div className="flex flex-wrap gap-2" aria-label="공개 상태 변경">
      {actions.map(([status, label, tone]) => (
        <form key={status} action={setEventReviewStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="status" value={status} />
          <button disabled={current === status} className={`rounded-xl px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}>{label}</button>
        </form>
      ))}
    </div>
  );
}
