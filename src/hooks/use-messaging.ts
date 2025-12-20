import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

import type { Timestamp } from 'firebase/firestore';
export interface ConversationDoc {
  participants: string[];
  createdAt?: Timestamp | number;
}
export interface MessageDoc {
  senderId: string;
  content: string;
  createdAt?: Timestamp | number;
}

export interface SentMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverName: string;
  receiverAvatar?: string;
  content: string;
  createdAt?: Timestamp | number;
  otherUserId?: string;
}

export interface ReceivedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt?: Timestamp | number;
  otherUserId?: string;
}

const toMillis = (value?: Timestamp | number) => {
  if (typeof value === 'number') return value;
  if (value && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  return 0;
};

export function useUserConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversations', user?.uid],
    enabled: !!user && !!db,
    queryFn: async () => {
      if (!user || !db) return [] as ConversationDoc[];
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as ConversationDoc) }));
    }
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId && !!db,
    queryFn: async () => {
      if (!conversationId || !db) return [] as MessageDoc[];
      const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as MessageDoc) }));
    },
    refetchInterval: 5000 // simple polling; could upgrade to onSnapshot later
  });
}

export function useCreateConversation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user || !db) throw new Error('Not signed in or DB missing');
      if (targetUserId === user.uid) throw new Error('Cannot DM yourself');
      // Check if conversation already exists
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const existing = snap.docs.find(docSnap => {
        const data = docSnap.data() as ConversationDoc;
        return data.participants.includes(targetUserId) && data.participants.length === 2;
      });
      if (existing) return existing.id;
      const newRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, targetUserId],
        createdAt: serverTimestamp()
      });
      qc.invalidateQueries({ queryKey: ['conversations', user.uid] });
      return newRef.id;
    }
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { conversationId: string; content: string }) => {
      if (!user || !db) throw new Error('Not signed in or DB missing');
      const convRef = doc(db, 'conversations', params.conversationId);
      const convSnap = await getDoc(convRef);
      if (!convSnap.exists()) throw new Error('Conversation not found');
      const conv = convSnap.data() as ConversationDoc;
      if (!conv.participants.includes(user.uid)) throw new Error('Not a participant');
      if (!params.content.trim()) throw new Error('Empty message');
      await addDoc(collection(db, 'conversations', params.conversationId, 'messages'), {
        senderId: user.uid,
        content: params.content.trim(),
        createdAt: serverTimestamp()
      });
      return true;
    }
  });
}

export function useSentMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sentMessages', user?.uid],
    enabled: !!user && !!db,
    queryFn: async () => {
      if (!user || !db) return [];
      
      try {
        const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
        const conversationSnaps = await getDocs(q);
        
        const allMessages: SentMessage[] = [];
        
        for (const convDoc of conversationSnaps.docs) {
          const convData = convDoc.data() as ConversationDoc;
          const otherUserId = convData.participants.find(id => id !== user.uid);
          
          if (otherUserId) {
            const receiverDocRef = doc(db, 'users', otherUserId);
            const receiverDoc = await getDoc(receiverDocRef);
            const receiverData = receiverDoc.data() || {};
            
            const messagesQuery = query(
              collection(db, 'conversations', convDoc.id, 'messages'),
              where('senderId', '==', user.uid)
            );
            const messageSnaps = await getDocs(messagesQuery);
            
            messageSnaps.docs.forEach(msgDoc => {
              const msgData = msgDoc.data() as MessageDoc;
              allMessages.push({
                id: msgDoc.id,
                conversationId: convDoc.id,
                senderId: msgData.senderId,
                receiverName: receiverData.displayName || 'Anonymous',
                receiverAvatar: receiverData.photoURL,
                content: msgData.content,
                createdAt: msgData.createdAt,
                otherUserId
              });
            });
          }
        }
        
        return allMessages.sort((a, b) => {
          const aTime = toMillis(a.createdAt);
          const bTime = toMillis(b.createdAt);
          return bTime - aTime;
        });
      } catch (error) {
        console.error('Error fetching sent messages:', error);
        return [];
      }
    },
    refetchInterval: 5000
  });
}

export function useReceivedMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['receivedMessages', user?.uid],
    enabled: !!user && !!db,
    queryFn: async () => {
      if (!user || !db) return [];
      
      try {
        // Get all conversations for this user
        const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
        const conversationSnaps = await getDocs(q);
        
        const allMessages: ReceivedMessage[] = [];
        
        // For each conversation, get messages from other users
        for (const convDoc of conversationSnaps.docs) {
          const convData = convDoc.data() as ConversationDoc;
          const otherUserId = convData.participants.find(id => id !== user.uid);
          
          if (otherUserId) {
            // Fetch sender profile details
            const senderDocRef = doc(db, 'users', otherUserId);
            const senderDoc = await getDoc(senderDocRef);
            const senderData = senderDoc.data() || {};
            
            // Remove orderBy to avoid composite index requirement
            const messagesQuery = query(
              collection(db, 'conversations', convDoc.id, 'messages'),
              where('senderId', '==', otherUserId)
            );
            const messageSnaps = await getDocs(messagesQuery);
            
            messageSnaps.docs.forEach(msgDoc => {
              const msgData = msgDoc.data() as MessageDoc;
              allMessages.push({
                id: msgDoc.id,
                conversationId: convDoc.id,
                senderId: msgData.senderId,
                senderName: senderData.displayName || 'Anonymous',
                senderAvatar: senderData.photoURL,
                content: msgData.content,
                createdAt: msgData.createdAt,
                otherUserId
              });
            });
          }
        }
        
        // Sort in memory instead (most recent first)
        return allMessages.sort((a, b) => {
          const aTime = toMillis(a.createdAt);
          const bTime = toMillis(b.createdAt);
          return bTime - aTime;
        });
      } catch (error) {
        console.error('Error fetching received messages:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    refetchInterval: 5000
  });
}
