import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBirthdayEmail } from '@/lib/email';
import { generateBirthdayMessage as generateMessage, isGeminiAvailable } from '@/lib/gemini';

type CelebrationType = 'birthday';
async function generateBirthdayMessage(name: string): Promise<string> {
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
  person: { name: string; imageUrl: string }
): Promise<string> {
  try {
    const message = await generateBirthdayMessage(person.name);
    
    // Return structured data for the email template
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: message,
      isAIGenerated: isGeminiAvailable(),
      celebrations: {
        birthday: true,
        workAnniversary: false
      }
    });
  } catch (error) {
    console.error('Error generating celebration poster:', error);
    // Return fallback data if there's an error
    return JSON.stringify({
      imageUrl: person.imageUrl,
      message: `Happy birthday, ${person.name}!\nWishing you a wonderful year ahead!`,
      isAIGenerated: false,
      celebrations: {
        birthday: true,
        workAnniversary: false
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
    
    // Filter people who have birthdays today
    const celebrationPeople = people.filter(person => {
      const celebrations = isCelebrationDay(person);
      return celebrations.isBirthday;
    });

    const results = [];

    // For each person with a celebration
    for (const person of celebrationPeople) {
      const celebrations = isCelebrationDay(person);
      try {
        console.log('Starting birthday check for:', person.name);
        
        // Get templates for admin emails
        const templatesUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/templates`;
        console.log('Fetching templates from:', templatesUrl);
        const templatesResponse = await fetch(templatesUrl);
        if (!templatesResponse.ok) {
          throw new Error(`Failed to fetch templates: ${templatesResponse.statusText}`);
        }
        
        const templates = await templatesResponse.json();
        if (!Array.isArray(templates) || templates.length === 0) {
          throw new Error('No templates found in database');
        }
        console.log(`Found ${templates.length} templates. Looking for birthday template...`);
        
        // Prioritize birthday celebration as requested
        if (celebrations.isBirthday) {
          console.log('Looking for birthday template');
          const birthdayTemplates = templates.filter((t: any) => t.cardType === 'birthday');
          console.log(`Found ${birthdayTemplates.length} birthday templates`);
          
          if (birthdayTemplates.length === 0) {
            throw new Error('No birthday templates found');
          }
          
          // Use the first birthday template
          const template = birthdayTemplates[0];
          // Generate AI celebration message for the celebrant
          const posterData = await generateCelebrationPoster({
            name: person.name,
            imageUrl: person.photo || '/default-avatar.png'
          });
          const parsedPosterData = JSON.parse(posterData);

          interface TemplateElement {
            type: string;
            text?: string;
            url?: string;
            fontSize?: string;
          }

          // Process template data
          let templateContent = [];

          // Debug complete template information
          console.log('Complete template info:', {
            id: template.id,
            name: template.name,
            type: template.cardType,
            hasUrl: !!template.url,
            hasElements: Array.isArray(template.elements),
            elementsCount: Array.isArray(template.elements) ? template.elements.length : 0,
            elements: Array.isArray(template.elements)
              ? (template.elements as TemplateElement[]).map(el => ({
                  type: el.type,
                  hasText: !!el.text,
                  hasUrl: !!el.url
                }))
              : null
          });
          
          // If template has elements array, use that
          if (template.elements && Array.isArray(template.elements)) {
            templateContent = (template.elements as TemplateElement[]).map(element => {
              if (element.type === 'text' && element.text) {
                return {
                  ...element,
                  text: element.text
                    .replace('{{name}}', person.name)
                    .replace('{{message}}', parsedPosterData.message)
                };
              }
              return element;
            });
          }
          // If template has a URL, create an image element
          else if (template.url) {
            templateContent = [{
              type: 'image',
              url: template.url
            }];
          } else {
            throw new Error('Template has neither elements nor URL');
          }

          await sendBirthdayEmail({
            to: notificationEmail,
            name: person.name,
            posterUrl: JSON.stringify(templateContent),
            celebrations: { isBirthday: true, isWorkAnniversary: false },
            isAdmin: true
          });
      
          // Send celebrant email with AI content
          if (person.email && person.email !== notificationEmail) {
            await sendBirthdayEmail({
              to: person.email,
              name: person.name,
              posterUrl: parsedPosterData.message,
              celebrations: { isBirthday: true, isWorkAnniversary: false },
              isAdmin: false
            });
          }

          results.push({
            name: person.name,
            status: 'success',
            celebrations: {
              birthday: true,
              workAnniversary: false // Don't include work anniversary for now
            },
            isAIGenerated: parsedPosterData.isAIGenerated,
            emailSentTo: notificationEmail
          });
          continue; // Skip to next person after handling birthday
        }
    
        // Skip non-birthday celebrations
        if (!celebrations.isBirthday) {
          continue;
        }
      } catch (error) {
        console.error(`Error processing celebration for ${person.name}:`, error);
        
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          // Handle Resend API error format
          errorMessage = 'error' in error ? (error.error as string) :
                        'message' in error ? (error.message as string) : 'Unknown error';
        }
        
        results.push({
          name: person.name,
          status: 'error',
          error: errorMessage,
          celebrations: {
            birthday: true,
            workAnniversary: false
          }
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
        details: error instanceof Error ? error.message : 'Unknown error',
        aiStatus: isGeminiAvailable() ? 'available' : 'unavailable'
      },
      { status: 500 }
    );
  }
}