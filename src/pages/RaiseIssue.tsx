import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import type { IssueCategory } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function RaiseIssuePage() {
  const { user, loading: authLoading } = useAuth();
  const { addIssue } = useIssuesFirebase();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to raise an issue');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      await addIssue.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as IssueCategory,
        user: {
          name: user?.displayName || user?.email || 'Anonymous',
          avatar: user?.photoURL || undefined,
        },
      });

      toast.success('Issue raised successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
      });

      // Navigate to issues page after a short delay
      setTimeout(() => {
        navigate('/issues');
      }, 1500);
    } catch (error) {
      console.error('Error raising issue:', error);
      toast.error('Failed to raise issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden">
      {/* Background Effects */}
      <ParticlesBackground>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
              Raise an <span className="text-orange-500">Issue</span>
            </h1>
            <p className="text-lg text-gray-600">
              Help improve our campus by reporting issues or suggesting improvements
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Issue Details
              </CardTitle>
              <CardDescription>
                Provide clear information to help us understand and address your concern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Issue Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    maxLength={200}
                    className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="category" className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">🐛 Bug - Something isn't working</SelectItem>
                      <SelectItem value="feature">✨ Feature - New feature request</SelectItem>
                      <SelectItem value="improvement">🚀 Improvement - Enhancement to existing feature</SelectItem>
                      <SelectItem value="question">❓ Question - Need clarification</SelectItem>
                      <SelectItem value="other">📝 Other - General feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the issue..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    maxLength={2000}
                    rows={8}
                    className="text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">Tips for a great issue report:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Be specific and clear in your title</li>
                        <li>Include steps to reproduce (for bugs)</li>
                        <li>Explain why this matters to you</li>
                        <li>Add any relevant context or examples</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Raise Issue
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/issues')}
                    disabled={isSubmitting}
                    className="h-12 px-8 text-base border-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Issues Link */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/issues')}
              className="text-gray-600 hover:text-orange-600"
            >
              View all issues →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
