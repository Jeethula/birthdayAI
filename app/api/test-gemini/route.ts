import { NextResponse } from 'next/server';
import { generateBirthdayMessage } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Log environment variable for debugging
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    
    // Try generating a test message
    const testMessage = await generateBirthdayMessage('Test User');
    
    return NextResponse.json({
      success: true,
      message: testMessage,
      apiKeyConfigured: !!process.env.GEMINI_API_KEY
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.GEMINI_API_KEY
    }, { status: 500 });
  }
}