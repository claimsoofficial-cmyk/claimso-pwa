import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Read the x-vercel-ip-country header from the request
    const country = request.headers.get('x-vercel-ip-country');
    
    // Return the country code or null if not found
    return NextResponse.json({ 
      country: country || null 
    });
  } catch (error) {
    // Handle any unexpected errors gracefully
    return NextResponse.json(
      { country: null },
      { status: 500 }
    );
  }
}