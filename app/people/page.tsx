'use client';

import { useState, useEffect } from 'react';
import { PersonForm, PersonFormData } from '@/components/person-form';
import { PersonCard } from '@/components/person-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
interface Person extends PersonFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/person');
      const data = await response.json();
      // Ensure data is an array before setting it
      setPeople(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch people');
    }
  };

  const handleSubmit = async (formData: PersonFormData) => {
    try {
      if (editingPerson) {
        await fetch(`/api/person/${editingPerson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Person updated successfully');
      } else {
        await fetch('/api/person', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Person added successfully');
      }
      setIsDialogOpen(false);
      setEditingPerson(null);
      fetchPeople();
    } catch (error) {
      toast.error('Failed to save person');
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/person/${id}`, {
        method: 'DELETE',
      });
      toast.success('Person deleted successfully');
      fetchPeople();
    } catch (error) {
      toast.error('Failed to delete person');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">People Management</h1>
        <button
          onClick={() => {
            setEditingPerson(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Add Person
        </button>
      </div>

      <div className="mb-8">
        <Select
          value={selectedPerson}
          onValueChange={setSelectedPerson}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {(people || []).map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedPerson
          ? (people || []).filter((person) => person.id === selectedPerson)
              .map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
          : (people || []).map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? 'Edit Person' : 'Add New Person'}
            </DialogTitle>
          </DialogHeader>
          <PersonForm
            onSubmit={handleSubmit}
            initialData={editingPerson || undefined}
            buttonText={editingPerson ? 'Update' : 'Add'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
