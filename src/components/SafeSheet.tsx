import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface SafeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

class SheetErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SafeSheet] Portal error caught:', error, info);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return null; // Suppress error display, just close gracefully
    }
    return this.props.children;
  }
}

export default function SafeSheet({ open, onOpenChange, children }: SafeSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetErrorBoundary onError={() => onOpenChange(false)}>
        {children}
      </SheetErrorBoundary>
    </Sheet>
  );
}
