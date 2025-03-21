import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ensure this API route is not statically optimized
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PersonData {
  name: string;
  dateOfBirth: string;
  joiningDate: string;
  imageUrl: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: params.id },
    });
    
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('GET error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Error fetching person: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as PersonData;
    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        name: body.name,
        dateOfBirth: new Date(body.dateOfBirth),
        joiningDate: new Date(body.joiningDate),
        imageUrl: body.imageUrl,
      },
    });
    return NextResponse.json(person);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating person' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if person exists before deleting
    const existingPerson = await prisma.person.findUnique({
      where: { id: params.id },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    await prisma.person.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error deleting person: ${errorMessage}` },
      { status: 500 }
    );
  }
}
