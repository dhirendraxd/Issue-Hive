import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/integrations/firebase/config");

      await addDoc(collection(db, "reports"), {
        reportedUserId,
        reportedUserName,
        reporterId: user.uid,
        reporterName: user.displayName || "Anonymous",
        reporterEmail: user.email,
        reason,
        details: details.trim(),
        evidence: evidence.trim() || null,
        context: context || null,
        status: "pending", // pending, reviewed, resolved, dismissed
        upvotes: 0,
        downvotes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Report submitted successfully. Thank you for helping keep our community safe.");
      
      // Invalidate queries to refresh reports
      await queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      
      // Reset form
      setReason("");
      setDetails("");
      setEvidence("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold">Report {reportedUserName}</DialogTitle>
          <DialogDescription className="text-base">
            Tell us why you're reporting this user. Be specific and honest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
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
