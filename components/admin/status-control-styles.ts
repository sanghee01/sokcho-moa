export const statusControlStyles = {
  controls: "relative isolate flex flex-nowrap gap-2",
  button: "inline-flex min-w-20 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
  spinner: "size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent",
  liveHidden: "sr-only",
  liveError: "absolute right-0 top-full z-10 mt-2 w-max max-w-72 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-lg ring-1 ring-rose-200",
  badge: "inline-flex min-w-20 justify-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold",
  actionCell: "min-w-[18rem] px-4 py-4",
} as const;
