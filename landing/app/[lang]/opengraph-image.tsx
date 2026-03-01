import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
// Image metadata
export const alt = 'SpaceCheck - AR for Furniture Retailers'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a3a52', // Primary Dark Blue
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#1a3a52', padding: '40px 60px', borderRadius: '30px', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            {/* Logo Area */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                {/* Simple CSS Icon */}
                <div style={{
                    width: 60,
                    height: 60,
                    backgroundColor: '#208a93',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 24,
                    boxShadow: '0 0 20px rgba(32, 138, 147, 0.5)'
                }}>
                    <div style={{ fontSize: 36, color: 'white', fontWeight: 900 }}>SC</div>
                </div>
                <div style={{ fontSize: 64, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', display: 'flex' }}>
                    SpaceCheck<span style={{ color: '#208a93' }}>.app</span>
                </div>
            </div>
            
            {/* Tagline */}
            <div style={{ fontSize: 32, color: '#e0f2f1', maxWidth: 800, textAlign: 'center', lineHeight: 1.4, fontWeight: 500 }}>
                Turn Product Photos into <br />
                <span style={{ color: '#4fd1c5', fontWeight: 'bold', textShadow: '0 0 30px rgba(79, 209, 197, 0.4)' }}>AR Sales Machines</span>
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'flex', marginTop: 40, gap: 20 }}>
                <div style={{ padding: '10px 25px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, color: '#fff', fontSize: 20 }}>
                    AI 3D Generation
                </div>
                <div style={{ padding: '10px 25px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, color: '#fff', fontSize: 20 }}>
                    No App Needed
                </div>
                <div style={{ padding: '10px 25px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, color: '#fff', fontSize: 20 }}>
                    Works on iOS & Android
                </div>
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
