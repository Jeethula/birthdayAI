"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Sparkles, ImageIcon } from "lucide-react";
import { Navbar } from "@/components/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sizePresets = [
  { name: "Portrait Card", width: 720, height: 1280 },
  { name: "Square Card", width: 1080, height: 1080 },
  { name: "Landscape Card", width: 1280, height: 720 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Custom Size", width: 0, height: 0 },
];

export default function GenerateImage() {
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("Portrait Card");
  const [customWidth, setCustomWidth] = useState("720");
  const [customHeight, setCustomHeight] = useState("1280");
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("flux");
  const [error, setError] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [generatedText, setGeneratedText] = useState("");

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = sizePresets.find((p) => p.name === value);
    if (preset) {
      if (preset.name === "Custom Size") {
        setIsCustomSize(true);
      } else {
        setIsCustomSize(false);
        setCustomWidth(preset.width.toString());
        setCustomHeight(preset.height.toString());
      }
    }
  };

  const generateImage = async () => {
    setIsLoading(true);
    setError("");
    setImageSrc(""); // Clear the current image
    setGeneratedText(""); // Clear any previous text

    try {
      if (selectedModel === "flux") {
        const baseUrl = "https://image.pollinations.ai/prompt/";
        const params = new URLSearchParams({
          width: customWidth,
          height: customHeight,
          seed: Math.floor(Math.random() * 1000000).toString(),
          model: "flux",
          token: "desktophut",
          negative_prompt: "worst quality, blurry",
          nologo: "true",
        });

        const encodedPrompt = encodeURIComponent(prompt);
        const url = `${baseUrl}${encodedPrompt}?${params.toString()}`;
        setImageSrc(url); // Set the image source directly
      } else {
        // Include size information in the prompt for Gemini
        const sizeDescription = `The image should be in ${selectedPreset.toLowerCase()} format with dimensions ${customWidth}x${customHeight} pixels.`;
        const enhancedPrompt = `Create a detailed birthday card design: ${prompt}. ${sizeDescription} Make it visually appealing and suitable for a birthday celebration.`;

        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            width: parseInt(customWidth),
            height: parseInt(customHeight),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }

        if (data.error) {
          throw new Error(data.error);
        }

        handleImageResponse(data);
      }
    } catch (err) {
      console.error("Generation error:", err);
      if (err instanceof Error) {
        if (err.message.includes("API_KEY_INVALID")) {
          setError(
            "API configuration error. Please try the Pollinations model instead."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to generate image");
      }
    } finally {
      setIsLoading(false);
    }
  };

  interface ImageResponse {
    imageData?: string;
    imageUrl?: string;
    generatedText?: string;
    fallback?: boolean;
  }

  const handleImageResponse = (data: ImageResponse) => {
    if (data.imageData) {
      // For direct Gemini-generated images
      setImageSrc(`data:image/png;base64,${data.imageData}`);
    } else if (data.imageUrl) {
      // For fallback Pollinations-generated images
      setImageSrc(data.imageUrl);
    }

    if (data.generatedText) {
      setGeneratedText(data.generatedText);
    }

    if (data.fallback) {
      console.log("Using fallback image generation");
    }
  };

  const downloadImage = async () => {
    if (!imageSrc) return;

    try {
      let blob;

      if (imageSrc.startsWith("data:")) {
        // For base64 image data from Gemini
        const base64Data = imageSrc.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);

          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        blob = new Blob(byteArrays, { type: "image/png" });
      } else {
        // For Pollinations image URL
        const response = await fetch(imageSrc);
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birthday-card-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      setError("Failed to download image");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Generate Birthday Card with AI
          </h1>
          <p className="text-gray-600">
            Create personalized birthday cards using AI
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-800 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">Generator</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flux">Pollinations AI (Fast)</SelectItem>
                    <SelectItem value="gemini">Gemini AI (Enhanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Description</Label>
                <Input
                  id="prompt"
                  placeholder={
                    selectedModel === "flux"
                      ? "Describe your birthday card"
                      : "Describe a birthday card design"
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Make card size selection available for both models */}
              <div className="space-y-2">
                <Label>Card Size</Label>
                <Select
                  value={selectedPreset}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizePresets.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isCustomSize && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      min="100"
                      max="2048"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      min="100"
                      max="2048"
                    />
                  </div>
                </div>
              )}

              {selectedModel === "flux" && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <Label>Current Settings</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Width: {customWidth}px</div>
                    <div>Height: {customHeight}px</div>
                    <div>Model: Pollinations AI</div>
                    <div>Quality: Fast</div>
                  </div>
                </div>
              )}

              {selectedModel === "gemini" && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <Label>Current Settings</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Width: {customWidth}px</div>
                    <div>Height: {customHeight}px</div>
                    <div>Model: Gemini AI</div>
                    <div>Enhancement: Enabled</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              <Button
                onClick={generateImage}
                className="w-full bg-blue-800 hover:bg-blue-700"
                disabled={isLoading || !prompt}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-3">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-800 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">Preview</h2>
            </div>

            <div className="bg-blue-50 rounded-lg overflow-hidden relative">
              <div className="w-full h-[400px] flex items-center justify-center p-4">
                {imageSrc ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt="Generated birthday card"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                    <Button
                      className="absolute top-2 right-2 bg-blue-800/90 hover:bg-blue-700 shadow-lg"
                      onClick={downloadImage}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p>Your image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
