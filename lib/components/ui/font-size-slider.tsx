/**
 * Font size slider component
 */

'use client';

import { useId } from 'react';
import { Label } from '@/lib/components/ui/label';
import { Slider } from '@/lib/components/ui/slider';

interface FontSizeSliderProps {
  fontSize: number;
  minSize?: number;
  maxSize?: number;
  onFontSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function FontSizeSlider({
  fontSize,
  minSize = 4,
  maxSize = 50,
  onFontSizeChange,
  disabled = false,
}: FontSizeSliderProps) {
  const sliderId = useId();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={sliderId}>Font size</Label>
        <span className="text-sm text-muted-foreground">{fontSize} pt</span>
      </div>
      <Slider
        id={sliderId}
        value={[fontSize]}
        min={minSize}
        max={maxSize}
        step={1}
        aria-label="Font size"
        disabled={disabled}
        onValueChange={(value) => onFontSizeChange(value[0])}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{minSize} pt</span>
        <span>{maxSize} pt</span>
      </div>
    </div>
  );
}
