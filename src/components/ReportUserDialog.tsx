import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  };
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "fake_issues", label: "Creating fake or malicious issues" },
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
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
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
        context: context || null,
        status: "pending", // pending, reviewed, resolved, dismissed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Report submitted successfully. Thank you for helping keep our community safe.");
      
      // Reset form
      setReason("");
      setDetails("");
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Flag className="h-5 w-5 text-red-500" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Report <span className="font-semibold">{reportedUserName}</span> for violating community guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Context Information */}
          {context?.issueTitle && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Regarding issue:</p>
              <p className="font-medium truncate">{context.issueTitle}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
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
            <Label htmlFor="details">Additional details *</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide specific details about why you're reporting this user. Include any relevant context or examples."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}/1000 characters
            </p>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-900 text-xs">
              False reports may result in action against your account. Reports are reviewed by moderators.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason || !details.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
