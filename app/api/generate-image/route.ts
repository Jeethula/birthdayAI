import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Get API key directly from env each time
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

  try {
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      const { prompt, width, height } = await req.json();
      const imagePrompt =
        prompt ||
        "Create a 3D birthday card with colorful balloons and confetti";

      // Log the dimensions for debugging
      console.log(`Requested dimensions: ${width}x${height}`);

      // Add size context to the model configuration
      // Note: Gemini image generation doesn't directly support specific dimensions,
      // but we can use this information in the prompt
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
      });

      // Generate content with the image prompt
      const response = await model.generateContent(imagePrompt);

      let generatedText = "";
      let imageData = null;

      // Extract the text and image data from the response
      if (response.response?.candidates?.[0]?.content?.parts) {
        for (const part of response.response.candidates[0].content.parts) {
          if (part.text) {
            generatedText = part.text;
          } else if (part.inlineData) {
            imageData = part.inlineData.data;
          }
        }
      }

      if (!imageData) {
        throw new Error("No image generated by Gemini");
      }

      // Return both the base64 image data and any generated text
      return NextResponse.json({
        imageData: imageData, // Base64 encoded image data
        generatedText: generatedText,
      });
    } catch (innerError) {
      console.error("Inner error details:", innerError);

      // If the image generation model isn't available, fallback to text + Pollinations
      // Type check innerError before accessing its properties
      if (
        innerError instanceof Error &&
        (innerError.message.includes("not found") ||
          innerError.message.includes("not supported"))
      ) {
        console.log("Falling back to text generation + Pollinations API");

        try {
          const { prompt } = await req.json();
          const textPrompt =
            prompt || "Generate a description for a birthday card";

          // Use standard text model
          const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          const textResult = await textModel.generateContent(textPrompt);
          const text = textResult.response.text();

          if (!text) {
            throw new Error("No text response from Gemini");
          }

          // Use Pollinations API as fallback for image
          const baseUrl = "https://image.pollinations.ai/prompt/";
          const params = new URLSearchParams({
            width: "1080",
            height: "1080",
            seed: Math.floor(Math.random() * 1000000).toString(),
            model: "flux",
            nologo: "true",
          });

          const enhancedPrompt = encodeURIComponent(text);
          const imageUrl = `${baseUrl}${enhancedPrompt}?${params.toString()}`;

          return NextResponse.json({
            imageUrl: imageUrl,
            generatedText: text,
            fallback: true,
          });
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          return NextResponse.json(
            {
              error: "Error in fallback image generation",
              details:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : "Unknown error",
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error: "Error processing request",
          details:
            innerError instanceof Error ? innerError.message : "Unknown error",
          stack: innerError instanceof Error ? innerError.stack : null,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Outer error in API route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image";
    const errorStack = error instanceof Error ? error.stack : null;

    return NextResponse.json(
      {
        error: errorMessage,
        stack: errorStack,
        note: "Please check server logs for more details",
      },
      { status: 500 }
    );
  }
}
