export type Page = 'overview' | 'users' | 'commissions' | 'disputes' | 'chats';

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

export interface Dispute {
  id: string;
  commissionId: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  explanation: string;
  outcome?: string;
  resolution?: string;
  createdAt: string;
  commission?: Commission;
  materials: Material[];
}

export interface Conversation {
  id: string;
  kind: 'commission' | 'direct' | 'dispute' | 'admin';
  participantIds: string[];
  commissionId?: string;
  lastMessage: null | { text: string; createdAt: string };
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
