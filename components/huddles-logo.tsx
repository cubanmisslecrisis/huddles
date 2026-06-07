export function HuddlesLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="7.4 7.5 30.2 37"
      className={className ?? "h-8 w-auto"}
      style={style}
      fill="currentColor"
    >
      <circle cx="12.8" cy="12.8" r="5.3" />
      <path d="M37.6,20v18.8c0,3.6-1.9,5.7-5.3,5.7s-5.3-2.1-5.3-5.7v-13h-9v13c0,3.7-1.9,5.7-5.3,5.7s-5.3-2.1-5.3-5.7v-18.8c0-1.6,1.3-2.9,2.8-2.9h24.5c1.6,0,2.8,1.3,2.8,2.9h0Z" />
      <circle cx="32.4" cy="12.8" r="5.3" />
    </svg>
  )
}
