import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all cards
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      include: {
        person: true,
        template: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

// POST create a new card
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const card = await prisma.card.create({
      data: {
        recipientName: body.recipientName,
        message: body.message,
        photoUrl: body.photoUrl,
        cardType: body.cardType,
        imageUrl: body.imageUrl,
        personId: body.personId,
        templateId: body.templateId,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
