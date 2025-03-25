"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  Loader2,
  Search,
  Upload,
  ChevronDown,
  PenTool,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/navbar";

// Optimized canvas size for better display
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 350;

// Types
type Person = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
};

type Element = {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  label: string;
};

type Template = {
  id?: string;
  name: string;
  url: string;
  cardType: string;
  width: number;
  height: number;
  elements: Element[];
};

type CardType = "birthday" | "anniversary";

const FALLBACK_TEMPLATES: Record<CardType, Array<{ id: string; url: string; name: string }>> = {
  birthday: [
    {
      id: "birthday-1",
      url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&h=600",
      name: "Colorful Balloons",
    },
    {
      id: "birthday-2",
      url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&h=600",
      name: "Birthday Cake",
    },
  ],
  anniversary: [
    {
      id: "anniversary-1",
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&h=600",
      name: "Elegant Office",
    },
    {
      id: "anniversary-2",
      url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&h=600",
      name: "Handshake",
    },
  ],
};

function HomePage() {
  // State
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [cardType, setCardType] = useState<CardType>("birthday");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  // Fetch people
  useEffect(() => {
    const fetchPeople = async () => {
      setIsLoadingPeople(true);
      try {
        const response = await fetch("/api/person");
        if (!response.ok) {
          throw new Error("Failed to fetch people");
        }
        const data = await response.json();
        setPeople(data);
      } catch (error) {
        console.error("Error fetching people:", error);
      } finally {
        setIsLoadingPeople(false);
      }
    };
    fetchPeople();
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      const parsedTemplates = data.map((template: any) => {
        // Parse elements if it's a string
        let elements = [];
        try {
          elements = typeof template.elements === 'string'
            ? JSON.parse(template.elements)
            : Array.isArray(template.elements)
              ? template.elements
              : [];
        } catch (error) {
          console.error('Error parsing template elements:', error);
        }

        return {
          ...template,
          elements: elements,
        };
      });

      setTemplates(parsedTemplates || []);
      if (parsedTemplates.length > 0) {
        const defaultTemplate = parsedTemplates.find(
          (t: Template) => t.cardType === cardType
        );
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id || "");
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setSelectedTemplate(FALLBACK_TEMPLATES.birthday[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize default template
  useEffect(() => {
    if (templates.length === 0 && !isLoading) {
      const defaultTemplateId = FALLBACK_TEMPLATES.birthday[0]?.id;
      if (defaultTemplateId) {
        setSelectedTemplate(defaultTemplateId);
      }
    }
  }, [templates, isLoading]);

  // Handle card type change
  function handleCardTypeChange(value: CardType) {
    setCardType(value);
    const templatesOfType = templates.filter((t) => t.cardType === value);
    if (templatesOfType.length > 0) {
      setSelectedTemplate(templatesOfType[0].id || "");
    } else {
      const defaultTemplate = FALLBACK_TEMPLATES[value]?.[0];
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    }
  }

  // Handle select person
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setName(person.name);
    setMessage(
      `Happy ${cardType === "birthday" ? "Birthday" : "Work Anniversary"}, ${
        person.name
      }!`
    );
  };

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasError("Canvas not available");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCanvasError("Could not get canvas context");
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setCanvasError(null);

    let template: any = null;
    if (templates.length > 0) {
      template = templates.find((t) => t.id === selectedTemplate);
    }
    if (!template) {
      const fallbackArray =
        cardType === "birthday"
          ? FALLBACK_TEMPLATES.birthday
          : FALLBACK_TEMPLATES.anniversary;
      template = fallbackArray.find((t) => t.id === selectedTemplate);
    }
    if (!template) {
      setCanvasError("Template not found");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const gradient = ctx.createLinearGradient(
        0,
        CANVAS_HEIGHT / 2,
        0,
        CANVAS_HEIGHT
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (template.elements && template.elements.length > 0) {
        // Scale factor to adjust element positions for the smaller canvas
        const scaleX = CANVAS_WIDTH / (template.width || 800);
        const scaleY = CANVAS_HEIGHT / (template.height || 600);

        template.elements.forEach((element: Element) => {
           if (element.type === "text") {
             // Text setup and alignment
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             
             // Calculate position and size
             const scaledX = CANVAS_WIDTH / 2; // Center horizontally
             const scaledY = element.y * scaleY;
             let scaledFontSize = (element.fontSize || 24) * Math.min(scaleX, scaleY);
             
             // Increase font size for larger text
             if (element.fontSize && element.fontSize >= 36) {
               scaledFontSize *= 1.2; // Make large text 20% bigger
             }

             // Font setup
             ctx.font = `${scaledFontSize}px ${element.fontFamily || "Arial"}`;
             ctx.fillStyle = element.color || "white";

             // Process text content
             let finalText = element.label;
             if (finalText.includes("{{name}}")) {
               finalText = finalText.replace("{{name}}", name || "Recipient Name");
             }
             if (finalText.includes("{{message}}")) {
               finalText = finalText.replace("{{message}}", message || "Your message here");
             }

            // Apply text stroke/shadow
            if (element.strokeColor) {
              // For larger text, increase stroke width
              const strokeWidth = element.fontSize && element.fontSize >= 36
                ? (element.strokeWidth || 2) * 1.5
                : element.strokeWidth || 2;

              ctx.lineWidth = strokeWidth;
              ctx.strokeStyle = element.strokeColor;
              ctx.strokeText(finalText, scaledX, scaledY);
            }

            // Add shadow for better visibility
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = element.fontSize && element.fontSize >= 36 ? 5 : 3;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Draw the text
            ctx.fillText(finalText, scaledX, scaledY);

            // Reset canvas state
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          } else if (
            element.type === "image" &&
            element.label === "Profile Photo"
          ) {
            // Scale dimensions and positions
            const scaledX = element.x * scaleX;
            const scaledY = element.y * scaleY;
            const scaledWidth = (element.width || 150) * scaleX;
            const scaledHeight = (element.height || 150) * scaleY;

            ctx.fillStyle = "#444444";
            ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
            ctx.fillStyle = "#aaaaaa";
            ctx.font = `${12 * Math.min(scaleX, scaleY)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(
              "Profile Photo",
              scaledX + scaledWidth / 2,
              scaledY + scaledHeight / 2
            );
          }
        });
      } else {
        // Improved fallback rendering with better font sizing
        ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(
          name || "Recipient Name",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 20
        );
        ctx.font = "18px 'Segoe UI', Arial, sans-serif";
        ctx.shadowBlur = 3;
        ctx.fillText(
          message || "Your message here",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 20
        );
      }

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    img.onerror = () => {
      setCanvasError("Failed to load template image");
    };

    img.src = template.url;
  };

  useEffect(() => {
    drawCanvas();
  }, [name, message, selectedTemplate, cardType, templates]);

  // Download card
  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasError("Canvas not available");
      return;
    }

    try {
      const link = document.createElement("a");
      link.download = `${cardType}-card-for-${
        name.replace(/\s+/g, "-") || "recipient"
      }.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading card:", error);
      setCanvasError("Failed to download card");
    }
  };

  // Save card
  const handleSaveCard = () => {
    if (!selectedPerson) {
      alert("Please select a recipient first");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Card saved successfully!");
    }, 1000);
  };

  // Filter data
  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = isLoading
    ? []
    : templates.filter((template: Template) => template.cardType === cardType);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Use the shared Navbar component */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-md mr-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Create Your Card
              </h2>
            </div>
            <div className="flex space-x-2 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <PenTool className="w-3.5 h-3.5 mr-1.5" />
                <span className="font-medium">Design Mode</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-150px)]">
            {/* Left sidebar - Card settings */}
            <div className="col-span-12 lg:col-span-4 h-full">
              <Card className="bg-white h-full flex flex-col shadow-md border-gray-200 rounded-xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 flex-shrink-0">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Settings className="w-4 h-4 mr-1.5" />
                    Card Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 py-4 px-4 flex-1 overflow-auto">
                  {/* Card Type */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cardType"
                      className="text-blue-900 font-medium text-sm"
                    >
                      Card Type
                    </Label>
                    <Select
                      value={cardType}
                      onValueChange={handleCardTypeChange}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 h-9 text-sm rounded-lg">
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday Card</SelectItem>
                        <SelectItem value="anniversary">
                          Work Anniversary Card
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Person Selector */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="person"
                      className="text-blue-900 font-medium text-sm"
                    >
                      Recipient
                    </Label>
                    <div className="relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="relative">
                            <Input
                              id="personSearch"
                              placeholder="Search and select recipient..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="border-gray-200 focus:border-blue-500 h-9 text-sm pr-24 rounded-lg"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                              {selectedPerson && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-full mt-1 rounded-lg max-h-[200px] overflow-auto"
                          align="start"
                        >
                          {isLoadingPeople ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            </div>
                          ) : filteredPeople.length > 0 ? (
                            filteredPeople.map((person) => (
                              <DropdownMenuItem
                                key={person.id}
                                onClick={() => handleSelectPerson(person)}
                                className="cursor-pointer text-sm py-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1">
                                    <div className="font-medium">{person.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {person.email}
                                    </div>
                                  </div>
                                  {selectedPerson?.id === person.id && (
                                    <div className="text-blue-600">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No recipients found
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-blue-900 font-medium text-sm"
                    >
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter recipient's name"
                      className="border-gray-200 focus:border-blue-500 h-9 text-sm rounded-lg"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="message"
                      className="text-blue-900 font-medium text-sm"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Write your ${cardType} message...`}
                      className="min-h-[80px] max-h-[120px] border-gray-200 focus:border-blue-500 text-sm resize-none rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right area - with better proportions */}
            <div className="col-span-12 lg:col-span-8 h-full flex flex-col gap-4">
              {/* Template Selection */}
              <div className="h-32">
                <Card className="bg-white shadow-md h-full border-gray-200 rounded-xl overflow-hidden">
                  <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <PenTool className="w-4 h-4 mr-1.5" />
                      Select Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 overflow-hidden h-[calc(100%-46px)]">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 overflow-auto h-full">
                        {filteredTemplates.length > 0
                          ? filteredTemplates.map((template) => (
                              <div
                                key={template.id}
                                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-md ${
                                  selectedTemplate === template.id
                                    ? "border-blue-500 shadow-md"
                                    : "border-gray-200 hover:border-blue-300"
                                }`}
                                onClick={() =>
                                  handleTemplateSelect(template.id || "")
                                }
                              >
                                <div className="aspect-video w-full overflow-hidden">
                                  <img
                                    src={template.url}
                                    alt={template.name}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/800x600?text=Error";
                                    }}
                                  />
                                </div>
                                {selectedTemplate === template.id && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))
                          : (cardType === "birthday"
                              ? FALLBACK_TEMPLATES.birthday
                              : FALLBACK_TEMPLATES.anniversary
                            ).map((template) => (
                              <div
                                key={template.id}
                                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-md ${
                                  selectedTemplate === template.id
                                    ? "border-blue-500 shadow-md"
                                    : "border-gray-200 hover:border-blue-300"
                                }`}
                                onClick={() =>
                                  handleTemplateSelect(template.id)
                                }
                              >
                                <div className="aspect-video w-full overflow-hidden">
                                  <img
                                    src={template.url}
                                    alt={template.name}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                  />
                                </div>
                                {selectedTemplate === template.id && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Card Preview */}
              <Card className="bg-white shadow-md border-gray-200 flex-1 flex flex-col rounded-xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 flex-shrink-0">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <PenTool className="w-4 h-4 mr-1.5" />
                    Card Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col p-0 flex-1 overflow-hidden">
                  <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-3 flex-1 flex justify-center items-center">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      className="max-h-[calc(100%-40px)] object-contain shadow-lg rounded-xl bg-white"
                      style={{ maxWidth: "95%" }}
                    />
                    {canvasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 rounded-xl backdrop-blur-sm">
                        <div className="bg-white p-3 rounded-xl shadow-md text-red-600 max-w-md text-center">
                          <p className="font-medium text-sm">
                            Error Loading Card
                          </p>
                          <p className="text-sm mt-1">{canvasError}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end items-center bg-gradient-to-r from-slate-50 to-indigo-50 py-3 px-4 border-t border-gray-100">
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleDownloadCard}
                        className="border-gray-200 text-blue-700 hover:bg-blue-50 text-sm rounded-lg"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download
                      </Button>
                      <Button
                        onClick={handleSaveCard}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-lg"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1.5" />
                            Save Card
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default HomePage;
