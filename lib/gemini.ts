import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
}

// Initialize with API version
const genAI = apiKey ? new GoogleGenerativeAI(apiKey, { apiVersion: "v1" }) : null;

type CelebrationType = 'birthday' | 'anniversary' | 'both';

function getFallbackMessage(name: string, type: CelebrationType): string {
  switch (type) {
    case 'both':
      return `Happy birthday and work anniversary, ${name}!\nWhat a special day to celebrate both occasions!`;
    case 'anniversary':
      return `Happy work anniversary, ${name}!\nThank you for your dedication and contributions!`;
    default:
      return `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`;
  }
}

function getPrompt(name: string, type: CelebrationType): string {
  switch (type) {
    case 'both':
      return `Write a warm, personal 2-line message for ${name} who is celebrating both their birthday and work anniversary today.
      Make it inspiring and mention both occasions. Keep each line short and impactful. Don't use emojis.`;
    case 'anniversary':
      return `Write a warm, personal 2-line work anniversary message for ${name}.
      Make it professional yet warm, mentioning their contributions and growth. Keep each line short and impactful. Don't use emojis.`;
    default:
      return `Write a warm, personal 2-line birthday message for ${name}.
      Make it inspiring and uplifting, mentioning having a great year ahead. Keep each line short and impactful. Don't use emojis.`;
  }
}

export async function generateBirthdayMessage(name: string, type: CelebrationType = 'birthday'): Promise<string> {
  // Temporarily use fallback messages while Gemini API is being set up
  console.log('Using fallback message while Gemini API is being configured');
  return getFallbackMessage(name, type);
}

// Utility function to check if Gemini AI is available
export function isGeminiAvailable(): boolean {
  return !!genAI;
}