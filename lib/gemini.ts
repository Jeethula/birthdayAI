import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateBirthdayMessage(name: string): Promise<string> {
  if (!genAI) {
    console.warn('Gemini AI not initialized, using fallback message');
    return `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    const prompt = `Write a warm, personal 2-line birthday message for ${name}.
    Make it inspiring and uplifting, mentioning having a great year ahead.
    Keep each line short and impactful. Don't include any emojis.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Split into lines and take first two
    const lines = text.split('\n').filter(line => line.trim());
    const twoLines = lines.slice(0, 2).join('\n');

    return twoLines || `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`;
  } catch (error) {
    console.error('Error generating birthday message:', error);
    return `Happy birthday, ${name}!\nWishing you a wonderful year ahead!`;
  }
}

// Utility function to check if Gemini AI is available
export function isGeminiAvailable(): boolean {
  return !!genAI;
}