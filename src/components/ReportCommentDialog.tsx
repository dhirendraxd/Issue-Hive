import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ReportCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
  commentText: string;
  commentAuthorName: string;
  commentAuthorId?: string;
  issueId: string;
  issueTitle: string;
  issueOwnerId: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation or false claims" },
  { value: "off_topic", label: "Off-topic or not constructive" },
  { value: "other", label: "Other (please specify)" },
];

export default function ReportCommentDialog({
  open,
  onOpenChange,
  commentId,
  commentText,
  commentAuthorName,
  commentAuthorId,
  issueId,
  issueTitle,
  issueOwnerId,
}: ReportCommentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [reportDetails, setReportDetails] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch existing report when dialog opens
  useEffect(() => {
    if (open && commentId) {
      setLoadingReport(true);
      const fetchExistingReport = async () => {
        try {
          const { db } = await import("@/integrations/firebase/config");
          const { collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore");
          
          // Check for existing report
          const reportsRef = collection(db, "comment_reports");
          const q = query(reportsRef, where("commentId", "==", commentId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const reportDoc = querySnapshot.docs[0];
            const reportData = { id: reportDoc.id, ...reportDoc.data() };
            setExistingReport(reportData);
            
            // Fetch details subcollection
            const detailsRef = collection(db, `comment_reports/${reportDoc.id}/details`);
            const detailsQ = query(detailsRef, orderBy("createdAt", "desc"));
            const detailsSnapshot = await getDocs(detailsQ);
            const details = detailsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReportDetails(details);
          } else {
            setExistingReport(null);
            setReportDetails([]);
          }
        } catch (error) {
          console.error("Error fetching existing report:", error);
        } finally {
          setLoadingReport(false);
        }
      };
      fetchExistingReport();
    } else {
      setExistingReport(null);
      setReportDetails([]);
    }
  }, [open, commentId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be signed in to report a comment");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    if (!details.trim()) {
      toast.error("Please provide details about your report");
      return;
    }

    setSubmitting(true);
    try {
      const { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } = await import("firebase/firestore");
      const { db } = await import("@/integrations/firebase/config");

      // First, check if there's already ANY open report for this comment (single report per comment)
      const reportsRef = collection(db, "comment_reports");
      const existingCommentQuery = query(
        reportsRef,
        where("commentId", "==", commentId),
        where("status", "in", ["pending", "reviewed"]) // Only check open reports
      );
      
      const existingCommentReports = await getDocs(existingCommentQuery);
      
      if (existingCommentReports.docs.length > 0) {
        // A report already exists for this comment
        const existingReport = existingCommentReports.docs[0];
        const reportId = existingReport.id;
        const reportData = existingReport.data();
        
        // Add new reporter details to subcollection
        await addDoc(collection(db, "comment_reports", reportId, "details"), {
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reporterEmail: user.email,
          reason: reason,
          details: details.trim(),
          createdAt: serverTimestamp(),
        });
        
        // Increment reportCount (new user reporting)
        // If same reason, increment reasonCount too
        const isSameReason = reportData.reason === reason;
        await updateDoc(existingReport.ref, {
          reportCount: increment(1),
          ...(isSameReason ? { reasonCount: increment(1) } : {}),
          updatedAt: serverTimestamp(),
        });
        
        toast.success(`Added your report to existing complaint. ${reportData.reportCount + 1} users have reported this comment.`);
      } else {
        // Create new report if none exists for this comment
        const newReportRef = await addDoc(reportsRef, {
          commentId,
          commentText,
          commentAuthorName,
          commentAuthorId: commentAuthorId || '',
          issueId,
          issueTitle,
          issueOwnerId,
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reporterEmail: user.email,
          reason,
          details: details.trim(),
          status: "pending",
          reportCount: 1,
          reasonCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Optimistic update: immediately add to reviewable-reports cache for instant UI feedback
        const newReport = {
          id: newReportRef.id,
          commentId,
          commentText,
          commentAuthorName,
          commentAuthorId: commentAuthorId || '',
          issueId,
          issueTitle,
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reason,
          details: details.trim(),
          status: "pending",
          reportCount: 1,
          reasonCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData(['reviewable-reports'], (oldData: any[] | undefined) => {
          return oldData ? [newReport, ...oldData] : [newReport];
        });

        toast.success("Comment reported successfully. Thank you for helping maintain community standards.");
      }
      
      // Refresh the reports to get updated data
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      
      // Reset form
      setReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting comment report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold">Report Comment</DialogTitle>
          <DialogDescription className="text-base">
            Let us know why this comment is problematic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Existing Report Info */}
          {loadingReport && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">Loading existing reports...</p>
            </Card>
          )}
          
          {existingReport && !loadingReport && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-2">Existing Reports</h4>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p>
                      <span className="font-medium">{existingReport.reportCount || 0}</span> {existingReport.reportCount === 1 ? 'user has' : 'users have'} already reported this comment.
                    </p>
                    
                    {reportDetails.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-2">Reported reasons:</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(reportDetails.map(d => d.reason))).map((reason) => {
                            const count = reportDetails.filter(d => d.reason === reason).length;
                            const label = REPORT_REASONS.find(r => r.value === reason)?.label || reason;
                            return (
                              <Badge key={reason} variant="outline" className="bg-white">
                                {label} {count > 1 && `(${count}x)`}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <p className="mt-3 text-xs">
                      Your report will add to this case and help moderators take appropriate action.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Comment Preview */}
          <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold mb-2">COMMENT</p>
            <p className="text-sm text-slate-900 italic leading-relaxed">"{commentText}"</p>
            <p className="text-xs text-slate-600 mt-2">By <span className="font-semibold">{commentAuthorName}</span> on {issueTitle}</p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="h-10">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-semibold">Explain why *</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly explain what's wrong with this comment."
              className="min-h-[90px] resize-none text-sm"
              maxLength={400}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Be specific and honest</p>
              <p className="text-xs text-slate-500">{details.length}/400</p>
            </div>
          </div>

          {/* Community Moderation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-blue-900">How Community Moderation Works</p>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold text-red-600 flex-shrink-0">⚠</span>
                <p><span className="font-semibold">10+ Reports</span> → Comment automatically removed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
            className="px-5 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason || !details.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 h-9 text-sm font-semibold"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
