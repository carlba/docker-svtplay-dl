import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshPlex } from './plex.js';

const getMock = vi.fn();
const postMock = vi.fn();
const extendMock = vi.fn(() => ({ get: getMock, post: postMock }));

vi.mock('got', () => ({
  default: { extend: extendMock },
  __esModule: true,
}));

const config = {
  commands: [],
  outputDir: '/tmp',
  cronPattern: undefined,
  plexUrl: 'http://localhost',
  plexToken: 'test-token',
  plexSectionId: '1',
  plexBasePath: '/streaming/svt',
  pushoverUrl: 'https://api.pushover.net/1/messages.json',
  pushoverToken: 'push-token',
  pushoverUser: 'push-user',
};

describe('refreshPlex', () => {
  beforeEach(() => {
    extendMock.mockClear();
    getMock.mockClear();
    postMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes Plex and sends a Pushover notification when refresh succeeds', async () => {
    getMock.mockResolvedValueOnce({ statusCode: 200 });
    postMock.mockResolvedValueOnce({ statusCode: 200 });

    const result = await refreshPlex('/downloads', config, 'The cause');

    expect(result).toBe(true);
    expect(extendMock).toHaveBeenCalledTimes(2);
    expect(getMock).toHaveBeenCalledWith('library/sections/1/refresh', {
      searchParams: { path: '/downloads' },
    });
    expect(postMock).toHaveBeenCalledWith(config.pushoverUrl, {
      form: { title: 'yt-dlp -> Plex Refresh', message: 'The cause' },
    });
  });

  it('skips Plex refresh when PLEX_TOKEN is missing', async () => {
    const partialConfig = { ...config, plexToken: undefined };

    const result = await refreshPlex('/downloads', partialConfig, 'The cause');

    expect(result).toBe(false);
    expect(extendMock).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });
});
