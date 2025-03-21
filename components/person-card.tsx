import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';

interface Person {
  id: string;
  name: string;
  dateOfBirth: string;
  joiningDate: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

export function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  const [birthdayMessage, setBirthdayMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(false);

  const generateMessage = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: person.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      setBirthdayMessage(data.message);
      setIsAIGenerated(data.isAIGenerated);
      
      if (!data.isAIGenerated) {
        toast.info('Using fallback message as AI generation is unavailable');
      }
    } catch (error) {
      toast.error('Failed to generate birthday message, using fallback');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to check if URL is valid
  const isValidImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Get image URL with fallback
  const getImageUrl = (): string => {
    if (imageError || !isValidImageUrl(person.imageUrl)) {
      return 'https://picsum.photos/300/300';
    }
    return person.imageUrl;
  };

  // Reset image error when URL changes
  const handleImageError = () => {
    setImageError(true);
    toast.error('Failed to load image, using placeholder');
  };

  return (
    <Card className="w-[300px]">
      <CardContent className="pt-4">
        <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
          <Image
            src={getImageUrl()}
            alt={person.name}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized
          />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{person.name}</h3>
          <p className="text-sm text-gray-500">
            DOB: {new Date(person.dateOfBirth).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Joined: {new Date(person.joiningDate).toLocaleDateString()}
          </p>
          {birthdayMessage && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-line">{birthdayMessage}</p>
              {!isAIGenerated && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Note: Using standard message (AI generation unavailable)
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onEdit(person)}>
          Edit
        </Button>
        <Button variant="destructive" onClick={() => onDelete(person.id)}>
          Delete
        </Button>
        <Button 
          variant="secondary" 
          onClick={generateMessage}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : birthdayMessage ? 'Regenerate' : 'Generate'}
        </Button>
      </CardFooter>
    </Card>
  );
}
