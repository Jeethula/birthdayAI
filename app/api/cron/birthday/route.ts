import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBirthdayEmail } from '@/lib/email';
import { generateBirthdayMessage as generateMessage, isGeminiAvailable } from '@/lib/gemini';

type CelebrationType = 'birthday' | 'anniversary' | 'both';
async function generateBirthdayMessage(name: string, type: CelebrationType = 'birthday'): Promise<string> {
  return generateMessage(name);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This function checks if today matches a given date's month and day
function isDateAnniversary(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth()
  );
}

// Check if today is birthday or work anniversary
function isCelebrationDay(person: { dateOfBirth?: Date | null; dateOfJoining?: Date | null }): {
  isBirthday: boolean;
  isWorkAnniversary: boolean;
} {
  return {
    isBirthday: person.dateOfBirth ? isDateAnniversary(new Date(person.dateOfBirth)) : false,
    isWorkAnniversary: person.dateOfJoining ? isDateAnniversary(new Date(person.dateOfJoining)) : false
  };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate celebration poster data including message
async function generateCelebrationPoster(
  person: { name: string; imageUrl: string },
  celebrations: { isBirthday: boolean; isWorkAnniversary: boolean }
): Promise<string> {
  try {
    let message;
    if (celebrations.isBirthday && celebrations.isWorkAnniversary) {
      message = await generateBirthdayMessage(person.name, 'both');
    } else if (celebrations.isBirthday) {
      message = await generateBirthdayMessage(person.name, 'birthday');
    } else {
      message = await generateBirthdayMessage(person.name, 'anniversary');
    }
    
    // Return structured data for the email template
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: message,
      isAIGenerated: isGeminiAvailable(),
      celebrations: {
        birthday: celebrations.isBirthday,
        workAnniversary: celebrations.isWorkAnniversary
      }
    });
  } catch (error) {
    console.error('Error generating celebration poster:', error);
    // Return fallback data if there's an error
    const fallbackMessage = celebrations.isBirthday && celebrations.isWorkAnniversary
      ? `Happy birthday and work anniversary, ${person.name}!\nWhat a special day to celebrate!`
      : celebrations.isBirthday
        ? `Happy birthday, ${person.name}!\nWishing you a wonderful year ahead!`
        : `Happy work anniversary, ${person.name}!\nThank you for your dedication and hard work!`;
    
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: fallbackMessage,
      isAIGenerated: false,
      celebrations: {
        birthday: celebrations.isBirthday,
        workAnniversary: celebrations.isWorkAnniversary
      }
    });
  }
}

export async function GET() {
  try {
    // Log AI availability
    console.log('AI Generation available:', isGeminiAvailable());
    
    // Get notification email from environment variable
    const notificationEmail =  "jeethupachi@gmail.com";
    
    // Check for missing or invalid email
    if (!notificationEmail || !isValidEmail(notificationEmail)) {
      return NextResponse.json({
        message: 'Birthday check skipped - notification email not configured',
        error: 'NOTIFICATION_EMAIL environment variable is missing or invalid. Please set a valid email address in your environment variables.',
        aiStatus: isGeminiAvailable() ? 'available' : 'unavailable',
        timestamp: new Date().toISOString(),
      }, { status: 200 }); // Using 200 instead of 500 since this is a configuration issue
    }

    // Get all people from the database
    const people = await prisma.person.findMany();
    
    // Filter people who have celebrations today
    const celebrationPeople = people.filter(person => {
      const celebrations = isCelebrationDay(person);
      return celebrations.isBirthday || celebrations.isWorkAnniversary;
    });

    const results = [];

    // For each person with a celebration
    for (const person of celebrationPeople) {
      const celebrations = isCelebrationDay(person);
      try {
        // Generate celebration poster with message
        const posterData = await generateCelebrationPoster(
          {
            name: person.name,
            imageUrl: person.photo || '/default-avatar.png' // Fallback to default if no photo
          },
          celebrations
        );

        // Send personalized email to the celebrating person
        await sendBirthdayEmail({
          to: person.email,
          name: person.name,
          posterUrl: posterData,
          celebrations,
          isAdmin: false
        });

        // Send notification email to admin
        await sendBirthdayEmail({
          to: notificationEmail,
          name: person.name,
          posterUrl: posterData,
          celebrations,
          isAdmin: true
        });

        results.push({
          name: person.name,
          status: 'success',
          celebrations: {
            birthday: celebrations.isBirthday,
            workAnniversary: celebrations.isWorkAnniversary
          },
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
      message: 'Birthday and work anniversary check complete',
      aiStatus: isGeminiAvailable() ? 'available' : 'unavailable',
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Birthday cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process birthday checks',
        details: error instanceof Error ? error.message : 'Unknown error',
        aiStatus: isGeminiAvailable() ? 'available' : 'unavailable'
      },
      { status: 500 }
    );
  }
}