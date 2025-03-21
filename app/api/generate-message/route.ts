import { NextResponse } from 'next/server';
import { generateBirthdayMessage, isGeminiAvailable } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // First check if Gemini is available
    if (!isGeminiAvailable()) {
      console.warn('Gemini AI is not configured, using fallback messages');
      // Still return a 200 status as we'll use fallback messages
      return NextResponse.json({
        message: 'AI generation unavailable, using fallback message',
        isAIGenerated: false,
      });
    }

    const data = await request.json();
    const { name } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const message = await generateBirthdayMessage(name);
    
    return NextResponse.json({
      message,
      isAIGenerated: true,
    });
  } catch (error) {
    console.error('Message generation error:', error);

    // Instead of failing, return a fallback message
    return NextResponse.json({
      message: `Happy birthday!\nWishing you a fantastic year ahead!`,
      isAIGenerated: false,
      error: 'Failed to generate AI message, using fallback'
    });
  }
}