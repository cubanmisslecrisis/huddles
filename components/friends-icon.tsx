import type { SVGProps } from "react"
import { Users } from "lucide-react"

export function FriendsIcon(props: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const { filled, ...rest } = props
  const isFilled = filled || (props.fill && props.fill !== "none")

  if (isFilled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        <defs>
          <mask id="users-filled-mask">
            <rect width="24" height="24" fill="white" stroke="none" />
            <circle cx="9" cy="7" r="6.8" fill="black" stroke="black" strokeWidth={1} />
            <path
              d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
              fill="black"
              stroke="black"
              strokeWidth={6.8}
            />
          </mask>
        </defs>
        {/* Back User */}
        <g mask="url(#users-filled-mask)">
          <circle cx="16" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-4-4h-2" />
        </g>
        {/* Front User */}
        <circle cx="9" cy="7" r="4" />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      </svg>
    )
  }

  return <Users {...(rest as any)} />
}
