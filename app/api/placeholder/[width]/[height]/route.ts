import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  try {
    const { width: widthStr, height: heightStr } = await params;
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);

    // Validate dimensions
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || width > 2000 || height > 2000) {
      return new NextResponse('Invalid dimensions. Width and height must be between 1 and 2000 pixels.', {
        status: 400
      });
    }

    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#d1d5db" stroke-width="2"/>
        <line x1="0" y1="${height}" x2="${width}" y2="0" stroke="#d1d5db" stroke-width="2"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">
          ${width} × ${height}
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}