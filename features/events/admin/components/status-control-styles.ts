export const statusControlStyles = {
  controls: "relative isolate flex flex-nowrap gap-2",
  button: "inline-flex min-w-20 items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-3 py-2 text-label font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
  deleteButton: "inline-flex min-h-10 min-w-20 items-center justify-center whitespace-nowrap rounded-control bg-danger-subtle px-3 py-2 text-label font-bold text-danger transition-colors hover:bg-danger-subtle",
  spinner: "size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent",
  liveHidden: "sr-only",
  liveError: "absolute right-0 top-full z-10 mt-2 w-max max-w-72 rounded-control bg-danger-subtle px-3 py-2 text-caption font-bold text-danger shadow-floating ring-1 ring-danger-subtle",
  badge: "inline-flex min-w-20 justify-center whitespace-nowrap rounded-full bg-surface-muted px-2.5 py-1 text-caption font-bold",
  actionCell: "min-w-[23rem] px-4 py-4",
} as const;
