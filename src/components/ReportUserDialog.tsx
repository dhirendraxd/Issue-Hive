import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
  context?: {
    issueId?: string;
    issueTitle?: string;
    commentId?: string;
    commentText?: string;
  };
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "fake_issues", label: "Creating fake or malicious issues" },
  { value: "abusive_messages", label: "Abusive private messages" },
  { value: "misinformation", label: "Spreading misinformation" },
  { value: "other", label: "Other (please specify)" },
];

export default function ReportUserDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  context,
}: ReportUserDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [reportDetails, setReportDetails] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch existing report when dialog opens
  useEffect(() => {
    if (open && reportedUserId) {
      setLoadingReport(true);
      const fetchExistingReport = async () => {
        try {
          const { db } = await import("@/integrations/firebase/config");
          const { collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore");
          
          // Check for existing report
          const reportsRef = collection(db, "reports");
          const q = query(reportsRef, where("reportedUserId", "==", reportedUserId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const reportDoc = querySnapshot.docs[0];
            const reportData = { id: reportDoc.id, ...reportDoc.data() };
            setExistingReport(reportData);
            
            // Fetch details subcollection
            const detailsRef = collection(db, `reports/${reportDoc.id}/details`);
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
  }, [open, reportedUserId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be signed in to report a user");
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
    toast.loading("Submitting report...", { id: 'report-submit' });
    try {
      const { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } = await import("firebase/firestore");
      const { db } = await import("@/integrations/firebase/config");

      // First, check if there's already ANY open report for this user (single report per user)
      const reportsRef = collection(db, "reports");
      const existingUserQuery = query(
        reportsRef,
        where("reportedUserId", "==", reportedUserId),
        where("status", "in", ["pending", "reviewed"]) // Only check open reports
      );
      
      const existingUserReports = await getDocs(existingUserQuery);
      
      if (existingUserReports.docs.length > 0) {
        // A report already exists for this user
        const existingReport = existingUserReports.docs[0];
        const reportId = existingReport.id;
        const reportData = existingReport.data();
        
        // Add new reporter details to subcollection
        await addDoc(collection(db, "reports", reportId, "details"), {
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reporterEmail: user.email,
          reason: reason,
          details: details.trim(),
          evidence: evidence.trim() || null,
          context: context || null,
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
        
        toast.success(`Added your report to existing complaint. ${reportData.reportCount + 1} users have reported this person.`, { id: 'report-submit' });
      } else {
        // Create new report if none exists
        const newReportRef = await addDoc(reportsRef, {
          reportedUserId,
          reportedUserName,
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reporterEmail: user.email,
          reason,
          details: details.trim(),
          evidence: evidence.trim() || null,
          context: context || null,
          status: "pending",
          reportCount: 1,
          reasonCount: 1,
          upvotes: 0,
          downvotes: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Add initial reporter details to subcollection
        await addDoc(collection(db, "reports", newReportRef.id, "details"), {
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reporterEmail: user.email,
          reason: reason,
          details: details.trim(),
          evidence: evidence.trim() || null,
          context: context || null,
          createdAt: serverTimestamp(),
        });

        // Optimistic update: immediately add to reviewable-reports cache for instant UI feedback
        const newReport = {
          id: newReportRef.id,
          reportedUserId,
          reportedUserName,
          reporterId: user.uid,
          reporterName: user.displayName || "Anonymous",
          reason,
          details: details.trim(),
          status: "pending",
          reportCount: 1,
          reasonCount: 1,
          upvotes: 0,
          downvotes: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData(['reviewable-reports'], (oldData: any[] | undefined) => {
          return oldData ? [newReport, ...oldData] : [newReport];
        });

        toast.success("Report submitted successfully. Thank you for helping keep our community safe.", { id: 'report-submit' });
      }
      
      // Refresh the reports to get updated data
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      
      // Reset form
      setReason("");
      setDetails("");
      setEvidence("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.", { id: 'report-submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setDetails("");
    setEvidence("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold">Report {reportedUserName}</DialogTitle>
          <DialogDescription className="text-base">
            Tell us why you're reporting this user. Be specific and honest.
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
                      <span className="font-medium">{existingReport.reportCount || 0}</span> {existingReport.reportCount === 1 ? 'user has' : 'users have'} already reported this account.
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

          {/* Issue Context - Only show if available */}
          {context?.issueTitle && (
            <div className="bg-slate-100 rounded-lg p-3">
              <p className="text-xs text-slate-600 font-semibold mb-1">RELATED TO</p>
              <p className="text-sm text-slate-900 font-medium">{context.issueTitle}</p>
            </div>
          )}

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
            <Label htmlFor="details" className="text-sm font-semibold">Details *</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what happened. Include specific examples or dates if possible."
              className="min-h-[100px] resize-none text-sm"
              maxLength={800}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Be specific to help moderators</p>
              <p className="text-xs text-slate-500">{details.length}/800</p>
            </div>
          </div>

          {/* Community Moderation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-blue-900">How Community Moderation Works</p>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold text-green-600 flex-shrink-0">✓</span>
                <p><span className="font-semibold">25+ Upvotes</span> → User action taken</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-orange-600 flex-shrink-0">✗</span>
                <p><span className="font-semibold">25+ Downvotes</span> → Report dismissed</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Important:</span> False reports may result in action against your account. Be truthful.
            </p>
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
