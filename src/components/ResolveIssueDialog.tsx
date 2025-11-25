import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResolveIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueTitle: string;
  onResolve: (resolution: { message: string; photos: string[] }) => Promise<void>;
  isResolving?: boolean;
}

export default function ResolveIssueDialog({
  open,
  onOpenChange,
  issueTitle,
  onResolve,
  isResolving,
}: ResolveIssueDialogProps) {
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, upload to storage and get URLs
    // For now, create temporary URLs for preview
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!message.trim()) {
      setError('Please provide a resolution message');
      return;
    }

    try {
      await onResolve({ message: message.trim(), photos });
      setMessage('');
      setPhotos([]);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Mark Issue as Resolved
          </DialogTitle>
          <DialogDescription>
            You're resolving: <span className="font-medium text-foreground">{issueTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resolution Message */}
          <div className="space-y-2">
            <Label htmlFor="resolution-message" className="text-sm font-medium">
              Resolution Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="resolution-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe how this issue was resolved, what actions were taken, and any relevant details..."
              className="min-h-[120px] resize-none"
              disabled={isResolving}
            />
            <p className="text-xs text-muted-foreground">
              Required: Explain how the issue was fixed or addressed.
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="resolution-photos" className="text-sm font-medium">
              Photos (Optional)
            </Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="resolution-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                  disabled={isResolving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('resolution-photos')?.click()}
                  disabled={isResolving}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
              </div>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={photo} 
                        alt={`Resolution ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isResolving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload photos showing the resolved state (before/after, completion proof, etc.)
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isResolving || !message.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isResolving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
