import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Send, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useCreateConversation, useSendMessage } from '@/hooks/use-messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName?: string;
  targetUserAvatar?: string;
}

export default function SendMessageDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName = 'User',
  targetUserAvatar,
}: SendMessageDialogProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  if (!user) return null;

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (message.trim().length > 5000) {
      toast.error('Message is too long (max 5000 characters)');
      return;
    }

    try {
      // Create or get existing conversation
      const conversationId = await createConversation.mutateAsync(targetUserId);
      
      // Send message
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim(),
      });

      toast.success('Message sent!');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to send message';
      toast.error(err);
    }
  };

  const isLoading = createConversation.isPending || sendMessage.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
        </DialogHeader>

        {/* Recipient Info */}
        <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-200/50">
          <Avatar className="h-10 w-10 border border-orange-200">
            <AvatarImage src={targetUserAvatar} alt={targetUserName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-400 text-white text-xs font-bold">
              {targetUserName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{targetUserName}</p>
            <p className="text-xs text-muted-foreground">Send a direct message</p>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-medium">
            Your Message
          </Label>
          <Textarea
            id="message"
            placeholder="Type your message here... (Cannot be edited once sent - max 5000 characters)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            className="min-h-24 resize-none rounded-lg border border-orange-200/50 focus:border-orange-400 focus:ring-orange-500/20"
          />
          <div className="text-xs text-muted-foreground text-right">
            {message.length} / 5000
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Start a conversation with {targetUserName}. They'll be notified of your message.
          </AlertDescription>
        </Alert>

        {/* Warning Alert */}
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            <span className="font-semibold">⚠️ Note:</span> Messages cannot be edited or deleted once sent.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (message.trim() && confirm('Messages cannot be edited or deleted once sent. Are you sure?')) {
                handleSendMessage();
              }
            }}
            disabled={isLoading || !message.trim()}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message (Permanent)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
