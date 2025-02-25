'use client'

import Image from 'next/image';

interface LogoProps {
  size?: number
  className?: string
}

export const Logo = ({ size = 64, className = '' }: LogoProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    Jeet<Image 
      src="/images/jeetburner2.gif" 
      alt="JeetBurner Logo" 
      width={size} 
      height={size} 
      className={className}
    />
  </div>
)
