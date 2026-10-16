import { ImageResponse } from 'next/og';

export const alt = 'rapport.computer — give your agent a name';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F4F7BC',
          color: '#1a1a1a',
          padding: '72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: 0.5,
          }}
        >
          rapport.computer
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700 }}>
            Give your agent a name.
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 40, opacity: 0.75 }}>
            First 100 free — then $5.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 28, opacity: 0.5 }}>
          name.rapport.computer
        </div>
      </div>
    ),
    { ...size },
  );
}
