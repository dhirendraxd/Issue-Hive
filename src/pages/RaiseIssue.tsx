import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { IssueCategory } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Clock,
  MapPin,
  FileText,
  Tag,
  Shield,
  Building2,
  BookOpen,
  Landmark,
  PartyPopper,
  CursorClick,
  UserShield,
  Send2,
} from "@/components/icons/IconifyIcons";
import ParticlesBackground from '@/components/ParticlesBackground';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { sanitizeText, limitLength } from '@/lib/sanitize';
import { rateLimits, formatResetTime } from '@/lib/rate-limit';
import Seo from "@/components/Seo";

const CATEGORY_ICONS: Record<IssueCategory, typeof Building2> = {
  Facilities: Building2,
  Academics: BookOpen,
  Administration: Landmark,
  Events: PartyPopper,
  Other: FileText,
};

export default function RaiseIssuePage() {
  const { user, loading: authLoading } = useAuth();
  const { addIssue } = useIssuesFirebase();
  const { data: profile } = useUserProfile(user?.uid || '');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
    urgency: 'low' as 'low' | 'medium' | 'high',
  });
  const CategoryIcon = formData.category ? CATEGORY_ICONS[formData.category] : null;

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to report campus issues');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Validation function
  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {};
    
    if (field === 'title') {
      if (!value.trim()) {
        errors.title = 'Title is required';
      } else if (value.trim().length < 10) {
        errors.title = 'Title should be at least 10 characters';
      } else if (value.trim().length > 200) {
        errors.title = 'Title is too long (max 200 characters)';
      }
    }
    
    if (field === 'description') {
      if (!value.trim()) {
        errors.description = 'Description is required';
      } else if (value.trim().length < 20) {
        errors.description = 'Please provide more details (at least 20 characters)';
      } else if (value.trim().length > 2000) {
        errors.description = 'Description is too long (max 2000 characters)';
      }
    }
    
    if (field === 'category' && !value) {
      errors.category = 'Please select a category';
    }
    
    return errors;
  };

  // Simple field updater with validation
  const handleChange = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    
    // Clear error when user starts typing
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldValue = formData[field as keyof typeof formData] as string;
    const errors = validateField(field, fieldValue);
    setFormErrors((prev) => ({ ...prev, ...errors }));
  };

  // Guard render until auth known; optional early return for unauthenticated
  if (!authLoading && !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const titleErrors = validateField('title', formData.title);
    const descErrors = validateField('description', formData.description);
    const catErrors = validateField('category', formData.category);
    
    const allErrors = { ...titleErrors, ...descErrors, ...catErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      setTouched({ title: true, description: true, category: true });
      toast.error('Please fix the errors in the form');
      return;
    }

    const confirmed = window.confirm('Submit this issue now?');
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      // Check rate limit
      if (!rateLimits.createIssue(user?.uid || '')) {
        const resetTime = rateLimits.getResetTime('create-issue', user?.uid || '');
        toast.error(`Rate limit exceeded. Please wait ${formatResetTime(resetTime)} before creating another issue.`);
        setIsSubmitting(false);
        return;
      }
      
      const now = Date.now();

      const sanitizedCollege = profile?.college ? limitLength(sanitizeText(profile.college), 120) : '';
      
      // Sanitize inputs to prevent XSS
      const sanitizedTitle = limitLength(sanitizeText(formData.title), 200);
      const sanitizedDescription = limitLength(sanitizeText(formData.description), 5000);
      
      // Submit to Firebase using the expected shape
      await addIssue.mutateAsync({
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: formData.category as IssueCategory,
        status: 'received',
        votes: 0,
        createdBy: user?.uid ?? '',
        createdByName: isAnonymous ? 'Anonymous' : user?.displayName ?? '',
        createdByPhotoURL: isAnonymous ? undefined : user?.photoURL ?? undefined,
        createdAt: now,
        updatedAt: now,
        urgency: formData.urgency,
        anonymous: isAnonymous,
        attachments: [],
        college: sanitizedCollege || undefined,
      });

      toast.success('Campus issue reported successfully!');

      // Reset form and navigate
      setFormData({
        title: '',
        description: '',
        category: '',
        urgency: 'low',
      });
      setIsAnonymous(false);
      setFormErrors({});
      setTouched({});
      setTimeout(() => {
        navigate('/issues');
      }, 1000);
    } catch (error) {
      console.error('Error reporting campus issue:', error);
      toast.error('Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden animate-in fade-in duration-300">
      <Seo
        title="Report Campus Problems"
        description="Report campus problems in Nepal with IssueHive. Add details, category, and urgency to help campus voices drive community engagement and faster resolutions."
        path="/raise-issue"
        noIndex
        keywords={[
          "report campus problems",
          "report issues",
          "campus issue form",
          "student voice",
          "campus feedback",
          "problem reporting",
          "issue submission",
          "campus improvement suggestion",
          "nepal college issues",
        ]}
      />
      {/* Navbar */}
      <Navbar />

      {/* Background Effects */}
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/40 to-amber-500/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/35 to-orange-500/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-yellow-500/25 to-orange-500/20 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-14 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900 sm:text-4xl mb-3">
              Report a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Campus Issue</span>
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Help improve our campus community by reporting facilities, infrastructure, or service issues
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CursorClick className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="font-medium">Quick & Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <UserShield className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="font-medium">Anonymous Option</span>
              </div>
              <div className="flex items-center gap-2">
                <Send2 className="h-4 w-4 text-orange-600" aria-hidden="true" />
                <span className="font-medium">Instant Submission</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border border-stone-200 bg-white shadow-md">
            <CardHeader className="border-b border-stone-100 px-6 py-5">
              <CardTitle className="text-xl font-display">
                Issue Details
              </CardTitle>
              <CardDescription className="text-sm">
                Provide clear information to help us address the issue quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Progress Indicator */}
                <div className="text-sm text-gray-500">
                  <span>All fields marked with <span className="text-red-500">*</span> are required</span>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Issue Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Broken water fountain in Building A, Room 101"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                    maxLength={200}
                    className={cn(
                      "h-12 text-base transition-all duration-200",
                      formErrors.title && touched.title
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-orange-500 focus:ring-orange-500",
                      formData.title && !formErrors.title && "border-green-300"
                    )}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center">
                    {formErrors.title && touched.title ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.title}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Be specific and concise
                      </p>
                    )}
                    <p className={cn(
                      "text-sm",
                      formData.title.length > 180 ? "text-orange-600 font-medium" : "text-gray-400"
                    )}>
                      {formData.title.length}/200
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      handleChange('category', value as IssueCategory);
                      // Mark touched and validate immediately with the selected value so the error clears
                      setTouched((prev) => ({ ...prev, category: true }));
                      const errors = validateField('category', value);
                      setFormErrors((prev) => {
                        const next = { ...prev, ...errors };
                        if (!errors.category) delete next.category;
                        return next;
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger 
                      id="category" 
                      className={cn(
                        "h-12 text-base transition-all duration-200",
                        formErrors.category && touched.category
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-orange-500 focus:ring-orange-500",
                        formData.category && !formErrors.category && "border-green-300"
                      )}
                    >
                      {CategoryIcon && <CategoryIcon className="h-4 w-4 text-muted-foreground" />}
                      <SelectValue placeholder="Choose the most relevant category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Facilities">
                        <div className="flex items-center gap-2 py-1">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Facilities</div>
                            <div className="text-xs text-gray-500">Classrooms, labs, restrooms, furniture</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Academics">
                        <div className="flex items-center gap-2 py-1">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Academics</div>
                            <div className="text-xs text-gray-500">Courses, schedules, library, exams</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Administration">
                        <div className="flex items-center gap-2 py-1">
                          <Landmark className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Administration</div>
                            <div className="text-xs text-gray-500">Offices, services, documentation</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Events">
                        <div className="flex items-center gap-2 py-1">
                          <PartyPopper className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Events</div>
                            <div className="text-xs text-gray-500">Activities, clubs, announcements</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="Other">
                        <div className="flex items-center gap-2 py-1">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Other</div>
                            <div className="text-xs text-gray-500">General campus concerns</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.category && touched.category && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.category}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Detailed Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Please include:&#10;• Exact location (building, floor, room number)&#10;• What's wrong or what needs attention&#10;• When you first noticed the issue&#10;• Any safety concerns&#10;• Other relevant details"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    onBlur={() => handleBlur('description')}
                    maxLength={2000}
                    rows={8}
                    className={cn(
                      "text-base transition-all duration-200 resize-none",
                      formErrors.description && touched.description
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-orange-500 focus:ring-orange-500",
                      formData.description && !formErrors.description && "border-green-300"
                    )}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center">
                    {formErrors.description && touched.description ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        More details help us respond faster
                      </p>
                    )}
                    <p className={cn(
                      "text-sm",
                      formData.description.length > 1800 ? "text-orange-600 font-medium" : "text-gray-400"
                    )}>
                      {formData.description.length}/2000
                    </p>
                  </div>
                </div>

                {/* Urgency Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Urgency Level
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={formData.urgency === 'low' ? 'default' : 'outline'}
                      onClick={() => handleChange('urgency', 'low')}
                      disabled={isSubmitting}
                      className={cn(
                        'h-16 flex flex-col items-center justify-center gap-1.5 transition-all duration-200',
                        formData.urgency === 'low' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400 shadow-lg shadow-green-200' 
                          : 'hover:bg-green-50 hover:border-green-300 glass-subtle'
                      )}
                    >
                      <Clock className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-semibold">Low</div>
                        <div className="text-xs opacity-80">Can wait</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.urgency === 'medium' ? 'default' : 'outline'}
                      onClick={() => handleChange('urgency', 'medium')}
                      disabled={isSubmitting}
                      className={cn(
                        'h-16 flex flex-col items-center justify-center gap-1.5 transition-all duration-200',
                        formData.urgency === 'medium'
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white border-orange-400 shadow-lg shadow-orange-200'
                          : 'hover:bg-orange-50 hover:border-orange-300 glass-subtle'
                      )}
                    >
                      <AlertTriangle className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-semibold">Medium</div>
                        <div className="text-xs opacity-80">Soon</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.urgency === 'high' ? 'default' : 'outline'}
                      onClick={() => handleChange('urgency', 'high')}
                      disabled={isSubmitting}
                      className={cn(
                        'h-16 flex flex-col items-center justify-center gap-1.5 transition-all duration-200',
                        formData.urgency === 'high'
                          ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-red-400 shadow-lg shadow-red-200'
                          : 'hover:bg-red-50 hover:border-red-300 glass-subtle'
                      )}
                    >
                      <Zap className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-semibold">High</div>
                        <div className="text-xs opacity-80">Urgent</div>
                      </div>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {formData.urgency === 'low' && 'Normal maintenance or minor issues'}
                    {formData.urgency === 'medium' && 'Affects daily activities or multiple people'}
                    {formData.urgency === 'high' && 'Safety concern or critical infrastructure'}
                  </p>
                </div>

                {/* Anonymous Posting Option */}
                <div className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border transition-colors",
                  isAnonymous 
                    ? "bg-blue-50 border-blue-300 shadow-sm" 
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                )}>
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    disabled={isSubmitting}
                    className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="anonymous"
                      className="text-base font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Post Anonymously
                      {isAnonymous && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                          Active
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your identity will be completely hidden. Only "Anonymous" will be shown on this report.
                      {isAnonymous && " You can still vote and comment on this issue."}
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex gap-3">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 mb-2">
                        Tips for effective reporting
                      </p>
                      <ul className="space-y-1.5 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-orange-500 flex-shrink-0" />
                          <span>Include specific location details (building name, floor, room number)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-orange-500 flex-shrink-0" />
                          <span>Describe the problem clearly (what's broken, missing, or needs attention)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-orange-500 flex-shrink-0" />
                          <span>Mention any safety concerns or impact on students/staff</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 rounded-full bg-orange-500 flex-shrink-0" />
                          <span>Add timeline information (when did it start, how often it occurs)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-orange-500 text-white font-semibold hover:bg-orange-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting your issue...
                      </>
                    ) : (
                      <>
                        <Send2 className="mr-2 h-4 w-4" />
                        Submit Campus Issue
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/issues')}
                    disabled={isSubmitting}
                    className="h-11 px-6 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-4">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/issues')}
                className="text-sm text-gray-600 hover:text-orange-600"
              >
                View all campus issues →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
