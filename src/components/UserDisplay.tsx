import { useUserProfile } from '@/hooks/use-user-profile';
import UserAvatar from './UserAvatar';
import { Link } from 'react-router-dom';

interface UserDisplayProps {
  userId: string;
  photoURL?: string | null;
  fallbackName?: string | null;
  anonymous?: boolean;
  showLink?: boolean;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  showAvatar?: boolean;
}

/**
 * Component that fetches and displays current user profile data
 * Always shows the most up-to-date display name from Firestore
 */
export default function UserDisplay({
  userId,
  photoURL,
  fallbackName,
  anonymous = false,
  showLink = true,
  className = '',
  avatarClassName = 'h-10 w-10',
  nameClassName = 'text-sm font-medium truncate',
  showAvatar = true,
}: UserDisplayProps) {
  const { data: userProfile } = useUserProfile(userId);
  
  const displayName = userProfile?.displayName || fallbackName || 'Anonymous';
  
  const avatarElement = showAvatar ? (
    <UserAvatar
      photoURL={photoURL}
      userId={userId}
      displayName={displayName}
      className={avatarClassName}
    />
  ) : null;
  
  if (anonymous || !showLink) {
    return (
      <div className={className}>
        {avatarElement}
      </div>
    );
  }
  
  return (
    <Link to={`/u/${userId}`} onClick={(e) => e.stopPropagation()} className={className}>
      {avatarElement}
    </Link>
  );
}

/**
 * Just the display name text, fetched from current profile
 */
export function UserDisplayName({
  userId,
  fallbackName,
  className = 'text-sm font-medium truncate',
}: {
  userId: string;
  fallbackName?: string | null;
  className?: string;
}) {
  const { data: userProfile } = useUserProfile(userId);
  const displayName = userProfile?.displayName || fallbackName || 'Anonymous';
  
  return <span className={className}>{displayName}</span>;
}
