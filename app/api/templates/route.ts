import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Adjust your API config to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

// GET all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Parse elements from string to JSON for each template
    const parsedTemplates = templates.map((template) => {
      let parsedElements = [];

      try {
        parsedElements =
          typeof template.elements === "string"
            ? JSON.parse(template.elements)
            : template.elements;
      } catch (error) {
        console.error(
          `Error parsing elements for template ${template.id}:`,
          error
        );
        parsedElements = [];
      }

      return {
        ...template,
        elements: parsedElements,
      };
    });

    return NextResponse.json(parsedTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST create a new template
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure elements is stored as a JSON string
    const elements =
      typeof body.elements === "string"
        ? body.elements
        : JSON.stringify(body.elements);

    const template = await prisma.template.create({
      data: {
        name: body.name,
        url: body.url,
        cardType: body.cardType,
        width: body.width || 800,
        height: body.height || 600,
        elements: elements,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
