import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAdminApi, setSessionFailureHandler } from '../src/api';

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
});
