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

    // Create a beautiful emoji-based SVG placeholder
    const emojis = ['🎬', '📹', '🎥', '📽️', '🎞️', '📺', '🖼️', '🎭', '🌟', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Calculate responsive font sizes
    const emojiSize = Math.min(width, height) * 0.2;
    const textSize = Math.min(width, height) * 0.08;
    const smallTextSize = Math.min(width, height) * 0.06;
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00000020"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGradient)"/>
        
        <!-- Decorative corners -->
        <circle cx="20" cy="20" r="3" fill="#cbd5e1" opacity="0.6"/>
        <circle cx="${width-20}" cy="20" r="3" fill="#cbd5e1" opacity="0.6"/>
        <circle cx="20" cy="${height-20}" r="3" fill="#cbd5e1" opacity="0.6"/>
        <circle cx="${width-20}" cy="${height-20}" r="3" fill="#cbd5e1" opacity="0.6"/>
        
        <!-- Main emoji -->
        <text x="50%" y="40%" text-anchor="middle" font-size="${emojiSize}px" filter="url(#shadow)">
          ${randomEmoji}
        </text>
        
        <!-- Placeholder text -->
        <text x="50%" y="58%" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="${textSize}px" fill="#475569" font-weight="600">
          Video Placeholder
        </text>
        
        <!-- Dimensions -->
        <text x="50%" y="68%" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="${smallTextSize}px" fill="#64748b" font-weight="400">
          ${width} × ${height}
        </text>
        
        <!-- Subtle border -->
        <rect x="1" y="1" width="${width-2}" height="${height-2}" fill="none" stroke="#e2e8f0" stroke-width="2" rx="8"/>
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