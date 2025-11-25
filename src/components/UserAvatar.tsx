import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { getUserAvatarUrl } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  photoURL?: string | null;
  userId: string;
  displayName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * A reusable avatar component that handles firestore:// URL resolution
 * and provides fallback to DiceBear avatars
 */
export default function UserAvatar({ 
  photoURL, 
  userId, 
  displayName,
  className,
  fallbackClassName
}: UserAvatarProps) {
  const resolvedUrl = useAvatarUrl(photoURL, userId);
  
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarImage src={resolvedUrl} alt={displayName || 'User'} />
      <AvatarFallback className={cn("bg-gradient-to-br from-orange-500 to-amber-500 text-white", fallbackClassName)}>
        {displayName?.[0]?.toUpperCase() || <img src={getUserAvatarUrl(userId)} alt="" className="w-full h-full" />}
      </AvatarFallback>
    </Avatar>
  );
}
