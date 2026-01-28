import { useMemo, useState, type ReactNode } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, RotateCcw, Sparkles, MoreVertical, Flag, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import Seo from "@/components/Seo";
import { useIssuesFirebase } from "@/hooks/use-issues-firebase";
import { useIssueEngagement } from "@/hooks/use-issue-engagement";
import { useAuth } from "@/hooks/use-auth";
import { ISSUE_STATUSES, type IssueCategory, type IssueStatus, type Issue } from "@/types/issue";
import { formatRelativeTime, formatDateWithRelative, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IssuesFilterBar, type SortKey } from "@/components/IssuesFilterBar";
import IssueDetailDialog from "@/components/IssueDetailDialog";
import ReportUserDialog from "@/components/ReportUserDialog";
import UserDisplay, { UserDisplayName } from "@/components/UserDisplay";
import { useUserProfile } from "@/hooks/use-user-profile";

function IssueCollegeProvider({ issue, children }: { issue: Issue; children: (collegeName?: string) => ReactNode }) {
  const { data: profile } = useUserProfile(issue.createdBy);
  const collegeFromProfile = profile?.college?.trim();
  const collegeFromIssue = (issue as Issue & { college?: string }).college?.trim();
  const resolvedCollege = collegeFromProfile || collegeFromIssue;

  return <>{children(resolvedCollege)}</>;
}

