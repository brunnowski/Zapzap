
export interface Message {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  isMe: boolean;
  type: 'text' | 'image' | 'system';
}

export interface ChatStats {
  totalMessages: number;
  topWords: { word: string; count: number }[];
  messageCountBySender: Record<string, number>;
  sentimentSummary: string;
  milestones: string[];
}

export interface ChatSession {
  id: string;
  partnerName: string;
  messages: Message[];
  createdAt: Date;
}
