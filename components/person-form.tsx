import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export interface PersonFormData {
  name: string;
  email: string;
  photo?: string;
  dateOfBirth?: Date | string;
  dateOfJoining?: Date | string;
}

interface PersonFormProps {
  onSubmit: (data: PersonFormData) => void;
  initialData?: PersonFormData;
  buttonText?: string;
  buttonClassName?: string;
  isLoading?: boolean;
}

export function PersonForm({
  onSubmit,
  initialData,
  buttonText = "Submit",
  buttonClassName = "",
  isLoading = false,
}: PersonFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");

      if (initialData.dateOfBirth) {
        if (typeof initialData.dateOfBirth === "string") {
          // Convert to YYYY-MM-DD for the date input
          const date = new Date(initialData.dateOfBirth);
          setDateOfBirth(format(date, "yyyy-MM-dd"));
        } else {
          setDateOfBirth(format(initialData.dateOfBirth, "yyyy-MM-dd"));
        }
      }

      if (initialData.dateOfJoining) {
        if (typeof initialData.dateOfJoining === "string") {
          const date = new Date(initialData.dateOfJoining);
          setDateOfJoining(format(date, "yyyy-MM-dd"));
        } else {
          setDateOfJoining(format(initialData.dateOfJoining, "yyyy-MM-dd"));
        }
      }
    }
  }, [initialData]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !dateOfBirth) {
      alert("Name, email, and date of birth are required");
      return;
    }

    const formData: PersonFormData = {
      name: name.trim(),
      email: email.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
    };

    console.log("Form data to submit:", formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          max={new Date().toISOString().split("T")[0]} // Prevent future dates
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfJoining">Date of Joining</Label>
        <Input
          id="dateOfJoining"
          type="date"
          value={dateOfJoining}
          onChange={(e) => setDateOfJoining(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className={buttonClassName}
        disabled={isLoading || !name.trim() || !email.trim() || !dateOfBirth}
      >
        {isLoading ? "Loading..." : buttonText}
      </Button>
    </form>
  );
}
