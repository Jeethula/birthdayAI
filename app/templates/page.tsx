"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Move,
  Image as ImageIcon,
  Type,
  Upload,
  Sparkles,
  PenTool,
  LayoutTemplate,
  Settings, // Added the missing import
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import toast, { Toaster } from "react-hot-toast";

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

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

const NAME_PLACEHOLDER = "{{name}}";
const MESSAGE_PLACEHOLDER = "{{message}}";

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template>({
    name: "",
    url: "",
    cardType: "birthday",
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    elements: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Redraw canvas whenever template or selected element changes
  useEffect(() => {
    drawCanvas();
  }, [currentTemplate, selectedElement]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Fetch from /api/templates instead of Supabase directly
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();

      // Ensure all templates have properly parsed elements
      const parsedTemplates = data.map((template) => ({
        ...template,
        elements: Array.isArray(template.elements)
          ? template.elements
          : typeof template.elements === "string"
          ? JSON.parse(template.elements)
          : [],
      }));

      setTemplates(parsedTemplates || []);

      // Set first template as current if available and no template is selected
      if (parsedTemplates && parsedTemplates.length > 0 && isCreatingNew) {
        setCurrentTemplate({
          ...parsedTemplates[0],
          elements: Array.isArray(parsedTemplates[0].elements)
            ? parsedTemplates[0].elements
            : [],
        });
        setIsCreatingNew(false);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the drawCanvas function to handle base64 images
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = currentTemplate.width;
    canvas.height = currentTemplate.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background template image if URL exists
    if (currentTemplate.url) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawElements();
      };
      img.onerror = () => {
        // Draw placeholder if image fails to load
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#999999";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Image not available",
          canvas.width / 2,
          canvas.height / 2
        );
        drawElements();
      };
      img.src = currentTemplate.url;
    } else {
      // Draw placeholder for empty template
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawElements();
    }
  };

  const drawElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw all elements
    currentTemplate.elements.forEach((element) => {
      // Highlight selected element
      const isSelected = selectedElement?.id === element.id;

      if (element.type === "text") {
        // Draw text element
        ctx.font = `${element.fontSize || 24}px ${
          element.fontFamily || "Arial"
        }`;

        // Draw stroke if specified
        if (element.strokeColor && element.strokeWidth) {
          ctx.strokeStyle = element.strokeColor;
          ctx.lineWidth = element.strokeWidth;
          ctx.strokeText(element.label, element.x, element.y);
        }

        // Draw text
        ctx.fillStyle = element.color || "#000000";
        ctx.fillText(element.label, element.x, element.y);

        // Draw selection box if selected
        if (isSelected) {
          const metrics = ctx.measureText(element.label);
          const height = element.fontSize || 24;

          ctx.strokeStyle = "#0000ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            element.x - 5,
            element.y - height,
            metrics.width + 10,
            height + 10
          );
        }
      } else if (element.type === "image") {
        // Draw image placeholder
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(
          element.x,
          element.y,
          element.width || 100,
          element.height || 100
        );

        // Draw label in center of placeholder
        ctx.fillStyle = "#666666";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          element.label,
          element.x + (element.width || 100) / 2,
          element.y + (element.height || 100) / 2
        );

        // Reset text alignment
        ctx.textAlign = "left";

        // Draw selection box if selected
        if (isSelected) {
          ctx.strokeStyle = "#0000ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            element.x - 2,
            element.y - 2,
            (element.width || 100) + 4,
            (element.height || 100) + 4
          );
        }
      }
    });
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name || !currentTemplate.url) {
      toast.error("Please provide a template name and image URL");
      return;
    }

    setIsSaving(true);

    try {
      // Prepare the payload - make sure elements is compatible
      const payload = {
        name: currentTemplate.name,
        url: currentTemplate.url,
        cardType: currentTemplate.cardType,
        width: currentTemplate.width,
        height: currentTemplate.height,
        elements: currentTemplate.elements,
      };

      // Save or update template using the API route
      const method = isCreatingNew || !currentTemplate.id ? "POST" : "PUT";
      const url =
        isCreatingNew || !currentTemplate.id
          ? "/api/templates"
          : `/api/templates/${currentTemplate.id}`;

      console.log(`Sending ${method} request to ${url}`, payload);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(
          `Failed to save template: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (isCreatingNew || !currentTemplate.id) {
        toast.success("Template created successfully");

        setCurrentTemplate({
          ...currentTemplate,
          id: data.id,
        });
        setIsCreatingNew(false);
      } else {
        toast.success("Template updated successfully");
      }

      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(
        `Failed to save template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCurrentTemplate({
          ...currentTemplate,
          url: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const [activeTab, setActiveTab] = useState("editor");

  const handleSelectTemplate = (template: Template, switchToEditor = false) => {
    // Make sure elements is properly parsed
    const parsedElements = Array.isArray(template.elements)
      ? template.elements
      : typeof template.elements === "string"
      ? JSON.parse(template.elements)
      : [];

    setCurrentTemplate({
      ...template,
      elements: parsedElements,
    });
    setIsCreatingNew(false);
    setSelectedElement(null);
    
    if (switchToEditor) {
      setActiveTab("editor");
    }
  };

  const handleNewTemplate = () => {
    // Create a new template with default elements for profile photo, name, and message
    const defaultElements: Element[] = [
      {
        id: `element-${Date.now()}-photo`,
        type: "image",
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        label: "Profile Photo",
      },
      {
        id: `element-${Date.now()}-name`,
        type: "text",
        x: DEFAULT_CANVAS_WIDTH / 2, // Center horizontally
        y: 100,
        fontSize: 48, // Larger font for name
        fontFamily: "Arial",
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 2,
        label: "{{name}}",
      },
      {
        id: `element-${Date.now()}-message`,
        type: "text",
        x: DEFAULT_CANVAS_WIDTH / 2, // Center horizontally
        y: 200,
        fontSize: 32, // Larger font for message
        fontFamily: "Arial",
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 2,
        label: "{{message}}",
      },
    ];

    setCurrentTemplate({
      name: "",
      url: "",
      cardType: "birthday",
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      elements: defaultElements,
    });
    setIsCreatingNew(true);
    setSelectedElement(null);
  };

  const handleAddElement = (type: "text" | "image") => {
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type,
      x: 50,
      y: type === "text" ? 50 : 100,
      label: type === "text" ? "Sample Text" : "Photo Placeholder",
      ...(type === "text"
        ? {
            fontSize: 24,
            fontFamily: "Arial",
            color: "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 1,
          }
        : {
            width: 150,
            height: 150,
          }),
    };

    setCurrentTemplate({
      ...currentTemplate,
      elements: [...currentTemplate.elements, newElement],
    });

    setSelectedElement(newElement);
  };

  const handleDeleteElement = () => {
    if (!selectedElement) return;

    setCurrentTemplate({
      ...currentTemplate,
      elements: currentTemplate.elements.filter(
        (el) => el.id !== selectedElement.id
      ),
    });

    setSelectedElement(null);
  };

  const handleElementPropertyChange = (property: string, value: any) => {
    if (!selectedElement) return;

    const updatedElements = currentTemplate.elements.map((element) => {
      if (element.id === selectedElement.id) {
        return { ...element, [property]: value };
      }
      return element;
    });

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements,
    });

    setSelectedElement({
      ...selectedElement,
      [property]: value,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Check if clicked on an element
    for (let i = currentTemplate.elements.length - 1; i >= 0; i--) {
      const element = currentTemplate.elements[i];

      if (element.type === "text") {
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.font = `${element.fontSize || 24}px ${
          element.fontFamily || "Arial"
        }`;
        const metrics = ctx.measureText(element.label);
        const height = element.fontSize || 24;

        if (
          x >= element.x - 5 &&
          x <= element.x + metrics.width + 5 &&
          y >= element.y - height &&
          y <= element.y + 10
        ) {
          setSelectedElement(element);
          setIsDragging(true);
          setDragOffset({ x: x - element.x, y: y - element.y });
          return;
        }
      } else if (element.type === "image") {
        if (
          x >= element.x &&
          x <= element.x + (element.width || 100) &&
          y >= element.y &&
          y <= element.y + (element.height || 100)
        ) {
          setSelectedElement(element);
          setIsDragging(true);
          setDragOffset({ x: x - element.x, y: y - element.y });
          return;
        }
      }
    }

    // If clicked outside any element, deselect
    setSelectedElement(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const newX = Math.max(0, Math.min(x - dragOffset.x, canvas.width - 10));
    const newY = Math.max(
      selectedElement.type === "text" ? selectedElement.fontSize || 24 : 0,
      Math.min(y - dragOffset.y, canvas.height - 10)
    );

    const updatedElements = currentTemplate.elements.map((element) => {
      if (element.id === selectedElement.id) {
        return { ...element, x: newX, y: newY };
      }
      return element;
    });

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements,
    });

    setSelectedElement({
      ...selectedElement,
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDeleteTemplate = async (templateId?: string) => {
    if (!templateId) return;

    if (
      !confirm(
        "Are you sure you want to delete this template? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(
          `Failed to delete template: ${response.status} ${response.statusText}`
        );
      }

      toast.success("Template deleted successfully");

      // Refresh templates list
      fetchTemplates();

      // If the deleted template is the current one, reset to create new template
      if (templateId === currentTemplate.id) {
        handleNewTemplate();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(
        `Failed to delete template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      <Navbar />

      <div className="flex-1 overflow-auto py-4 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-md mr-3">
                <LayoutTemplate className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Template Manager
              </h2>
            </div>
            <div className="flex space-x-2 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <PenTool className="w-3.5 h-3.5 mr-1.5" />
                <span className="font-medium">Design Mode</span>
              </span>
            </div>
          </div>

          <Card className="rounded-xl shadow-md border-gray-200 overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Design Your Template
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={handleNewTemplate}
                  variant="outline"
                  className="bg-blue-700/20 border-blue-400/30 text-white hover:bg-blue-700/30 hover:text-white rounded-lg text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Template
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-xs h-8"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="mb-4 bg-blue-100/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="editor"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700"
                  >
                    Template Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700"
                  >
                    Template Gallery
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-6">
                  <div className="grid md:grid-cols-12 gap-4">
                    {/* Editor controls - takes 4 columns */}
                    <div className="md:col-span-4 space-y-4">
                      <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
                          <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                            <Settings className="w-4 h-4 mr-1.5" />
                            Template Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <Label
                              htmlFor="template-name"
                              className="text-blue-900 font-medium text-sm"
                            >
                              Template Name
                            </Label>
                            <Input
                              id="template-name"
                              value={currentTemplate.name}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter template name"
                              className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="template-url"
                              className="text-blue-900 font-medium text-sm"
                            >
                              Image URL
                            </Label>
                            <Input
                              id="template-url"
                              value={currentTemplate.url}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  url: e.target.value,
                                })
                              }
                              placeholder="Enter image URL"
                              className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="template-image-upload"
                              className="text-blue-900 font-medium text-sm"
                            >
                              Or Upload Image
                            </Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Input
                                id="template-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="flex-1 rounded-lg border-gray-200 focus:border-blue-500 text-sm"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  document
                                    .getElementById("template-image-upload")
                                    ?.click()
                                }
                                className="rounded-lg border-gray-200"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Max size: 1MB. Image will be converted to base64.
                            </p>
                          </div>

                          {currentTemplate.url &&
                            currentTemplate.url.startsWith("data:image") && (
                              <div className="mt-2">
                                <div className="border rounded-lg p-2 bg-gray-50">
                                  <p className="text-xs text-gray-500 mb-2">
                                    Image Preview:
                                  </p>
                                  <img
                                    src={currentTemplate.url}
                                    alt="Template preview"
                                    className="max-h-32 mx-auto object-contain rounded-md"
                                  />
                                </div>
                              </div>
                            )}

                          <div>
                            <Label
                              htmlFor="card-type"
                              className="text-blue-900 font-medium text-sm"
                            >
                              Card Type
                            </Label>
                            <Select
                              value={currentTemplate.cardType}
                              onValueChange={(value) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  cardType: value,
                                })
                              }
                            >
                              <SelectTrigger
                                id="card-type"
                                className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                              >
                                <SelectValue placeholder="Select card type" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg">
                                <SelectItem value="birthday">
                                  Birthday
                                </SelectItem>
                                <SelectItem value="anniversary">
                                  Work Anniversary
                                </SelectItem>
                                {/* <SelectItem value="holiday">Holiday</SelectItem>
                                <SelectItem value="congratulations">
                                  Congratulations
                                </SelectItem>
                                <SelectItem value="custom">Custom</SelectItem> */}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="canvas-width"
                                className="text-blue-900 font-medium text-sm"
                              >
                                Width (px)
                              </Label>
                              <Input
                                id="canvas-width"
                                type="number"
                                value={currentTemplate.width}
                                onChange={(e) =>
                                  setCurrentTemplate({
                                    ...currentTemplate,
                                    width:
                                      parseInt(e.target.value) ||
                                      DEFAULT_CANVAS_WIDTH,
                                  })
                                }
                                className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="canvas-height"
                                className="text-blue-900 font-medium text-sm"
                              >
                                Height (px)
                              </Label>
                              <Input
                                id="canvas-height"
                                type="number"
                                value={currentTemplate.height}
                                onChange={(e) =>
                                  setCurrentTemplate({
                                    ...currentTemplate,
                                    height:
                                      parseInt(e.target.value) ||
                                      DEFAULT_CANVAS_HEIGHT,
                                  })
                                }
                                className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                              <PenTool className="w-4 h-4 mr-1.5" />
                              Elements
                            </CardTitle>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddElement("text")}
                                className="h-7 px-2 text-xs rounded-lg border-gray-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Type className="w-3 h-3 mr-1" />
                                Add Text
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddElement("image")}
                                className="h-7 px-2 text-xs rounded-lg border-gray-200 text-blue-700 hover:bg-blue-50"
                              >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Add Image
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {currentTemplate.elements.map((element) => (
                              <div
                                key={element.id}
                                className={`p-2 border rounded-lg cursor-pointer flex justify-between items-center ${
                                  selectedElement?.id === element.id
                                    ? "bg-blue-100 border-blue-300"
                                    : "hover:bg-blue-50 border-gray-200"
                                }`}
                                onClick={() => setSelectedElement(element)}
                              >
                                <div className="flex items-center">
                                  {element.type === "text" ? (
                                    <Type className="w-3.5 h-3.5 mr-2 text-blue-700" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 mr-2 text-blue-700" />
                                  )}
                                  <span className="truncate text-sm">
                                    {element.label || element.type}
                                  </span>
                                </div>
                                <Move className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                            ))}
                            {currentTemplate.elements.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No elements added yet
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Element properties panel */}
                      {selectedElement && (
                        <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden">
                          <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                                <Settings className="w-4 h-4 mr-1.5" />
                                Element Properties
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleDeleteElement}
                                className="h-7 px-2 text-xs rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <Label
                                htmlFor="element-label"
                                className="text-blue-900 font-medium text-sm"
                              >
                                Label{" "}
                                {selectedElement.type === "text" && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Use {NAME_PLACEHOLDER} or{" "}
                                    {MESSAGE_PLACEHOLDER} for dynamic content)
                                  </span>
                                )}
                                {selectedElement.type === "image" &&
                                  selectedElement.label === "Profile Photo" && (
                                    <span className="text-xs text-blue-500 ml-1">
                                      (This will display the person's profile
                                      photo)
                                    </span>
                                  )}
                              </Label>
                              <Input
                                id="element-label"
                                value={selectedElement.label}
                                onChange={(e) =>
                                  handleElementPropertyChange(
                                    "label",
                                    e.target.value
                                  )
                                }
                                className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="element-x"
                                  className="text-blue-900 font-medium text-sm"
                                >
                                  X Position
                                </Label>
                                <Input
                                  id="element-x"
                                  type="number"
                                  value={selectedElement.x}
                                  onChange={(e) =>
                                    handleElementPropertyChange(
                                      "x",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="element-y"
                                  className="text-blue-900 font-medium text-sm"
                                >
                                  Y Position
                                </Label>
                                <Input
                                  id="element-y"
                                  type="number"
                                  value={selectedElement.y}
                                  onChange={(e) =>
                                    handleElementPropertyChange(
                                      "y",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {selectedElement.type === "text" && (
                              <>
                                <div>
                                  <Label
                                    htmlFor="element-font-size"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Font Size
                                  </Label>
                                  <Input
                                    id="element-font-size"
                                    type="number"
                                    value={selectedElement.fontSize || 24}
                                    onChange={(e) =>
                                      handleElementPropertyChange(
                                        "fontSize",
                                        parseInt(e.target.value) || 24
                                      )
                                    }
                                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <Label
                                    htmlFor="element-font-family"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Font Family
                                  </Label>
                                  <Select
                                    value={
                                      selectedElement.fontFamily || "Arial"
                                    }
                                    onValueChange={(value) =>
                                      handleElementPropertyChange(
                                        "fontFamily",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      id="element-font-family"
                                      className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                    >
                                      <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                      <SelectItem value="Arial">
                                        Arial
                                      </SelectItem>
                                      <SelectItem value="Helvetica">
                                        Helvetica
                                      </SelectItem>
                                      <SelectItem value="Times New Roman">
                                        Times New Roman
                                      </SelectItem>
                                      <SelectItem value="Courier New">
                                        Courier New
                                      </SelectItem>
                                      <SelectItem value="Georgia">
                                        Georgia
                                      </SelectItem>
                                      <SelectItem value="Verdana">
                                        Verdana
                                      </SelectItem>
                                      <SelectItem value="Impact">
                                        Impact
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label
                                    htmlFor="element-color"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Text Color
                                  </Label>
                                  <div className="flex mt-1">
                                    <Input
                                      id="element-color"
                                      type="color"
                                      value={selectedElement.color || "#ffffff"}
                                      onChange={(e) =>
                                        handleElementPropertyChange(
                                          "color",
                                          e.target.value
                                        )
                                      }
                                      className="w-12 p-1 mr-2 rounded-lg border-gray-200"
                                    />
                                    <Input
                                      type="text"
                                      value={selectedElement.color || "#ffffff"}
                                      onChange={(e) =>
                                        handleElementPropertyChange(
                                          "color",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 rounded-lg border-gray-200 focus:border-blue-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label
                                    htmlFor="element-stroke-color"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Stroke Color
                                  </Label>
                                  <div className="flex mt-1">
                                    <Input
                                      id="element-stroke-color"
                                      type="color"
                                      value={
                                        selectedElement.strokeColor || "#000000"
                                      }
                                      onChange={(e) =>
                                        handleElementPropertyChange(
                                          "strokeColor",
                                          e.target.value
                                        )
                                      }
                                      className="w-12 p-1 mr-2 rounded-lg border-gray-200"
                                    />
                                    <Input
                                      type="text"
                                      value={
                                        selectedElement.strokeColor || "#000000"
                                      }
                                      onChange={(e) =>
                                        handleElementPropertyChange(
                                          "strokeColor",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 rounded-lg border-gray-200 focus:border-blue-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label
                                    htmlFor="element-stroke-width"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Stroke Width
                                  </Label>
                                  <Input
                                    id="element-stroke-width"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={selectedElement.strokeWidth || 1}
                                    onChange={(e) =>
                                      handleElementPropertyChange(
                                        "strokeWidth",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                  />
                                </div>
                              </>
                            )}

                            {selectedElement.type === "image" && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label
                                    htmlFor="element-width"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Width
                                  </Label>
                                  <Input
                                    id="element-width"
                                    type="number"
                                    value={selectedElement.width || 150}
                                    onChange={(e) =>
                                      handleElementPropertyChange(
                                        "width",
                                        parseInt(e.target.value) || 150
                                      )
                                    }
                                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor="element-height"
                                    className="text-blue-900 font-medium text-sm"
                                  >
                                    Height
                                  </Label>
                                  <Input
                                    id="element-height"
                                    type="number"
                                    value={selectedElement.height || 150}
                                    onChange={(e) =>
                                      handleElementPropertyChange(
                                        "height",
                                        parseInt(e.target.value) || 150
                                      )
                                    }
                                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Canvas preview - takes 8 columns */}
                    <div className="md:col-span-8">
                      <Card className="rounded-xl shadow-md h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 flex-shrink-0">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <LayoutTemplate className="w-4 h-4 mr-1.5" />
                            Template Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 flex-1 overflow-hidden">
                          <p className="text-sm text-blue-700 mb-2 font-medium">
                            Click and drag elements to reposition them
                          </p>
                          <div className="overflow-auto flex items-center justify-center h-[calc(100%-30px)]">
                            <canvas
                              ref={canvasRef}
                              className="border shadow-md rounded-lg"
                              style={{
                                width: "100%",
                                height: "auto",
                                maxHeight: "70vh",
                                maxWidth: "95%",
                              }}
                              onClick={handleCanvasClick}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="list">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <Card className="rounded-xl shadow-md border-gray-200 overflow-hidden">
                      <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                          <LayoutTemplate className="w-4 h-4 mr-1.5" />
                          Available Templates
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Dimensions</TableHead>
                              <TableHead className="w-24">Elements</TableHead>
                              <TableHead>Preview</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templates.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-8"
                                >
                                  No templates found. Create your first
                                  template!
                                </TableCell>
                              </TableRow>
                            ) : (
                              templates.map((template) => (
                                <TableRow key={template.id}>
                                  <TableCell className="font-medium">
                                    {template.name}
                                  </TableCell>
                                  <TableCell>
                                    <span className="capitalize">
                                      {template.cardType}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {template.width} × {template.height}
                                  </TableCell>
                                  <TableCell>
                                    {template.elements?.length || 0}
                                  </TableCell>
                                  <TableCell>
                                    <div className="w-24 h-16 overflow-hidden rounded-lg border border-gray-200">
                                      <img
                                        src={template.url}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://placehold.co/100x60?text=No+Image";
                                        }}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "100%",
                                        }}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleSelectTemplate(template, true)
                                        }
                                        className="rounded-lg border-gray-200 text-blue-700 hover:bg-blue-50 text-xs"
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          handleDeleteTemplate(template.id)
                                        }
                                        className="rounded-lg text-xs"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-900 text-gray-400 py-1.5 text-xs text-center">
        <span>
          © {new Date().getFullYear()} CardStudio • Professional Card Maker
        </span>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
