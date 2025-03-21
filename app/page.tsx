"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  Loader2,
  Search,
  Home as HomeIcon,
  Upload,
  ChevronDown,
  Gift,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Person type definition
type Person = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
};

// Define Element type according to the #codebase
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

// Define Template type using the structure from your codebase
type Template = {
  id?: string;
  name: string;
  url: string;
  cardType: string;
  width: number;
  height: number;
  elements: Element[];
};

// Sample people data - simplified to minimum
const SAMPLE_PEOPLE: Person[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
  },
];

// Fallback templates in case API fails
const FALLBACK_TEMPLATES = {
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

type CardType = "birthday" | "anniversary";

// Renamed to avoid any naming conflicts with the component
function HomePage() {
  // Basic state
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [cardType, setCardType] = useState<CardType>("birthday");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [canvasError, setCanvasError] = useState<string | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);

  // People state
  const [people] = useState<Person[]>(SAMPLE_PEOPLE);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch templates from backend
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

      // Ensure all templates have properly parsed elements
      const parsedTemplates = data.map((template: any) => ({
        ...template,
        elements: Array.isArray(template.elements)
          ? template.elements
          : typeof template.elements === "string"
          ? JSON.parse(template.elements)
          : [],
      }));

      setTemplates(parsedTemplates || []);

      // Set default template after fetching
      if (parsedTemplates.length > 0) {
        const defaultTemplate = parsedTemplates.find(
          (t) => t.cardType === cardType
        );
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id || "");
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      // Set fallback templates if API fails
      setSelectedTemplate(FALLBACK_TEMPLATES.birthday[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize templates and set default selected template
  useEffect(() => {
    // If no templates are loaded yet (still fetching or first render)
    if (templates.length === 0 && !isLoading) {
      // Use fallback templates
      const defaultTemplateId = FALLBACK_TEMPLATES.birthday[0]?.id;
      if (defaultTemplateId) {
        setSelectedTemplate(defaultTemplateId);
      }
    }
  }, [templates, isLoading]);

  // Handle card type change
  function handleCardTypeChange(value: CardType) {
    setCardType(value);

    // Find a template of the selected type from our fetched templates
    const templatesOfType = templates.filter((t) => t.cardType === value);

    if (templatesOfType.length > 0) {
      setSelectedTemplate(templatesOfType[0].id || "");
    } else {
      // Fallback to hardcoded templates if no templates of this type
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

    // Basic message
    setMessage(
      `Happy ${cardType === "birthday" ? "Birthday" : "Work Anniversary"}, ${
        person.name
      }!`
    );
  };

  // Simple function to draw canvas
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

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setCanvasError(null);

    // Find selected template
    let template: any = null;

    // First try to find it in our backend templates
    if (templates.length > 0) {
      template = templates.find((t) => t.id === selectedTemplate);
    }

    // If not found, fall back to the hardcoded templates
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

    // Draw template background
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Add gradient overlay for better text readability
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

      // Check if the template has elements (from the backend templates)
      if (template.elements && template.elements.length > 0) {
        // Draw elements from the template
        template.elements.forEach((element: Element) => {
          if (element.type === "text") {
            // Handle placeholders
            let textContent = element.label;

            // Replace placeholders with actual values
            if (textContent.includes("{{name}}")) {
              textContent = textContent.replace(
                "{{name}}",
                name || "Recipient Name"
              );
            }
            if (textContent.includes("{{message}}")) {
              textContent = textContent.replace(
                "{{message}}",
                message || "Your message here"
              );
            }

            // Draw text element
            ctx.font = `${element.fontSize || 24}px ${
              element.fontFamily || "Arial"
            }`;
            ctx.fillStyle = element.color || "white";
            ctx.textAlign = "center";

            // Apply shadows if defined
            if (element.strokeColor) {
              ctx.shadowColor = element.strokeColor;
              ctx.shadowBlur = element.strokeWidth || 2;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
            }

            ctx.fillText(textContent, element.x, element.y);

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          } else if (
            element.type === "image" &&
            element.label === "Profile Photo"
          ) {
            // Draw placeholder for profile photo
            ctx.fillStyle = "#444444";
            ctx.fillRect(
              element.x,
              element.y,
              element.width || 150,
              element.height || 150
            );

            // Draw label in center of placeholder
            ctx.fillStyle = "#aaaaaa";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
              "Profile Photo",
              element.x + (element.width || 150) / 2,
              element.y + (element.height || 150) / 2
            );
          }
        });
      } else {
        // Fallback to simple text rendering for templates without elements
        // Draw name with text shadow for better visibility
        ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(
          name || "Recipient Name",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 20
        );

        // Draw message
        ctx.font = "28px 'Segoe UI', Arial, sans-serif";
        ctx.shadowBlur = 4;
        ctx.fillText(
          message || "Your message here",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40
        );
      }

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    img.onerror = () => {
      setCanvasError("Failed to load template image");
    };

    img.src = template.url;
  };

  // Draw canvas when dependencies change
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

  // Save card simulation
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

  // Filter people based on search
  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get templates for the current card type
  const filteredTemplates = isLoading
    ? []
    : templates.filter((template) => template.cardType === cardType);

  // Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-blue-300" />
            <h1 className="text-xl font-bold">
              Card<span className="text-blue-300">Studio</span>
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="/"
              className="flex items-center hover:text-blue-300 transition-colors"
            >
              <HomeIcon className="w-4 h-4 mr-1" />
              <span>Dashboard</span>
            </a>
            <a
              href="/templates"
              className="flex items-center hover:text-blue-300 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-1" />
              <span>Templates</span>
            </a>
            <a
              href="/"
              className="flex items-center hover:text-blue-300 transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              <span>Team</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">
          Create Personalized Cards
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - Card settings */}
          <div className="w-full md:w-1/4 space-y-5">
            <Card className="bg-white shadow-md border-gray-200 overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
                <CardTitle className="text-lg font-medium">
                  Card Settings
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm">
                  Configure your card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Person Selector */}
                <div className="space-y-2">
                  <Label htmlFor="person" className="text-blue-900 font-medium">
                    Recipient
                  </Label>
                  <div className="relative">
                    <Input
                      id="personSearch"
                      placeholder="Search people..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Search className="absolute top-2.5 right-2.5 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="relative mt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {selectedPerson
                            ? selectedPerson.name
                            : "Select a person"}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]" align="start">
                        {filteredPeople.map((person) => (
                          <DropdownMenuItem
                            key={person.id}
                            onClick={() => handleSelectPerson(person)}
                            className="cursor-pointer"
                          >
                            {person.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="cardType"
                    className="text-blue-900 font-medium"
                  >
                    Card Type
                  </Label>
                  <Select value={cardType} onValueChange={handleCardTypeChange}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-900 font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter recipient's name"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-blue-900 font-medium"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Write your ${cardType} message...`}
                    className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Card preview */}
          <div className="w-full md:w-3/4 space-y-5">
            <Card className="bg-white shadow-md border-gray-200 overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
                <CardTitle className="text-lg font-medium">
                  Template Selection
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm">
                  Choose a background for your card
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredTemplates.length > 0
                      ? filteredTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                              selectedTemplate === template.id
                                ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
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
                                    "https://placehold.co/800x600?text=Image+Error";
                                }}
                              />
                            </div>
                            <div className="text-xs p-2 text-center bg-white border-t border-gray-100 font-medium text-gray-700">
                              {template.name}
                            </div>
                            {selectedTemplate === template.id && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md">
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
                        ))
                      : // Fallback to hardcoded templates if no backend templates available
                        (cardType === "birthday"
                          ? FALLBACK_TEMPLATES.birthday
                          : FALLBACK_TEMPLATES.anniversary
                        ).map((template) => (
                          <div
                            key={template.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                              selectedTemplate === template.id
                                ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => handleTemplateSelect(template.id)}
                          >
                            <div className="aspect-video w-full overflow-hidden">
                              <img
                                src={template.url}
                                alt={template.name}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                            </div>
                            <div className="text-xs p-2 text-center bg-white border-t border-gray-100 font-medium text-gray-700">
                              {template.name}
                            </div>
                            {selectedTemplate === template.id && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md">
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
                        ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md border-gray-200 overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
                <CardTitle className="text-lg font-medium">
                  Card Preview
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm">
                  Your personalized card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="relative bg-slate-100 rounded-lg p-1 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto border rounded-lg shadow-md bg-white"
                  />
                  {canvasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 rounded-lg backdrop-blur-sm">
                      <div className="bg-white p-4 rounded-md shadow-lg text-red-600 max-w-md text-center">
                        <p className="font-medium">Error Loading Card</p>
                        <p className="text-sm mt-1">{canvasError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleDownloadCard}
                    className="border-gray-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Card
                  </Button>
                  <Button
                    onClick={handleSaveCard}
                    className="bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Save Card
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-white">
                  CardStudio
                </span>
              </div>
              <p className="text-sm">Create personalized cards for your team</p>
            </div>
            <div className="flex space-x-8">
              <div>
                <h3 className="text-white font-medium mb-2">Features</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      Birthday Cards
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      Anniversary Cards
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      Team Directory
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Company</h3>
                <ul className="text-sm space-y-1">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-300 transition-colors"
                    >
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} CardStudio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export a different name than the file/component to avoid circular reference
export default HomePage;
