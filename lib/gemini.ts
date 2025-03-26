import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
}

// Initialize with API version
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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
  if (!genAI) {
    console.warn('Gemini AI not initialized, using fallback message');
    return getFallbackMessage(name, type);
  }

  try {
    // Use the latest model version
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 100,
      },
    });

    const prompt = getPrompt(name, type);

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Split into lines and take first two
    const lines = text.split('\n').filter(line => line.trim());
    const twoLines = lines.slice(0, 2).join('\n');

    return twoLines || getFallbackMessage(name, type);
  } catch (error) {
    console.error('Error generating celebration message:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return getFallbackMessage(name, type);
  }
}

// Utility function to check if Gemini AI is available
export function isGeminiAvailable(): boolean {
  return !!genAI;
}