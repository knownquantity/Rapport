import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F7BC',
          color: '#1a1a1a',
          fontSize: 66,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        r
      </div>
    ),
    { ...size },
  );
}
