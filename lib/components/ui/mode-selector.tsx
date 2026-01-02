/**
 * Visualization mode selector component
 */

'use client';

import { ToggleGroup, ToggleGroupItem } from '@/lib/components/ui/toggle-group';
import { Label } from '@/lib/components/ui/label';

export type VisualizationMode = 'plane' | 'cube';

interface ModeSelectorProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Visualization mode</Label>
      <ToggleGroup
        type="single"
        value={mode}
        aria-label="Visualization mode"
        onValueChange={(value) => value && onModeChange(value as VisualizationMode)}
        className="w-full"
      >
        <ToggleGroupItem value="plane" disabled={disabled}>
          Plane
        </ToggleGroupItem>
        <ToggleGroupItem value="cube" disabled={disabled}>
          Cube
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
