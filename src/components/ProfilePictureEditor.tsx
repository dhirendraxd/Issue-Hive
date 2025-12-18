import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setDefaultAvatar } from '@/integrations/firebase/profile';
import { DEFAULT_AVATAR_STYLES, getDefaultAvatarUrl } from '@/lib/avatar';
import type { AvatarStyleId } from '@/lib/avatar';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { USER_PROFILE_KEY } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';

interface ProfilePictureEditorProps {
  parentOpen?: boolean;
}

export default function ProfilePictureEditor({ parentOpen = true }: ProfilePictureEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avatarUrl = useAvatarUrl(user?.photoURL, user?.uid || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId | null>(null);

  if (!user) return null;

  const handleSetDefaultAvatar = async (style: AvatarStyleId) => {
    if (!user) return;

    setUploading(true);
    setError(null);

    try {
      logger.debug('Setting default avatar...');
      const avatarUrl = await setDefaultAvatar(user, style);
      
      // Update profile photo in all issues created by this user (optional, don't block)
      logger.debug('Updating issues in background...');
      const { updateUserPhotoInIssues } = await import('@/integrations/firebase/user-sync');
      updateUserPhotoInIssues(user.uid, avatarUrl).catch(err => {
        logger.warn('Failed to update issues:', err);
      });
      
      setSelectedStyle(style);
      toast.success('Profile picture updated!');
      
      // Invalidate queries to refetch updated profile (standardized key)
      await queryClient.invalidateQueries({ queryKey: [USER_PROFILE_KEY, user.uid] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default avatar';
      logger.error('Avatar update error:', err);
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
        {/* Default Avatars Only */}
        <div className="space-y-4">
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
        </div>
      </div>
    </Card>
  );
}
