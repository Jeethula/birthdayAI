import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("API key length:", apiKey ? apiKey.length : 0);
    console.log(
      "API key first 4 chars:",
      apiKey ? apiKey.substring(0, 4) : "none"
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const reqData = await req.json();
    const { prompt, width, height } = reqData;
    
    const imagePrompt =
      prompt ||
      "Create a 3D birthday card with colorful balloons and confetti";

    console.log(`Requested dimensions: ${width}x${height}`);

    try {
      // Use Gemini Pro to enhance the prompt
      const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      const textResult = await withTimeout(
        textModel.generateContent(imagePrompt),
        30000 // 30 second timeout for text
      );
      const enhancedPrompt = textResult.response.text();

      if (!enhancedPrompt) {
        throw new Error("No text response from Gemini");
      }

      // Use Pollinations.ai for image generation
      const baseUrl = "https://image.pollinations.ai/prompt/";
      const params = new URLSearchParams({
        width: width?.toString() || "1080",
        height: height?.toString() || "1080",
        seed: Math.floor(Math.random() * 1000000).toString(),
        model: "flux",
        nologo: "true",
      });

      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imageUrl = `${baseUrl}${encodedPrompt}?${params.toString()}`;

      return new NextResponse(
        JSON.stringify({
          imageUrl: imageUrl,
          generatedText: enhancedPrompt,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error("Generation error:", error);

      // Check for timeout
      if (error instanceof Error && error.message.includes("timed out")) {
        return new NextResponse(
          JSON.stringify({
            error: "Image generation timed out. Please try again.",
            details: error.message,
          }),
          {
            status: 504,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // General error handling
      return new NextResponse(
        JSON.stringify({
          error: "Failed to generate image",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error("Outer error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
