import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signIn, signInWithGoogle, signUp } from '@/integrations/firebase';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';

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
    
    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
      } else {
        await signUp(email, password);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      const errorMessage = firebaseError.code === 'auth/email-already-in-use'
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
      await signInWithGoogle();
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      toast.error(firebaseError.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50">
      {/* Background effects */}
      <ParticlesBackground>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight">
          <img src="/beehive-honey-svgrepo-com.svg" alt="IssueHive" className="h-9 w-9" />
          <span>Issue<span className="text-orange-500">Hive</span></span>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <Card className="w-full max-w-md border-white/40 shadow-xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
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
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                or continue with email
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
