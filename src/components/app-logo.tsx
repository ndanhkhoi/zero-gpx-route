interface AppLogoProps {
  className?: string
  size?: number
}

export function AppLogo({ className, size = 32 }: AppLogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Zero GPX Route"
    >
      <defs>
        <linearGradient id="zg-logo" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0b1220" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#1f2b44" />
      <path
        d="M16 18 H44 L20 44 H48"
        stroke="url(#zg-logo)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={16} cy={18} r={3.6} fill="#0b1220" stroke="url(#zg-logo)" strokeWidth={2.4} />
      <circle cx={48} cy={44} r={3.6} fill="url(#zg-logo)" stroke="#0b1220" strokeWidth={2.4} />
    </svg>
  )
}
