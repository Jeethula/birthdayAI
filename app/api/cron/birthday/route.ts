import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBirthdayEmail } from '@/lib/email';
import { generateBirthdayMessage, isGeminiAvailable } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This function checks if today is someone's birthday
function isBirthday(dateOfBirth: Date): boolean {
  const today = new Date();
  return (
    dateOfBirth.getDate() === today.getDate() &&
    dateOfBirth.getMonth() === today.getMonth()
  );
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate poster data including message
async function generateBirthdayPoster(person: { name: string; imageUrl: string }): Promise<string> {
  try {
    // Generate birthday message (will use fallback if AI is unavailable)
    const message = await generateBirthdayMessage(person.name);
    
    // Return structured data for the email template
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: message,
      isAIGenerated: isGeminiAvailable()
    });
  } catch (error) {
    console.error('Error generating birthday poster:', error);
    // Return fallback data if there's an error
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: `Happy birthday, ${person.name}!\nWishing you a wonderful year ahead!`,
      isAIGenerated: false
    });
  }
}

export async function GET() {
  try {
    // Log AI availability
    console.log('AI Generation available:', isGeminiAvailable());
    
    // Get notification email from environment variable
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    if (!notificationEmail || !isValidEmail(notificationEmail)) {
      throw new Error('Invalid or missing NOTIFICATION_EMAIL environment variable. Must be a valid email address.');
    }

    // Get all people from the database
    const people = await prisma.person.findMany();
    
    // Filter people who have birthdays today
    const birthdayPeople = people.filter(person =>
      person.dateOfBirth && isBirthday(new Date(person.dateOfBirth))
    );

    const results = [];

    // For each person with a birthday
    for (const person of birthdayPeople) {
      try {
        // Generate birthday poster with message
        const posterData = await generateBirthdayPoster({
          name: person.name,
          imageUrl: person.photo || '/default-avatar.png' // Fallback to default if no photo
        });

        // Send email with the poster
        await sendBirthdayEmail({
          to: notificationEmail,
          name: person.name,
          posterUrl: posterData,
        });

        results.push({
          name: person.name,
          status: 'success',
          isAIGenerated: JSON.parse(posterData).isAIGenerated
        });
      } catch (error) {
        console.error(`Error processing birthday for ${person.name}:`, error);
        results.push({
          name: person.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Birthday check complete',
      aiStatus: isGeminiAvailable() ? 'available' : 'unavailable',
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Birthday cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process birthday checks',
        aiStatus: isGeminiAvailable() ? 'available' : 'unavailable'
      },
      { status: 500 }
    );
  }
}