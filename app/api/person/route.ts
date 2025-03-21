import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PersonData {
  name: string;
  dateOfBirth: string;
  joiningDate: string;
  imageUrl: string;
}

// Function to validate image URL
function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as PersonData;

    // Validate required fields
    if (!data.name || !data.dateOfBirth || !data.joiningDate || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate image URL
    if (!isValidImageUrl(data.imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL. Must be a valid HTTP/HTTPS URL' },
        { status: 400 }
      );
    }

    // Validate dates
    const dateOfBirth = new Date(data.dateOfBirth);
    const joiningDate = new Date(data.joiningDate);

    if (isNaN(dateOfBirth.getTime()) || isNaN(joiningDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        name: data.name.trim(),
        dateOfBirth,
        joiningDate,
        imageUrl: data.imageUrl,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Error creating person' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(people);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Error fetching people' },
      { status: 500 }
    );
  }
}
