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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

export default function RaiseIssuePage() {
  const { user, loading: authLoading } = useAuth();
  const { addIssue } = useIssuesFirebase();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
    urgency: 'low' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to report campus issues');
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
        urgency: formData.urgency,
        votes: 0,
        userId: user?.uid ?? '',
        userName: isAnonymous ? 'Anonymous' : user?.displayName ?? '',
        anonymous: isAnonymous,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast.success('Campus issue reported successfully!');
      
      try {
        // Map campus categories to allowed Firestore values
        const allowedCategories = {
          bug: 'bug',
          feature: 'feature',
          improvement: 'improvement',
          question: 'question',
          other: 'other',
        };
        // If your UI uses custom campus categories, map them here
        const category = allowedCategories[formData.category] || 'other';

        await addIssue.mutateAsync({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category,
          status: 'open',
          votes: 0,
          createdBy: user?.uid ?? '',
          createdByName: isAnonymous ? 'Anonymous' : user?.displayName ?? '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // You can still send urgency/anonymous for UI, but rules ignore them
          urgency: formData.urgency,
          anonymous: isAnonymous,
        });

        toast.success('Campus issue reported successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          urgency: 'low',
        });
        setIsAnonymous(false);
        setTimeout(() => {
          navigate('/issues');
        }, 1500);
      } catch (error) {
        console.error('Error reporting campus issue:', error);
        toast.error('Failed to report issue. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

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
              Report a <span className="text-orange-500">Campus Issue</span>
            </h1>
            <p className="text-lg text-gray-600">
              Help improve our campus by reporting problems with facilities, infrastructure, or services
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Campus Issue Details
              </CardTitle>
              <CardDescription>
                Provide clear information about the campus problem you've encountered
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
                    placeholder="e.g., Broken water fountain in Building A"
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
                      <SelectItem value="bug">� Infrastructure - Water, electricity, plumbing issues</SelectItem>
                      <SelectItem value="feature">🏢 Facilities - Classrooms, labs, restrooms</SelectItem>
                      <SelectItem value="improvement">🧹 Maintenance - Cleaning, repairs needed</SelectItem>
                      <SelectItem value="question">🌳 Campus Grounds - Gardens, parking, outdoor areas</SelectItem>
                      <SelectItem value="other">📝 Other - General campus concerns</SelectItem>
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
                    placeholder="Describe the campus issue in detail: location, what's broken/needed, when you noticed it, etc."
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

                {/* Urgency Level */}
                <div className="mb-4">
                  <Label className="block font-medium mb-1">
                    Urgency Level
                  </Label>
                  <div className="flex gap-4">
                    {['low', 'medium', 'high'].map((level) => (
                      <Button
                        key={level}
                        variant={formData.urgency === level ? 'default' : 'outline'}
                        onClick={(e) => { e.preventDefault(); handleChange('urgency', level as 'low' | 'medium' | 'high'); }}
                        className={cn(
                          'capitalize',
                          formData.urgency === level && {
                            'bg-orange-500 text-white border-orange-500': true,
                          }
                        )}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Anonymous Posting Option */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="anonymous"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Post Anonymously
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your identity will be hidden. Only "Anonymous" will be shown on this report.
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">Tips for reporting campus issues:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Include the specific location (building, room number, area)</li>
                        <li>Describe what's broken or what needs attention</li>
                        <li>Mention if it's urgent or a safety concern</li>
                        <li>Add any relevant details (when it started, how often, etc.)</li>
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
                        Report Campus Issue
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
