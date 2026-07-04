import { ImageResponse } from 'next/og';

export const alt = 'Relocate Index — Find your ideal country';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 500, marginBottom: 20 }}>
          Relocate Index
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.9,
            maxWidth: 800,
            textAlign: 'center',
          }}
        >
          Rank 60 countries across 10 data-driven dimensions
        </div>
        <div style={{ fontSize: 20, opacity: 0.6, marginTop: 40 }}>
          relocateindex.com
        </div>
      </div>
    ),
    { ...size },
  );
}
