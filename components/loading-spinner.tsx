export function LoadingSpinner({ className = "size-4" }: { className?: string }) {
  return <span aria-hidden="true" className={`${className} shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent`} />;
}
