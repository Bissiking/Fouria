interface IconProps {
  className?: string
}

const base = 'h-4 w-4'

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" strokeLinecap="round" />
      <path d="M16 5.6a3 3 0 0 1 0 5.6M17.4 14.9c2 .7 3.3 2.3 3.7 4.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconCpu({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <rect x="4" y="4" width="16" height="16" rx="4" opacity="0.45" />
      <path d="M12 10.5v3M10.5 12h3" strokeLinecap="round" />
      <path d="M9 2.5v2M15 2.5v2M9 19.5v2M15 19.5v2M2.5 9h2M2.5 15h2M19.5 9h2M19.5 15h2" strokeLinecap="round" />
    </svg>
  )
}

export function IconVolume({ on, className = base }: IconProps & { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 10v4h3l4 3.5v-15L7 10H4z" strokeLinejoin="round" />
      {on ? (
        <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" strokeLinecap="round" />
      ) : (
        <path d="M15.5 10l4 4M19.5 10l-4 4" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function IconBack({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconRefresh({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" strokeLinecap="round" />
      <path d="M20 4v4.5h-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconTrash({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4.5 7h15M9.5 7V5.4A1.4 1.4 0 0 1 11 4h2a1.4 1.4 0 0 1 1.5 1.4V7" strokeLinecap="round" />
      <path d="M6.5 7l.8 11.2A1.8 1.8 0 0 0 9.1 20h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7" strokeLinecap="round" />
      <path d="M10.5 11v5M13.5 11v5" strokeLinecap="round" />
    </svg>
  )
}

export function IconTrophy({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0V4z" strokeLinejoin="round" />
      <path d="M7.5 5.5H5A1.5 1.5 0 0 0 3.5 7v1A3.5 3.5 0 0 0 7 11.5M16.5 5.5H19A1.5 1.5 0 0 1 20.5 7v1a3.5 3.5 0 0 1-3.5 3.5" strokeLinecap="round" />
      <path d="M12 13v3.5M9 20h6M10 16.5h4l.6 3.5H9.4l.6-3.5z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function IconPlay({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8.5 5.6c0-.9 1-1.5 1.8-1l8.4 5.4c.7.5.7 1.5 0 2l-8.4 5.4c-.8.5-1.8-.1-1.8-1V5.6z" />
    </svg>
  )
}

export function IconCopy({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconWifi({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeLinecap="round" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeLinecap="round" />
    </svg>
  )
}

export function IconWifiOff({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeLinecap="round" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeLinecap="round" />
      <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" />
    </svg>
  )
}
