"use client";

import { useState, useEffect, useRef } from "react";
import { PersonForm, PersonFormData } from "@/components/person-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Eye } from "lucide-react";
import Image from "next/image";

interface Person {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  dateOfBirth: string | null;
  dateOfJoining: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    // Filter people based on search term
    const filtered = people.filter((person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPeople(filtered);
    setCurrentPage(0); // Reset to first page when filtering
  }, [searchTerm, people]);

  const fetchPeople = async () => {
    try {
      const response = await fetch("/api/person");
      const data = await response.json();
      setPeople(Array.isArray(data) ? data : []);
      setFilteredPeople(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching people:", error);
      toast.error("Failed to fetch people");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (formData: PersonFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);

      console.log("Form data received:", formData);

      // Improved validation with trimming
      if (
        !formData.name?.trim() ||
        !formData.email?.trim() ||
        !formData.dateOfBirth
      ) {
        console.log("Validation failed:", {
          name: formData.name,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
        });
        setFormError("Name, email, and date of birth are required");
        return;
      }

      let photoData = previewUrl;

      // Use existing photo if no new photo was uploaded
      if (!photoData && editingPerson?.photo) {
        photoData = editingPerson.photo;
      }

      // Ensure dateOfBirth is in the correct format
      let formattedDateOfBirth = formData.dateOfBirth;
      if (formData.dateOfBirth && typeof formData.dateOfBirth === "string") {
        // Make sure we have a valid date
        const dateObj = new Date(formData.dateOfBirth);
        if (!isNaN(dateObj.getTime())) {
          formattedDateOfBirth = dateObj.toISOString();
        } else {
          setFormError("Invalid date format");
          return;
        }
      }

      const dataToSubmit = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        dateOfBirth: formattedDateOfBirth,
        dateOfJoining: formData.dateOfJoining,
        photo: photoData,
      };

      console.log("Submitting data:", dataToSubmit);

      if (editingPerson) {
        const response = await fetch(`/api/person/${editingPerson.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update person");
        }

        toast.success("Person updated successfully");
      } else {
        const response = await fetch("/api/person", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSubmit),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add person");
        }

        toast.success("Person added successfully");
      }

      setIsDialogOpen(false);
      setEditingPerson(null);
      setImageFile(null);
      setPreviewUrl(null);
      fetchPeople();
    } catch (error) {
      console.error("Error saving person:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to save person"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to save person"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFormDataFromPerson = (person: Person): PersonFormData => {
    return {
      name: person.name,
      email: person.email,
      photo: person.photo || undefined,
      dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth) : undefined,
      dateOfJoining: person.dateOfJoining ? new Date(person.dateOfJoining) : undefined,
    };
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setPreviewUrl(person.photo || null);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleView = (person: Person) => {
    setViewingPerson(person);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this person?")) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/person/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete person");
        }

        toast.success("Person deleted successfully");
        fetchPeople();
      } catch (error) {
        console.error("Error deleting person:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete person"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPeople.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />

      <div className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900">
            People Management
          </h1>
          <Button
            onClick={() => {
              setEditingPerson(null);
              setPreviewUrl(null);
              setImageFile(null);
              setFormError(null);
              setIsDialogOpen(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white"
            disabled={isLoading}
          >
            Add Person
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Picture</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Birthdate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className={`h-10 w-10 rounded-full overflow-hidden ${!person.photo ? 'bg-blue-100' : ''} flex items-center justify-center`}>
                          {person.photo ? (
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-700 font-medium">
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{person.name}</div>
                      </TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>
                        {person.dateOfBirth
                          ? new Date(person.dateOfBirth).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {person.dateOfJoining
                          ? new Date(person.dateOfJoining).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(person)}
                            disabled={isLoading}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(person)}
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(person.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No people found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? "Edit Person" : "Add New Person"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-24 w-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-blue-300 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-700 text-xl font-semibold">
                      {editingPerson?.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  className="text-sm text-blue-700 hover:text-blue-900"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {previewUrl ? "Change Image" : "Upload Image"}
                </button>
              </div>

              {formError && (
                <div className="text-red-500 text-sm text-center">
                  {formError}
                </div>
              )}

              <PersonForm
                onSubmit={handleSubmit}
                initialData={editingPerson ? getFormDataFromPerson(editingPerson) : undefined}
                buttonText={editingPerson ? "Update" : "Add"}
                buttonClassName="bg-blue-700 hover:bg-blue-800 text-white w-full"
                isLoading={isLoading}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Person Details</DialogTitle>
            </DialogHeader>

            {viewingPerson && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className={`h-32 w-32 rounded-full overflow-hidden ${!viewingPerson.photo ? 'bg-blue-100' : ''} flex items-center justify-center border-2 border-blue-300`}>
                    {viewingPerson.photo ? (
                      <img
                        src={viewingPerson.photo}
                        alt={viewingPerson.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-700 text-2xl font-semibold">
                        {viewingPerson.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="font-semibold text-blue-900">Name</div>
                  <div className="text-gray-700">{viewingPerson.name}</div>

                  <div className="font-semibold text-blue-900 mt-2">Email</div>
                  <div className="text-gray-700">{viewingPerson.email}</div>

                  <div className="font-semibold text-blue-900 mt-2">
                    Date of Birth
                  </div>
                  <div className="text-gray-700">
                    {viewingPerson.dateOfBirth
                      ? new Date(viewingPerson.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </div>

                  <div className="font-semibold text-blue-900 mt-2">
                    Date of Joining
                  </div>
                  <div className="text-gray-700">
                    {viewingPerson.dateOfJoining
                      ? new Date(
                          viewingPerson.dateOfJoining
                        ).toLocaleDateString()
                      : "Not provided"}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
