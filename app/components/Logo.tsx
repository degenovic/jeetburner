'use client'

import Image from 'next/image';

interface LogoProps {
  size?: number
  className?: string
}

export const Logo = ({ size = 64, className = '' }: LogoProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Image 
      src="/images/brew.png" 
      alt="CoinBrew Logo" 
      width={size} 
      height={size} 
      className={className}
    />
  </div>
)
