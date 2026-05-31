export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M18 4 L8 18 h6 l-2 10 12-15 h-6 z" fill="#00C9A7" />
    </svg>
  )
}