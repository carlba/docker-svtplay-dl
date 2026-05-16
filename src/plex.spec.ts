import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import nock from 'nock';
import { refreshPlex } from './lib/plex.js';

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
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('refreshes Plex and sends a Pushover notification when refresh succeeds', async () => {
    const plexScope = nock(config.plexUrl)
      .get('/library/sections/1/refresh')
      .query({ path: '/downloads', 'X-Plex-Token': config.plexToken })
      .reply(200);

    let pushoverPayload: string | undefined;

    const pushoverScope = nock('https://api.pushover.net')
      .post('/1/messages.json')
      .reply(200, function (_uri, requestBody) {
        if (typeof requestBody === 'string') {
          pushoverPayload = requestBody;
        } else if (requestBody instanceof Buffer) {
          pushoverPayload = requestBody.toString('utf8');
        }
        return '';
      });

    const result = await refreshPlex('/downloads', config, 'The cause');

    expect(result).toBe(true);
    expect(plexScope.isDone()).toBe(true);
    expect(pushoverScope.isDone()).toBe(true);
    expect(pushoverPayload).toBeDefined();

    const payload = new URLSearchParams(pushoverPayload ?? '');
    expect(payload.get('title')).toBe('yt-dlp -> Plex Refresh');
    expect(payload.get('message')).toBe('The cause');
  });

  it('skips Plex refresh when PLEX_TOKEN is missing', async () => {
    const partialConfig = { ...config, plexToken: undefined };

    const result = await refreshPlex('/downloads', partialConfig, 'The cause');

    expect(result).toBe(false);
  });
});
