import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PersonFormProps {
  onSubmit: (data: PersonFormData) => void;
  initialData?: PersonFormData;
  buttonText?: string;
}

export interface PersonFormData {
  name: string;
  dateOfBirth: string;
  joiningDate: string;
  imageUrl: string;
}

export function PersonForm({ onSubmit, initialData, buttonText = 'Submit' }: PersonFormProps) {
  const [formData, setFormData] = useState<PersonFormData>(
    initialData || {
      name: '',
      dateOfBirth: '',
      joiningDate: '',
      imageUrl: '',
    }
  );
  const [urlError, setUrlError] = useState('');

  // Function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    if (!url) {
      setUrlError('');
    } else if (!isValidImageUrl(url)) {
      setUrlError('Please enter a valid HTTP/HTTPS URL');
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.dateOfBirth || !formData.joiningDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate image URL
    if (!formData.imageUrl) {
      toast.error('Please provide an image URL');
      return;
    }

    if (!isValidImageUrl(formData.imageUrl)) {
      toast.error('Please enter a valid image URL (must start with http:// or https://)');
      return;
    }

    // Validate dates
    const dob = new Date(formData.dateOfBirth);
    const joinDate = new Date(formData.joiningDate);

    if (isNaN(dob.getTime()) || isNaN(joinDate.getTime())) {
      toast.error('Please enter valid dates');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter name"
          required
        />
      </div>
      <div>
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="joiningDate">Joining Date</Label>
        <Input
          id="joiningDate"
          type="date"
          value={formData.joiningDate}
          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Enter image URL (https://...)"
          className={urlError ? 'border-red-500' : ''}
          required
        />
        {urlError && (
          <p className="text-sm text-red-500 mt-1">{urlError}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Must be a valid HTTP/HTTPS URL pointing to an image
        </p>
      </div>
      <Button type="submit" className="w-full">
        {buttonText}
      </Button>
    </form>
  );
}
