'use client'

interface LogoProps {
  size?: number
  className?: string
}

export const Logo = ({ size = 40, className = '' }: LogoProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
      style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}
    >
      <polygon fill="currentColor" points="512,189.217 478.609,189.217 478.609,155.826 445.217,155.826 445.217,122.435 
        389.565,122.435 389.565,66.783 356.174,66.783 356.174,33.391 322.783,33.391 322.783,0 189.217,0 189.217,33.391 155.826,33.391 
        155.826,66.783 122.435,66.783 122.435,122.435 66.783,122.435 66.783,155.826 33.391,155.826 33.391,189.217 0,189.217 0,278.261 
        33.391,278.261 33.391,311.652 66.783,311.652 66.783,345.043 100.174,345.043 100.174,512 411.826,512 411.826,345.043 
        445.217,345.043 445.217,311.652 478.609,311.652 478.609,278.261 512,278.261" />
      <rect x="100.174" y="378.435" fill="#E1E3FA" width="311.652" height="22.261" />
      <rect x="100.174" y="422.957" fill="#E1E3FA" width="311.652" height="22.261" />
      <rect x="100.174" y="467.478" fill="#E1E3FA" width="311.652" height="22.261" />
    </svg>
  </div>
)
