import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Upload, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface AddProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueTitle: string;
  onAddProgress: (data: { message: string; photos?: string[] }) => void;
  isAdding?: boolean;
}

export default function AddProgressDialog({
  open,
  onOpenChange,
  issueTitle,
  onAddProgress,
  isAdding = false,
}: AddProgressDialogProps) {
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limit to 4 photos total
    if (photos.length + files.length > 4) {
      toast.error('Maximum 4 photos allowed');
      return;
    }

    const newPhotos: string[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === files.length) {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error('Please provide a progress update message');
      return;
    }

    const data: { message: string; photos?: string[] } = {
      message: message.trim(),
    };

    if (photos.length > 0) {
      data.photos = photos;
    }

    onAddProgress(data);
  };

  const handleClose = () => {
    if (!isAdding) {
      setMessage('');
      setPhotos([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Add Progress Update
          </DialogTitle>
          <DialogDescription>
            Share an update on the progress of "{issueTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Message */}
          <div className="space-y-2">
            <Label htmlFor="progress-message" className="text-sm font-medium">
              Progress Update <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="progress-message"
              placeholder="Describe what progress has been made on this issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isAdding}
            />
            <p className="text-xs text-muted-foreground">
              Explain what steps have been taken or what changes have been made
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="progress-photos" className="text-sm font-medium">
              Photos (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={photos.length >= 4 || isAdding}
                onClick={() => document.getElementById('progress-photos')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos ({photos.length}/4)
              </Button>
              <input
                id="progress-photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoAdd}
                disabled={isAdding}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Add up to 4 photos showing the progress
            </p>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Progress ${index + 1}`}
                      className="w-full h-32 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      disabled={isAdding}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      title="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isAdding || !message.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isAdding ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                Adding...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Add Progress
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
