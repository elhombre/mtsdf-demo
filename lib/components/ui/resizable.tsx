/**
 * Resizable panels based on react-resizable-panels (shadcn preset)
 */

'use client';

import * as React from 'react';
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
  <Group className={cn('flex h-full w-full', className)} {...props} />
);

export const ResizablePanel = (props: PanelProps) => <Panel {...props} />;

export const ResizableHandle = ({ className, ...props }: SeparatorProps) => (
  <Separator
    className={cn('w-px bg-border data-[resize-handle-active]:bg-primary', className)}
    {...props}
  />
);
