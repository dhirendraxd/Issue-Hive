import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EditBasicInfoTab from '@/components/profile/EditBasicInfoTab';
import EditPhotosTab from '@/components/profile/EditPhotosTab';
import PortalErrorBoundary from '@/components/PortalErrorBoundary';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateUserDisplayName } from '@/integrations/firebase/profile';
import { sanitizeText, sanitizeURL, limitLength } from '@/lib/sanitize';

export default function EditProfile() {
  const navigate = useNavigate();
  const { uid } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: ownerProfile, isLoading: profileLoading } = useUserProfile(user?.uid || '');
  
  // Disable view transitions on this page to prevent portal conflicts
  useEffect(() => {
    const root = document.documentElement;
    root.style.viewTransitionName = 'none';
    return () => {
      root.style.viewTransitionName = '';
    };
  }, []);
  
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Initialize state from profile data
  useEffect(() => {
    if (ownerProfile) {
      setUsername(ownerProfile.username || '');
      setBio(ownerProfile.bio || '');
      setLocation(ownerProfile.location || '');
      setPronouns(ownerProfile.pronouns || '');
      setWebsite(ownerProfile.social?.website || '');
      setGithub(ownerProfile.social?.github || '');
      setTwitter(ownerProfile.social?.twitter || '');
      setLinkedin(ownerProfile.social?.linkedin || '');
      setInstagram(ownerProfile.social?.instagram || '');
    }
  }, [ownerProfile]);

  // Redirect if not logged in - but wait for auth to load first
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    
    // Redirect if user tries to edit someone else's profile
    if (uid && user.uid !== uid) {
      toast.error('You can only edit your own profile');
      navigate(`/profile/${user.uid}`, { replace: true });
    }
  }, [user, uid, navigate, authLoading]);

  // Show loading while checking auth or loading profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // After loading completes, if still no user, the useEffect will redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSaveDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;
    
    const sanitized = sanitizeText(newDisplayName);
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) {
      toast.error('Display name must be between 2-100 characters');
      return;
    }

    setSavingName(true);
    try {
      await updateUserDisplayName(user, sanitized);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Display name updated!');
      setEditingName(false);
    } catch (error) {
      toast.error('Failed to update display name');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) return;
    
    const sanitizedUsername = sanitizeText(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!sanitizedUsername || sanitizedUsername.length < 3 || sanitizedUsername.length > 32) {
      toast.error('Username must be 3-32 characters (letters, numbers, _ or -)');
      return;
    }

    setSavingUsername(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: sanitizedUsername,
        updatedAt: new Date()
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Username updated!');
      setEditingUsername(false);
    } catch (error) {
      if ((error as { code?: string })?.code === 'permission-denied') {
        toast.error('Username already taken or invalid');
      } else {
        toast.error('Failed to update username');
      }
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSaveProfileInfo = async () => {
    if (!user) return;

    const sanitizedBio = limitLength(sanitizeText(bio), 500);
    const sanitizedLocation = limitLength(sanitizeText(location), 100);
    const sanitizedPronouns = limitLength(sanitizeText(pronouns), 50);
    const sanitizedWebsite = website ? sanitizeURL(website) : '';
    const sanitizedGithub = github ? sanitizeURL(github) : '';
    const sanitizedTwitter = twitter ? sanitizeURL(twitter) : '';
    const sanitizedLinkedin = linkedin ? sanitizeURL(linkedin) : '';
    const sanitizedInstagram = instagram ? sanitizeURL(instagram) : '';

    if (website && !sanitizedWebsite) {
      toast.error('Invalid website URL');
      return;
    }
    if (github && !sanitizedGithub) {
      toast.error('Invalid GitHub URL');
      return;
    }
    if (twitter && !sanitizedTwitter) {
      toast.error('Invalid Twitter URL');
      return;
    }
    if (linkedin && !sanitizedLinkedin) {
      toast.error('Invalid LinkedIn URL');
      return;
    }
    if (instagram && !sanitizedInstagram) {
      toast.error('Invalid Instagram URL');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio: sanitizedBio,
        location: sanitizedLocation,
        pronouns: sanitizedPronouns,
        'social.website': sanitizedWebsite,
        'social.github': sanitizedGithub,
        'social.twitter': sanitizedTwitter,
        'social.linkedin': sanitizedLinkedin,
        'social.instagram': sanitizedInstagram,
        updatedAt: new Date()
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Profile updated!');
      setEditingBio(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateDoc(doc(db, 'users', user.uid), {
          coverUrl: base64,
          updatedAt: new Date()
        });
        
        queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
        toast.success('Cover photo updated!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50" key={`edit-profile-${user.uid}`}>
      <Navbar />
      <main className="pt-24 pb-24 px-4 mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/profile/${user.uid}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Edit Profile</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize your profile, upload photos, and manage privacy settings
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <EditBasicInfoTab
                    ownerProfile={ownerProfile}
                    userDisplayName={user?.displayName}
                    userEmail={user?.email}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    newDisplayName={newDisplayName}
                    setNewDisplayName={setNewDisplayName}
                    savingName={savingName}
                    handleSaveDisplayName={handleSaveDisplayName}
                    editingUsername={editingUsername}
                    setEditingUsername={setEditingUsername}
                    username={username}
                    setUsername={setUsername}
                    savingUsername={savingUsername}
                    handleSaveUsername={handleSaveUsername}
                    editingBio={editingBio}
                    setEditingBio={setEditingBio}
                    bio={bio}
                    setBio={setBio}
                    location={location}
                    setLocation={setLocation}
                    pronouns={pronouns}
                    setPronouns={setPronouns}
                    website={website}
                    setWebsite={setWebsite}
                    github={github}
                    setGithub={setGithub}
                    twitter={twitter}
                    setTwitter={setTwitter}
                    linkedin={linkedin}
                    setLinkedin={setLinkedin}
                    instagram={instagram}
                    setInstagram={setInstagram}
                    handleSaveProfileInfo={handleSaveProfileInfo}
                  />
                </TabsContent>
                
                <TabsContent value="photos" className="space-y-6 mt-6">
                  <PortalErrorBoundary>
                    <EditPhotosTab 
                      ownerProfile={ownerProfile}
                      uploadingCover={uploadingCover}
                      handleCoverPhotoUpload={handleCoverPhotoUpload}
                      sheetOpen={true}
                    />
                  </PortalErrorBoundary>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
