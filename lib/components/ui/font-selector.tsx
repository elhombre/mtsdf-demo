/**
 * Font selector component
 */

'use client';

import { useId } from 'react';
import { Label } from '@/lib/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/components/ui/select';

interface Font {
  id: string;
  name: string;
  category: string;
}

interface FontSelectorProps {
  fonts: Font[];
  selectedFont: string;
  onFontChange: (fontId: string) => void;
  disabled?: boolean;
}

export function FontSelector({
  fonts,
  selectedFont,
  onFontChange,
  disabled = false,
}: FontSelectorProps) {
  const selectId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>Font family</Label>
      <Select value={selectedFont} onValueChange={onFontChange} disabled={disabled}>
        <SelectTrigger id={selectId} aria-label="Font family">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {fonts.map((font) => (
              <SelectItem key={font.id} value={font.id}>
                {font.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
