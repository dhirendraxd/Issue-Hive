import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signIn, signInWithGoogle, signUp } from '@/integrations/firebase';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import SocialIcon from '@/components/SocialIcon';
import Seo from "@/components/Seo";
import { sanitizeEmail } from '@/lib/sanitize';

interface FirebaseError {
  code?: string;
  message?: string;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password.length > 128) {
      toast.error('Password is too long (max 128 characters)');
      return;
    }

    setLoading(true);
    try {
      const cred = isLogin
        ? await signIn(sanitizedEmail, password)
        : await signUp(sanitizedEmail, password);

      const uid = cred.user?.uid;
      if (!uid) throw new Error('Could not determine user');

      if (!isLogin) {
        const isNewUser = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
        toast.success('Account created successfully!');
        navigate(isNewUser ? `/profile/${uid}/edit` : `/profile/${uid}`);
      } else {
        toast.success('Welcome back!');
        navigate(`/profile/${uid}`);
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const errorMessage = firebaseError.code === 'auth/not-configured'
        ? 'Authentication is disabled: Firebase is not configured.'
        : firebaseError.code === 'auth/email-already-in-use'
        ? 'Email already in use. Try logging in instead.'
        : firebaseError.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : firebaseError.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : firebaseError.message || 'Authentication failed';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      const uid = cred.user?.uid;
      if (!uid) throw new Error('Could not determine user');

      // Use Firebase metadata to determine if user is new (faster than Firestore check)
      const isNewUser = cred.user?.metadata?.creationTime === cred.user?.metadata?.lastSignInTime;

      toast.success('Welcome!');
      // Navigate immediately - don't wait for Firestore doc check
      navigate(isNewUser ? `/profile/${uid}/edit` : `/profile/${uid}`);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const msg = firebaseError.code === 'auth/not-configured'
        ? 'Authentication is disabled: Firebase is not configured.'
        : firebaseError.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : firebaseError.message || 'Google sign-in failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="Sign In"
        description="Sign in to IssueHive to report campus problems and support campus voices."
        path="/auth"
        noIndex
        keywords={["login", "sign in", "authentication"]}
      />
      {/* Background Effects */}
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl tracking-tight">
          <img src="/beehive-honey-svgrepo-com.svg" alt="IssueHive" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span>Issue<span className="text-orange-500">Hive</span></span>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <Card className="w-full max-w-md border-white/40 shadow-xl bg-white/80 backdrop-blur-xl mx-auto">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isLogin 
                ? 'Sign in to access your dashboard' 
                : 'Join IssueHive to report and track issues'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-11 border-gray-300 hover:bg-gray-50"
              onClick={handleGoogleAuth}
              disabled={loading || !isFirebaseConfigured}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                    <SocialIcon platform="google" className="mr-2 h-5 w-5" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                {isFirebaseConfigured ? 'or continue with email' : 'Firebase not configured'}
              </span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                    disabled={loading}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-black text-white hover:bg-orange-400/90 transition-colors uppercase font-medium tracking-wide"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-muted-foreground hover:text-orange-500 transition-colors"
                disabled={loading}
              >
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <span className="font-medium text-orange-500">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <span className="font-medium text-orange-500">Sign in</span>
                  </>
                )}
              </button>
            </div>

            {/* Back to home */}
            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
