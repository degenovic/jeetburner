'use client'

export const Logo = ({ size = 40 }: { size?: number }) => (
  <div className="flex items-center gap-2">
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
      <rect x="100.174" y="378.435" fill="#E1E3FA" width="311.652" height="133.565"/>
      <rect x="189.217" y="0" fill="currentColor" width="133.565" height="33.391"/>
      <rect x="322.783" y="33.391" fill="currentColor" width="33.391" height="33.391"/>
      <rect x="322.783" y="155.826" fill="currentColor" width="33.391" height="33.391"/>
      <rect x="155.826" y="155.826" fill="currentColor" width="33.391" height="33.391"/>
      <rect x="178.087" y="311.652" fill="currentColor" width="33.391" height="66.783"/>
      <rect x="300.522" y="311.652" fill="currentColor" width="33.391" height="66.783"/>
      <polygon fill="currentColor" points="356.174,155.826 389.565,155.826 445.217,155.826 445.217,122.435 389.565,122.435 389.565,66.783 356.174,66.783 
        356.174,122.435"/>
      <rect x="445.217" y="155.826" fill="currentColor" width="33.391" height="33.391"/>
      <rect x="478.609" y="189.217" fill="currentColor" width="33.391" height="89.043"/>
      <rect x="445.217" y="278.261" fill="currentColor" width="33.391" height="33.391"/>
      <path fill="currentColor" d="M378.435,311.652v33.391v66.783h-244.87v-66.783v-33.391h-33.391H66.783v33.391h33.391v66.783v33.391v33.391V512h33.391
        h244.87h33.391v-33.391v-33.391v-33.391v-66.783h33.391v-33.391h-33.391H378.435z M378.435,478.609h-244.87v-33.391h244.87V478.609z"/>
      <rect x="33.391" y="278.261" fill="currentColor" width="33.391" height="33.391"/>
      <rect y="189.217" fill="currentColor" width="33.391" height="89.043"/>
      <rect x="33.391" y="155.826" fill="currentColor" width="33.391" height="33.391"/>
      <polygon fill="currentColor" points=""/>
    </svg>
    <span className="font-mono text-white text-base lowercase tracking-tighter">
      coinbakery
    </span>
  </div>
)
