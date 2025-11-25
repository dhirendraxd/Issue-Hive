import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, Loader2, Check, Scissors } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadProfilePicture, updateUserProfilePicture, setDefaultAvatar } from '@/integrations/firebase/profile';
import { DEFAULT_AVATAR_STYLES, getDefaultAvatarUrl, getUserAvatarUrl } from '@/lib/avatar';
import type { AvatarStyleId } from '@/lib/avatar';
import { toast } from 'sonner';
import ImageCropDialog from './ImageCropDialog';
import { useQueryClient } from '@tanstack/react-query';
import { rateLimits, formatResetTime } from '@/lib/rate-limit';
import { useAvatarUrl } from '@/hooks/use-avatar-url';

export default function ProfilePictureEditor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avatarUrl = useAvatarUrl(user?.photoURL, user?.uid || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId | null>(null);

  if (!user) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (max 1MB for Firestore base64 storage)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 1MB.');
      toast.error('Please choose an image smaller than 1MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImage(croppedBlob);
    // Create preview URL from cropped image
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(croppedUrl);
  };

  const handleUpload = async () => {
    if (!croppedImage || !user) return;

    // Check rate limit
    if (!rateLimits.uploadImage(user.uid)) {
      const resetTime = rateLimits.getResetTime('upload-image', user.uid);
      toast.error(`Rate limit exceeded. Please wait ${formatResetTime(resetTime)} before uploading again.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Convert blob to file
      const file = new File([croppedImage], 'profile.jpg', { type: 'image/jpeg' });
      
      // Upload to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      const downloadURL = await uploadProfilePicture(file, user.uid);
      console.log('Upload complete, URL:', downloadURL);
      
      // Update user profile
      console.log('Updating user profile...');
      await updateUserProfilePicture(user, downloadURL);
      
      // Sync to Firestore users collection
      console.log('Syncing to Firestore...');
      const { syncUserProfile, updateUserPhotoInIssues } = await import('@/integrations/firebase/user-sync');
      await syncUserProfile({ ...user, photoURL: downloadURL });
      
      // Update profile photo in all issues created by this user (optional, don't block)
      console.log('Updating issues in background...');
      updateUserPhotoInIssues(user.uid, downloadURL).catch(err => {
        console.warn('Failed to update issues:', err);
        // Don't fail the whole operation if this fails
      });
      
      toast.success('Profile picture updated!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setCroppedImage(null);
      
      // Invalidate queries to refetch updated profile
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload profile picture';
      console.error('Upload error:', err);
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefaultAvatar = async (style: AvatarStyleId) => {
    if (!user) return;

    setUploading(true);
    setError(null);

    try {
      console.log('Setting default avatar...');
      const avatarUrl = await setDefaultAvatar(user, style);
      
      // Update profile photo in all issues created by this user (optional, don't block)
      console.log('Updating issues in background...');
      const { updateUserPhotoInIssues } = await import('@/integrations/firebase/user-sync');
      updateUserPhotoInIssues(user.uid, avatarUrl).catch(err => {
        console.warn('Failed to update issues:', err);
      });
      
      setSelectedStyle(style);
      toast.success('Profile picture updated!');
      
      // Invalidate queries to refetch updated profile
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default avatar';
      console.error('Avatar update error:', err);
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
      <div className="space-y-6">
        {/* Current Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-2 border-orange-200">
            <AvatarImage src={avatarUrl} alt={user.displayName || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-orange-100 to-amber-100 text-orange-900">
              {user.displayName?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{user.displayName || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs for Upload / Default */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Custom</TabsTrigger>
            <TabsTrigger value="defaults">Choose Default</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="picture">Upload your profile picture</Label>
              <Input
                id="picture"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 1MB. Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="flex flex-col gap-4">
                  <Avatar className="w-32 h-32 border-2 border-orange-300 mx-auto">
                    <AvatarImage src={previewUrl} alt="Preview" />
                  </Avatar>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropDialogOpen(true);
                      }}
                      disabled={uploading}
                      className="rounded-full"
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      Adjust Crop
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Default Avatars Tab */}
          <TabsContent value="defaults" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose from our collection of generated avatars
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEFAULT_AVATAR_STYLES.map(({ id, label, description }) => {
                const avatarUrl = getDefaultAvatarUrl(user.uid, id);
                const isSelected = selectedStyle === id;

                return (
                  <button
                    key={id}
                    onClick={() => handleSetDefaultAvatar(id)}
                    disabled={uploading}
                    className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-300 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-400/20'
                        : 'border-white/40 bg-white/40'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Avatar className="w-full aspect-square mb-2">
                      <AvatarImage src={avatarUrl} alt={label} />
                    </Avatar>
                    <p className="text-xs font-medium text-center truncate">{label}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Crop Dialog */}
        {selectedFile && previewUrl && (
          <ImageCropDialog
            open={cropDialogOpen}
            onClose={() => setCropDialogOpen(false)}
            imageSrc={previewUrl}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </Card>
  );
}
