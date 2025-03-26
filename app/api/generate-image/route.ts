import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const reqData = await req.json();
    const { prompt, width, height } = reqData;
    
    const imagePrompt = prompt || "Create a 3D birthday card with colorful balloons and confetti";
    console.log(`Requested dimensions: ${width}x${height}`);

    // Use Pollinations.ai for image generation
    const baseUrl = "https://image.pollinations.ai/prompt/";
    const params = new URLSearchParams({
      width: width?.toString() || "1080",
      height: height?.toString() || "1080",
      seed: Math.floor(Math.random() * 1000000).toString(),
      model: "flux",
      nologo: "true",
    });

    const encodedPrompt = encodeURIComponent(imagePrompt);
    const imageUrl = `${baseUrl}${encodedPrompt}?${params.toString()}`;

    return new NextResponse(
      JSON.stringify({
        imageUrl: imageUrl,
        generatedText: imagePrompt,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate image",
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
