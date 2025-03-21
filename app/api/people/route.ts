import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all people
export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(people);
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// POST create a new person
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Format dates if they exist
    const dateOfBirth = body.dateOfBirth
      ? new Date(body.dateOfBirth)
      : undefined;
    const dateOfJoining = body.dateOfJoining
      ? new Date(body.dateOfJoining)
      : undefined;

    const person = await prisma.person.create({
      data: {
        name: body.name,
        email: body.email,
        photo: body.photo,
        dateOfBirth,
        dateOfJoining,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}
