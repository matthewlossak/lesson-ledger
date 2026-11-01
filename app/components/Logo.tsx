// The ledger mark from app/icon.svg, minus its teal tile, which would
// disappear against the header anyway. Keep the two in sync.
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="6 7 20 19" className={className} aria-hidden="true">
      <path
        d="M16 10.5c-2.6-1.6-5.6-2.2-9-2v13.5c3.4-.2 6.4.4 9 2 2.6-1.6 5.6-2.2 9-2V8.5c-3.4-.2-6.4.4-9 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 10.5v13.5" stroke="currentColor" strokeWidth="2" />
      <path d="M19.5 9.4 23 8.8v7.2l-1.75-1.5-1.75 1.5z" fill="#b0603a" />
    </svg>
  )
}
