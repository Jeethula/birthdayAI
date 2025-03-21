import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET a specific template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Parse elements from string to JSON
    const parsedTemplate = {
      ...template,
      elements:
        typeof template.elements === "string"
          ? JSON.parse(template.elements)
          : template.elements,
    };

    return NextResponse.json(parsedTemplate);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT update a template
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Ensure elements is stored as a JSON string
    const elements =
      typeof body.elements === "string"
        ? body.elements
        : JSON.stringify(body.elements);

    const template = await prisma.template.update({
      where: {
        id: params.id,
      },
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
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE a template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.template.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
