import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface ReportCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
  commentText: string;
  commentAuthorName: string;
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
  issueId,
  issueTitle,
  issueOwnerId,
}: ReportCommentDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/integrations/firebase/config");

      await addDoc(collection(db, "comment_reports"), {
        commentId,
        commentText,
        commentAuthorName,
        issueId,
        issueTitle,
        issueOwnerId,
        reporterId: user.uid,
        reporterName: user.displayName || "Anonymous",
        reporterEmail: user.email,
        reason,
        details: details.trim(),
        status: "pending", // pending, reviewed, resolved, deleted
        reportCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Comment reported successfully. Thank you for helping maintain community standards.");
      
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold">Report Comment</DialogTitle>
          <DialogDescription className="text-base">
            Let us know why this comment is problematic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
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
