import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'JeetBurner - Burn Empty Token Accounts on Solana';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to bottom, #000000, #111111)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: 'white',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px 40px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ marginRight: '20px' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#14F195" strokeWidth="2" />
              <path d="M7 12L10 15L17 8" stroke="#14F195" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '64px', fontWeight: 'bold', color: '#14F195' }}>JeetBurner</h1>
            <p style={{ margin: 0, fontSize: '28px', color: '#CCCCCC' }}>Burn Empty Token Accounts on Solana</p>
          </div>
        </div>
        <div style={{ 
          fontSize: '24px', 
          color: '#AAAAAA',
          marginTop: '20px',
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          Find and claim empty token accounts to recover SOL
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