export default function Issues() {
  const { user } = useAuth();
  const { data: dataRaw, upvote, downvoteIssue } = useIssuesFirebase();

  // Dummy college-related issues for testing
  const dummyIssues: Issue[] = [
    {
      id: 'issue-1',
      title: 'Improve campus WiFi coverage',
      description: 'The WiFi signal is weak in many areas of the campus, especially in the outdoor spaces and some classrooms.',
      category: 'Infrastructure' as IssueCategory,
      priority: 'high',
      status: 'open' as IssueStatus,
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      votes: 89,
      visibility: 'public' as const,
    },
    {
      id: 'issue-2',
      title: 'Extend library working hours',
      description: 'Students need access to the library beyond 6 PM for study groups and preparation for exams.',
      category: 'Facilities' as IssueCategory,
      priority: 'medium',
      status: 'in-progress' as IssueStatus,
      createdBy: 'user2',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      votes: 156,
      visibility: 'public' as const,
    },
    {
      id: 'issue-3',
      title: 'Better parking facilities needed',
      description: 'Not enough parking spaces for students and staff. This causes traffic congestion during peak hours.',
      category: 'Facilities' as IssueCategory,
      priority: 'medium',
      status: 'open' as IssueStatus,
      createdBy: 'user3',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      votes: 73,
      visibility: 'public' as const,
    },
    {
      id: 'issue-4',
      title: 'Add more food options in canteen',
      description: 'The canteen has limited vegetarian and vegan options. Need to expand the menu to cater to diverse dietary preferences.',
      category: 'Student Services' as IssueCategory,
      priority: 'low',
      status: 'open' as IssueStatus,
      createdBy: 'user4',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      votes: 42,
      visibility: 'public' as const,
    },
    {
      id: 'issue-5',
      title: 'Upgrade laboratory equipment',
      description: 'Current lab equipment is outdated and needs replacement. We need modern tools for hands-on learning.',
      category: 'Academic' as IssueCategory,
      priority: 'high',
      status: 'resolved' as IssueStatus,
      createdBy: 'user5',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      votes: 121,
      visibility: 'public' as const,
    },
    {
      id: 'issue-6',
      title: 'Improve mental health support services',
      description: 'Students need better access to counseling services and mental health support during exam season.',
      category: 'Student Services' as IssueCategory,
      priority: 'high',
      status: 'open' as IssueStatus,
      createdBy: 'user6',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      votes: 98,
      visibility: 'public' as const,
    },
  ];

  const data = dataRaw && dataRaw.length > 0 ? dataRaw : dummyIssues;

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingUser, setReportingUser] = useState<{ userId: string; userName: string; issueId: string; issueTitle: string } | null>(null);

  const handleCardClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Small delay to allow dialog close animation
      setTimeout(() => setSelectedIssue(null), 150);
    }
  };

  const handleReportUser = (issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportingUser({
      userId: issue.createdBy,
      userName: issue.createdByName || "Anonymous",
      issueId: issue.id,
      issueTitle: issue.title,
    });
    setReportDialogOpen(true);
  };

  // Filters
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  // Show all statuses by default (empty means no filter)
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [sort, setSort] = useState<SortKey>("new");

  const visibleIssues = useMemo(() => {
    const base = data ?? [];
    // Hide draft issues completely; hide private issues unless owned by current user
    type WithVisibility = { visibility?: "public" | "private" | "draft" };
    let arr = base.filter((i) => {
      const vis = (i as unknown as WithVisibility).visibility;
      // Exclude all draft issues from public listing
      if (vis === "draft") return false;
      // Show public issues to everyone
      if (!vis || vis === "public") return true;
      // Show private issues only to the owner
      if (vis === "private") return i.createdBy === user?.uid;
      return true;
    });
    // status filter (default in_progress + resolved)
    if (statuses.length > 0) {
      arr = arr.filter((i) => (statuses as IssueStatus[]).includes(i.status));
    }
    if (categories.length > 0) {
      arr = arr.filter((i) => categories.includes(i.category));
    }
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      arr = arr.filter((i) => {
        const title = i.title.toLowerCase();
        const desc = i.description.toLowerCase();
        const name = (i.createdByName || "").toLowerCase();
        const college = ((i as Issue & { college?: string }).college || "").toLowerCase();
        return title.includes(n) || desc.includes(n) || name.includes(n) || college.includes(n);
      });
    }
    // sorting
    const byDate = (a: number, b: number) => a - b;
    if (sort === "new") arr = [...arr].sort((a, b) => byDate(b.createdAt, a.createdAt));
    else if (sort === "old") arr = [...arr].sort((a, b) => byDate(a.createdAt, b.createdAt));
    else if (sort === "votes") arr = [...arr].sort((a, b) => b.votes - a.votes);
    return arr;
  }, [data, categories, q, statuses, sort, user?.uid]);

  // Fetch engagement metrics for visible issues
  const visibleIssueIds = useMemo(() => visibleIssues.map((i) => i.id), [visibleIssues]);
  const { data: engagement } = useIssueEngagement(visibleIssueIds);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Helper to check if issue is new (within last 24 hours)
  const isNewIssue = (createdAt: number) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - createdAt < twentyFourHours;
  };

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="Campus Issues Feed"
        description="Browse campus issue reporting in Nepal. Upvote, comment, and support campus voices to improve community engagement and resolution tracking."
        path="/issues"
      />
      <Navbar />
      <main className="scroll-mt-20">
        <ParticlesBackground fullPage hexOpacity={0.11}>
          <div className="px-4 md:px-6 pt-28 pb-24">
            <section className="mx-auto max-w-7xl">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">Campus Issues</h1>
                <p className="mt-3 text-muted-foreground">Browse top issues and show support by upvoting.</p>
              </div>

              {/* Filters: improved UX and UI */}
              <div className="mb-6 relative z-10">
                <IssuesFilterBar
                  q={q}
                  onQChange={setQ}
                  categories={categories}
                  onCategoriesChange={setCategories}
                  statuses={statuses}
                  onStatusesChange={setStatuses}
                  sort={sort}
                  onSortChange={setSort}
                />
              </div>

              <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {visibleIssues.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-8 text-center">
                    <p className="text-muted-foreground">No matching issues.</p>
                    <Button
                      variant="ghost"
                      className="mt-3 rounded-full flex items-center justify-center"
                      aria-label="Reset filters"
                      onClick={() => {
                        setQ("");
                        setCategories([]);
                        setStatuses([]);
                        setSort("new");
                      }}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {visibleIssues.map((i, idx) => (
                  <IssueCollegeProvider issue={i} key={i.id}>
                    {(collegeName) => (
                      <motion.div
                        key={i.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                      >
                        <Card
                          className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all duration-300 flex flex-col h-full cursor-pointer"
                          onClick={() => handleCardClick(i)}
                        >
                          <CardContent className="p-6 md:p-7 flex flex-col h-full">
                            {/* Header: User Info */}
                            <div className="flex items-center gap-3 mb-4">
                              <UserDisplay
                                userId={i.createdBy}
                                photoURL={i.createdByPhotoURL}
                                fallbackName={i.createdByName}
                                anonymous={i.anonymous}
                                showLink={!i.anonymous}
                                avatarClassName="h-10 w-10 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <UserDisplayName
                                  userId={i.createdBy}
                                  fallbackName={i.createdByName}
                                  className="text-sm font-medium truncate"
                                />
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(i.createdAt)}
                                </p>
                                {collegeName ? (
                                  <div className="flex items-center gap-1 text-[11px] text-amber-700 truncate" title={collegeName}>
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{collegeName}</span>
                                  </div>
                                ) : null}
                              </div>
                              {user && user.uid !== i.createdBy && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem
                                      onClick={(e) => handleReportUser(i, e)}
                                      className="text-red-600 focus:text-red-600 cursor-pointer"
                                    >
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {/* Issue Title & Description */}
                            <div className="mb-4 flex-1">
                              <div className="flex items-start gap-2 mb-2">
                                <h3 className="text-lg font-display font-semibold break-words leading-snug flex-1">{i.title}</h3>
                                {isNewIssue(i.createdAt) && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-gradient-to-r from-orange-100 to-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 shadow-sm flex-shrink-0 animate-pulse">
                                    <Sparkles className="h-3 w-3" />
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground break-words line-clamp-3">{i.description}</p>
                            </div>

                            {/* Status & Category / Update Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(i.status)}`}>
                                {ISSUE_STATUSES.find((s) => s.value === i.status)?.label ?? i.status}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                                {i.category}
                              </span>
                              {"visibility" in i && i.visibility === "private" && (
                                <span className="inline-flex items-center rounded-full border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                  🔒 Private
                                </span>
                              )}
                              {i.status === "resolved" && i.resolution && (
                                <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                  ✅ Resolution Posted
                                </span>
                              )}
                              {i.progressUpdates && i.progressUpdates.length > 0 && (
                                <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                  🔄 {i.progressUpdates.length} Update{i.progressUpdates.length !== 1 ? "s" : ""}
                                </span>
                              )}
                              {i.status === "in_progress" && !(i.progressUpdates && i.progressUpdates.length > 0) && !i.resolution && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" /> Updated
                                </span>
                              )}
                            </div>

                            {/* Footer: Votes & Engagement */}
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {engagement?.[i.id] ? (
                                  <>
                                    <div className="flex items-center gap-1" title="Upvotes">
                                      <ThumbsUp className="h-4 w-4 text-green-600" />
                                      <span>{engagement[i.id].upvotes}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Downvotes">
                                      <ThumbsDown className="h-4 w-4 text-red-600" />
                                      <span>{engagement[i.id].downvotes}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Comments">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <span>{engagement[i.id].comments}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4 text-orange-500" />
                                    <span>{i.votes} support{i.votes !== 1 ? "s" : ""}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full"
                                aria-label="View Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(i);
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Button>
                            </div>

                            {/* Urgency & Date */}
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                              <div>
                                Urgency:{" "}
                                <span className={i.urgency === "high" ? "text-red-500" : i.urgency === "medium" ? "text-yellow-500" : "text-green-500"}>
                                  {i.urgency}
                                </span>
                              </div>
                              <span className="text-gray-400" title={new Date(i.createdAt).toLocaleString()}>
                                {formatDateShort(i.createdAt)}
                              </span>
                            </div>
                            {i.anonymous && <div className="mt-1 text-xs text-gray-400">Posted anonymously</div>}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </IssueCollegeProvider>
                ))}
              </div>
            </section>
          </div>
        </ParticlesBackground>
      </main>

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        issue={selectedIssue}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        enablePin={selectedIssue ? selectedIssue.createdBy === user?.uid : false}
      />

      {/* Report User Dialog */}
      {reportingUser && (
        <ReportUserDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportedUserId={reportingUser.userId}
          reportedUserName={reportingUser.userName}
          context={{
            issueId: reportingUser.issueId,
            issueTitle: reportingUser.issueTitle,
          }}
        />
      )}
    </div>
  );
}
