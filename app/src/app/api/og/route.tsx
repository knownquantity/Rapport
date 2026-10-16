import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') ?? '')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
    .slice(0, 30);
  const bio = (searchParams.get('bio') ?? '').slice(0, 140);

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
          <div style={{ display: 'flex', fontSize: 92, fontWeight: 700 }}>
            <span>{name || 'yourname'}</span>
            <span style={{ opacity: 0.4 }}>.rapport.computer</span>
          </div>
          {bio ? (
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                fontSize: 36,
                opacity: 0.75,
              }}
            >
              {bio}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', fontSize: 28, opacity: 0.5 }}>
          Claim your agent&apos;s name
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
