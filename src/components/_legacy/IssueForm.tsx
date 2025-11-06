/**
 * DEPRECATED/UNUSED: Not referenced in current flows (no new-issue form in UI).
 * Keep for future reuse or remove if out of scope.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/types/issue";
import { useToast } from "@/components/ui/use-toast";

export default function IssueForm({
  onSubmit,
}: {
  onSubmit: (data: { title: string; description: string; category: IssueCategory; attachments?: string[] }) => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Facilities");
  const [attachment, setAttachment] = useState("");
  const valid = title.trim().length > 2 && description.trim().length > 10;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        await onSubmit({ title, description, category, attachments: attachment ? [attachment] : undefined });
        toast({ title: "Issue submitted", description: "Your issue has been added to the feed." });
        setTitle("");
        setDescription("");
        setAttachment("");
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief, clear title" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full min-h-28 text-sm border rounded-md px-3 py-2 bg-background"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What’s the issue? Why does it matter?"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Attachment URL (optional)</label>
          <Input value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={!valid}>Submit</Button>
      </div>
    </form>
  );
}
