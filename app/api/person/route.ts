import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get all people
export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { message: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// Create a new person
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name?.trim() || !data.email?.trim() || !data.dateOfBirth) {
      return NextResponse.json(
        { message: "Name, email, and date of birth are required" },
        { status: 400 }
      );
    }

    // Create the person
    const person = await prisma.person.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        photo: data.photo || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { message: "Failed to create person" },
      { status: 500 }
    );
  }
}
