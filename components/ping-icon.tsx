export function PingIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M 8.5 8.5 A 5 5 0 0 0 8.5 15.5" />
      <path d="M 5 5 A 10 10 0 0 0 5 19" />
      <path d="M 15.5 8.5 A 5 5 0 0 1 15.5 15.5" />
      <path d="M 19 5 A 10 10 0 0 1 19 19" />
    </svg>
  )
}
