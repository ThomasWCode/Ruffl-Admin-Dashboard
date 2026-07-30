import type {
  AdminAuditEvent,
  Commission,
  Conversation,
  Dispute,
  Message,
  Overview,
  User,
} from './types';

const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
let sessionFailureHandler: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

export function setSessionFailureHandler(handler: (() => void) | null): void {
  sessionFailureHandler = handler;
}

function parseJson<T>(text: string): (T & { message?: string; code?: string }) | null {
  try {
    return JSON.parse(text) as T & { message?: string; code?: string };
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  csrfToken?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      'Could not reach the Ruffl API. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    );
  }

  const payload = parseJson<T>(await response.text());
  if (!response.ok) {
    if (response.status === 401 && token) sessionFailureHandler?.();
    throw new ApiError(
      payload?.message ?? 'The Ruffl API returned an unexpected response. Please try again.',
      response.status,
      payload?.code ?? 'REQUEST_FAILED',
    );
  }
  if (!payload) {
    throw new ApiError(
      'The Ruffl API returned an unexpected response. Please try again.',
      response.status,
      'INVALID_RESPONSE',
    );
  }
  return payload;
}

export function createAdminApi(token: string) {
  let csrfToken = '';

  const mutate = async <T>(
    path: string,
    method: 'POST' | 'DELETE',
    body: Record<string, unknown> = {},
  ): Promise<T> => {
    if (!csrfToken) {
      csrfToken = (await request<{ csrfToken: string }>('/admin/csrf', {}, token)).csrfToken;
    }
    try {
      return await request<T>(
        path,
        { method, body: JSON.stringify(body) },
        token,
        csrfToken,
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CSRF_INVALID') {
        csrfToken = (await request<{ csrfToken: string }>('/admin/csrf', {}, token)).csrfToken;
        return request<T>(path, { method, body: JSON.stringify(body) }, token, csrfToken);
      }
      throw error;
    }
  };

  return {
    me: () => request<{ user: User }>('/me', {}, token),
    overview: () => request<Overview>('/admin/overview', {}, token),
    users: (search = '', status = '') =>
      request<{ users: User[] }>(
        `/admin/users?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
        {},
        token,
      ),
    audit: () => request<{ events: AdminAuditEvent[] }>('/admin/audit', {}, token),
    commissions: () => request<{ commissions: Commission[] }>('/commissions', {}, token),
    disputes: () => request<{ disputes: Dispute[] }>('/admin/disputes', {}, token),
    conversations: () => request<{ conversations: Conversation[] }>('/conversations', {}, token),
    messages: (conversationId: string) =>
      request<{ messages: Message[] }>(
        `/conversations/${conversationId}/messages`,
        {},
        token,
      ),
    sendMessage: (conversationId: string, text: string) =>
      mutate<{ message: Message }>(
        `/conversations/${conversationId}/messages`,
        'POST',
        { text },
      ),
    warn: (userId: string, message: string) =>
      mutate(`/admin/users/${userId}/warn`, 'POST', { message }),
    suspend: (userId: string, hours: number, reason: string) =>
      mutate(`/admin/users/${userId}/suspend`, 'POST', { hours, reason }),
    unsuspend: (userId: string) => mutate(`/admin/users/${userId}/unsuspend`, 'POST'),
    softDelete: (userId: string) => mutate(`/admin/users/${userId}`, 'DELETE'),
    permanentlyDelete: (userId: string) =>
      mutate(`/admin/users/${userId}`, 'DELETE', { permanent: true }),
    startConversation: (userId: string) =>
      mutate<{ conversation: Conversation }>(
        `/admin/users/${userId}/conversation`,
        'POST',
      ),
    assignDispute: (id: string) => mutate(`/admin/disputes/${id}/assign`, 'POST'),
    resolveDispute: (id: string, outcome: string, resolution: string) =>
      mutate(`/admin/disputes/${id}/resolve`, 'POST', { outcome, resolution }),
    closeDispute: (id: string) => mutate(`/admin/disputes/${id}/close`, 'POST'),
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
