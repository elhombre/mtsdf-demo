/**
 * Loading indicator component
 */

'use client';

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = 'Loading...' }: LoadingIndicatorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/5 backdrop-blur-[1px] pointer-events-none">
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card/90 px-6 py-6 shadow">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">Preparing atlas</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
