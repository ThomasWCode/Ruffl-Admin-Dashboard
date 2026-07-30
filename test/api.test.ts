import { afterEach, describe, expect, it, vi } from 'vitest';

import { authApi, createAdminApi, setSessionFailureHandler } from '../src/api';

describe('admin API session handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setSessionFailureHandler(null);
  });

  it('notifies the dashboard when an authenticated session expires', async () => {
    const handler = vi.fn();
    setSessionFailureHandler(handler);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'UNAUTHENTICATED',
            message: 'Your session has expired. Sign in again.',
          }),
          { status: 401 },
        ),
      ),
    );

    await expect(createAdminApi('expired-token').me()).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('replaces non-JSON server responses with a readable API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>Method not allowed</body></html>', {
          status: 405,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(authApi.login('admin@example.com', 'password')).rejects.toMatchObject({
      code: 'REQUEST_FAILED',
      message: 'The Ruffl API returned an unexpected response. Please try again.',
      status: 405,
    });
  });

  it('replaces fetch failures with a readable network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(authApi.login('admin@example.com', 'password')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the Ruffl API. Check your connection and try again.',
      status: 0,
    });
  });
});
