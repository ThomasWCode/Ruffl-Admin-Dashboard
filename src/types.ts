export type Page = 'overview' | 'users' | 'commissions' | 'disputes' | 'chats' | 'audit';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'commissioner' | 'maker' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  suspendedUntil?: string;
  suspensionReason?: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  title: string;
  commissionerId: string;
  makerId: string;
  suitType: string;
  status: string;
  budget: number;
  agreedTotal?: number;
  depositPaid: boolean;
  updatedAt: string;
}

export interface Material {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

export interface MediaAttachment {
  url: string;
  name: string;
  contentType: string;
}

export interface DisputeEvidence {
  id: string;
  authorId: string;
  message: string;
  attachments: MediaAttachment[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  commissionId: string;
  raisedById: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  explanation: string;
  evidence: DisputeEvidence[];
  outcome?: string;
  resolution?: string;
  createdAt: string;
  commission?: Commission;
  materials: Material[];
}

export type DisputeOutcome =
  | 'maker_favoured'
  | 'commissioner_favoured'
  | 'split_decision'
  | 'commission_cancelled'
  | 'no_resolution';

export interface Conversation {
  id: string;
  kind: 'commission' | 'direct' | 'dispute' | 'admin';
  participantIds: string[];
  commissionId?: string;
  lastMessage: null | {
    text: string;
    attachments: MediaAttachment[];
    createdAt: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments: MediaAttachment[];
  createdAt: string;
}

export interface AdminAuditEvent {
  id: string;
  adminId: string;
  targetUserId?: string;
  action: string;
  details: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface Overview {
  counts: {
    users: number;
    activeCommissions: number;
    openDisputes: number;
    unreadAdminChats: number;
  };
  recentCommissions: Commission[];
  recentDisputes: Dispute[];
}
