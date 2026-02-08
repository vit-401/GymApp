/**
 * @file Exercise create/edit form dialog.
 *
 * Business context:
 * - Used by ExerciseList to add new exercises or edit existing ones.
 * - Collects: name, muscle group (dropdown), weight type (dropdown), optional image.
 * - Images are resized client-side to max 200px and stored as base64 data URLs
 *   to keep localStorage footprint small.
 * - Pre-fills with existing data when `initial` prop is provided (edit mode).
 * - Resets form fields after successful add (but not after edit).
 */

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ImagePlus } from 'lucide-react';
import type { Exercise, MuscleGroup, WeightType } from '@/types';
import { MUSCLE_GROUP_LABELS, WEIGHT_TYPE_LABELS } from '@/types';

/** All available muscle groups for the dropdown */
const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
/** All available weight types for the dropdown */
const WEIGHT_TYPES = Object.keys(WEIGHT_TYPE_LABELS) as WeightType[];

interface ExerciseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback with form data (without ID) — parent handles store mutation */
  onSubmit: (data: Omit<Exercise, 'id'>) => void;
  /** If provided, form enters edit mode with pre-filled values */
  initial?: Exercise;
}

export function ExerciseForm({ open, onOpenChange, onSubmit, initial }: ExerciseFormProps) {
  /* Form state — initialized from `initial` (edit mode) or defaults (add mode) */
  const [name, setName] = useState(initial?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initial?.muscleGroup ?? 'chest');
  const [weightType, setWeightType] = useState<WeightType>(initial?.weightType ?? 'dumbbell');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Handle image upload: read file, resize to max 200px, convert to base64 JPEG.
   * This keeps localStorage usage reasonable since images are stored inline.
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let w = img.width;
        let h = img.height;
        // Scale down proportionally to fit within maxSize
        if (w > h) {
          if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        } else {
          if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality JPEG
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /** Validate and submit form data, then reset fields if in add mode */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return; // Name is required
    onSubmit({ name: name.trim(), muscleGroup, weightType, imageUrl });
    onOpenChange(false);
    // Reset form only when adding new (not editing existing)
    if (!initial) {
      setName('');
      setImageUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Exercise' : 'Add Exercise'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Update exercise details' : 'Create a new exercise for your library'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          {/* Image upload thumbnail + name input side by side */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border shrink-0 hover:border-primary transition-colors"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lat Pulldown"
                autoFocus
              />
            </div>
            {/* Hidden file input triggered by the thumbnail button */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Muscle group dropdown */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Muscle Group</label>
            <Select value={muscleGroup} onValueChange={(v) => setMuscleGroup(v as MuscleGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((mg) => (
                  <SelectItem key={mg} value={mg}>
                    {MUSCLE_GROUP_LABELS[mg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight type dropdown */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Weight Type</label>
            <Select value={weightType} onValueChange={(v) => setWeightType(v as WeightType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_TYPES.map((wt) => (
                  <SelectItem key={wt} value={wt}>
                    {WEIGHT_TYPE_LABELS[wt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="mt-1">
            {initial ? 'Save Changes' : 'Add Exercise'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
