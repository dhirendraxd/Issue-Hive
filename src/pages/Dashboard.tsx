import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { signOut } from '@/integrations/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  LogOut, 
  Plus,
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: issues, isLoading: issuesLoading, stats } = useIssuesFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userIssues = issues?.filter(issue => 
    issue.user?.name === (user.displayName || user.email?.split('@')[0])
  ) || [];

  const statusColors = {
    received: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500',
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50">
      {/* Background */}
      <ParticlesBackground>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight">
              <img src="/beehive-honey-svgrepo-com.svg" alt="IssueHive" className="h-8 w-8" />
              <span>Issue<span className="text-orange-500">Hive</span></span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/issues">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Browse All Issues
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your issues and track community reports
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community-wide</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Issues
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats?.open || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Supports
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats?.votes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community engagement</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Issues
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{userIssues.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Issues you reported</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Recent Issues */}
          <div className="lg:col-span-2">
            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Your Recent Issues</CardTitle>
                <CardDescription>
                  Issues you've reported to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userIssues.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">You haven't reported any issues yet</p>
                    <p className="text-sm mt-2">Click "Raise Issue" in the navigation to get started</p>
                    <Link to="/raise-issue" className="mt-4 inline-block">
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Raise Your First Issue
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userIssues.slice(0, 5).map((issue) => (
                      <div key={issue.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[issue.status]}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {issue.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {issue.category}
                            </Badge>
                            <Badge 
                              variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                              className="text-xs capitalize"
                            >
                              {issue.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {issue.votes} {issue.votes === 1 ? 'support' : 'supports'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Profile Sidebar */}
          <div className="space-y-6">
            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-16 w-16 rounded-full border-2 border-orange-500"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-semibold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {user.displayName || 'IssueHive User'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      Member
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.metadata.creationTime || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/raise-issue" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Raise New Issue
                  </Button>
                </Link>
                <Link to="/issues" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Browse All Issues
                  </Button>
                </Link>
                <Link to="/about" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    About IssueHive
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
