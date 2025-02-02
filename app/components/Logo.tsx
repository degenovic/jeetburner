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
      viewBox="0 0 486 486"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7FB3D5' }} />
          <stop offset="50%" style={{ stopColor: '#2E86C1' }} />
          <stop offset="100%" style={{ stopColor: '#1B4F72' }} />
        </linearGradient>
      </defs>
      <g transform="translate(0.000000,486.000000) scale(0.100000,-0.100000)"
      fill="url(#logoGradient)" stroke="none">
        <path d="M1827 3633 c-4 -3 -7 -37 -7 -75 l0 -68 -680 0 -679 0 -3 -72 -3 -73
        -71 -3 c-71 -3 -72 -3 -78 -34 -8 -39 -8 -216 0 -245 5 -20 14 -22 78 -25 l71
        -3 3 -72 3 -73 149 0 150 0 0 -75 0 -75 58 0 c33 0 100 -3 150 -6 l92 -7 0
        -51 c0 -104 -19 -96 236 -96 l223 0 3 -72 3 -73 221 -3 221 -2 7 -77 c8 -95 8
        -330 0 -360 -5 -20 -14 -22 -78 -25 l-71 -3 -3 -72 -3 -72 -147 -3 -147 -3 -3
        -72 -3 -72 -72 -3 -72 -3 -3 -147 -3 -148 76 0 75 0 0 -75 0 -75 1134 0 c1025
        0 1134 2 1140 16 3 9 6 42 6 74 l0 59 73 3 72 3 0 145 0 145 -72 3 -73 3 0 59
        c0 95 9 90 -161 90 l-149 0 0 75 0 74 -72 3 -73 3 -3 228 -2 227 75 0 75 0 0
        75 0 74 73 3 72 3 5 70 5 70 64 7 c94 10 91 8 91 88 l0 70 150 0 150 0 0 75 0
        75 150 0 149 0 3 73 3 72 71 3 72 3 6 37 c7 47 8 210 0 239 -5 20 -14 22 -78
        25 l-71 3 -3 73 -3 72 -1283 0 c-705 0 -1286 -3 -1289 -7z m2573 -218 l0 -75
        -75 0 -75 0 0 -75 0 -75 -150 0 -150 0 0 -75 0 -75 -155 0 -155 0 0 -150 0
        -150 -75 0 -75 0 0 -80 0 -80 -831 2 -831 3 -1 453 -2 452 1288 0 1287 0 0
        -75z m-2730 -150 l0 -75 -605 0 -605 0 0 75 0 75 605 0 605 0 0 -75z m2120
        -1745 l0 -150 -1135 0 -1135 0 0 150 0 150 1135 0 1135 0 0 -150z"/>
      </g>
    </svg>
  </div>
)
