import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import ProfilePictureEditor from '@/components/ProfilePictureEditor';

interface OwnerProfileLite {
  coverUrl?: string;
}

interface EditPhotosTabProps {
  ownerProfile?: OwnerProfileLite | null;
  uploadingCover: boolean;
  handleCoverPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sheetOpen: boolean;
}

const EditPhotosTab: React.FC<EditPhotosTabProps> = ({ ownerProfile, uploadingCover, handleCoverPhotoUpload, sheetOpen }) => {
  if (!ownerProfile) {
    return (
      <div className="space-y-4">
        <div className="h-32 w-full rounded-xl bg-stone-100 animate-pulse" />
        <div className="h-48 w-full rounded-xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Photo */}
      <Card className="rounded-xl border border-stone-200 p-5">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-base">Cover Photo</h3>
            <p className="text-xs text-muted-foreground">Upload a banner image for your profile</p>
          </div>

          {ownerProfile.coverUrl && (
            <div className="relative aspect-[3/1] rounded-lg overflow-hidden border border-stone-200">
              <img
                src={ownerProfile.coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={uploadingCover}
              onClick={() => document.getElementById('cover-upload')?.click()}
            >
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {ownerProfile.coverUrl ? 'Change Cover' : 'Upload Cover'}
            </Button>
            <input
              id="cover-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverPhotoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground">Recommended: 1500x500px, Max 2MB (JPEG, PNG, WebP)</p>
        </div>
      </Card>

      {/* Profile Picture Editor */}
      <ProfilePictureEditor parentOpen={sheetOpen} />
    </div>
  );
};

export default EditPhotosTab;
