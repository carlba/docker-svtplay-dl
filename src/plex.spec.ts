import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient, refreshPlex } from './plex.js';

const config = {
  plexUrl: 'http://localhost',
  plexToken: 'test-token',
  plexSectionId: '1',
  pushoverUrl: 'https://api.pushover.net/1/messages.json',
  pushoverToken: 'push-token',
  pushoverUser: 'push-user',
};

describe('refreshPlex', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes Plex and sends a Pushover notification when refresh succeeds', async () => {
    const getMock = vi.spyOn(httpClient, 'get');
    const postMock = vi.spyOn(httpClient, 'post');

    getMock.mockResolvedValueOnce({ statusCode: 200 });
    postMock.mockResolvedValueOnce({ statusCode: 200 });

    const result = await refreshPlex(config, '/downloads', 'fresh content');

    expect(result).toBe(true);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('skips Plex refresh when PLEX_TOKEN is missing', async () => {
    const getMock = vi.spyOn(httpClient, 'get');
    const postMock = vi.spyOn(httpClient, 'post');
    const partialConfig = { ...config, plexToken: undefined };

    const result = await refreshPlex(partialConfig, '/downloads', 'fresh content');

    expect(result).toBe(false);
    expect(getMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });
});
