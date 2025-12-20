import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Image, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newStatus: 'received' | 'in_progress' | 'resolved';
  onSubmit: (message: string, photos: string[]) => Promise<void>;
}

export default function StatusUpdateDialog({
  open,
  onOpenChange,
  newStatus,
  onSubmit,
}: StatusUpdateDialogProps) {
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusLabels = {
    received: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  const statusColors = {
    received: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setPhotos((prev) => [...prev, base64]);
        };
        
        reader.readAsDataURL(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!message.trim() && photos.length === 0) {
      alert('Please add a message or at least one image');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(message, photos);
      setMessage('');
      setPhotos([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Status to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">{statusLabels[newStatus]}</span></DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Info */}
          <div className={`rounded-lg border p-3 ${statusColors[newStatus]}`}>
            <p className="text-sm font-medium">
              You are changing the issue status to <strong>{statusLabels[newStatus]}</strong>
            </p>
          </div>

          {/* Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Share an update about this status change with others. This will be visible in the issue timeline.
            </AlertDescription>
          </Alert>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Message</label>
            <Textarea
              placeholder={`What's the status update? e.g., "We've started working on this issue..." or "This has been resolved!"`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-32 resize-none"
            />
            <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Photos (Optional)</label>
            <div className="border-2 border-dashed border-orange-200 rounded-lg p-4 hover:bg-orange-50/30 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Image className="h-8 w-8 text-orange-400" />
                <span className="text-sm text-muted-foreground">Click to upload photos</span>
                <span className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</span>
              </label>
            </div>
          </div>

          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Photos ({photos.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-orange-200"
                    />
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-amber-500"
            onClick={handleSubmit}
            disabled={isSubmitting || (message.length === 0 && photos.length === 0)}
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
