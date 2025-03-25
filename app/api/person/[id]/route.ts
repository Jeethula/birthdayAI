import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to the JSON file
const dataFilePath = path.join(process.cwd(), "data", "people.json");

// Helper to read people data
const getPeopleData = () => {
  const data = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(data);
};

// Helper to write people data
const writePeopleData = (data: any[]) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

// Ensure this API route is not statically optimized
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Get a single person
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const people = getPeopleData();
    const person = people.find((p) => p.id === params.id);

    if (!person) {
      return NextResponse.json(
        { message: "Person not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { message: "Failed to fetch person" },
      { status: 500 }
    );
  }
}

// Update a person
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.birthdate) {
      return NextResponse.json(
        { message: "Name, email, and birthdate are required" },
        { status: 400 }
      );
    }

    const people = getPeopleData();
    const index = people.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { message: "Person not found" },
        { status: 404 }
      );
    }

    // Update the person
    const updatedPerson = {
      ...people[index],
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      birthdate: data.birthdate,
      notes: data.notes || null,
      image: data.image || null,
      updatedAt: new Date().toISOString(),
    };

    people[index] = updatedPerson;
    writePeopleData(people);

    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { message: "Failed to update person" },
      { status: 500 }
    );
  }
}

// Delete a person
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const people = getPeopleData();
    const index = people.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { message: "Person not found" },
        { status: 404 }
      );
    }

    // Delete the person
    people.splice(index, 1);
    writePeopleData(people);

    return NextResponse.json({ message: "Person deleted successfully" });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { message: "Failed to delete person" },
      { status: 500 }
    );
  }
}
