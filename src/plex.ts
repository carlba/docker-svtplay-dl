import got, { HTTPError } from 'got';

export interface PlexConfig {
  plexUrl: string;
  plexToken?: string;
  plexSectionId?: string;
  pushoverUrl: string;
  pushoverToken?: string;
  pushoverUser?: string;
}

export const httpClient = got.extend({
  headers: {
    'user-agent': 'docker-svtplay-dl/0.1.0',
  },
  retry: {
    limit: 2,
    methods: ['GET', 'POST'],
  },
  throwHttpErrors: false,
});

async function fetchStatus(url: string, searchParams: Record<string, string>): Promise<number> {
  try {
    const response = await httpClient.get(url, { searchParams });
    return response.statusCode ?? 0;
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw new Error(`Failed Plex request to ${url}: ${error.response.statusCode}`, {
        cause: error,
      });
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`Failed Plex request to ${url}: ${String(error)}`, {
      cause: error,
    });
  }
}

async function refreshSection(config: PlexConfig, label: string, path: string): Promise<boolean> {
  if (!config.plexSectionId) {
    console.log(`WARNING: PLEX_SECTION_ID missing, skipping Plex refresh for ${label}`);
    return false;
  }

  const url = `${config.plexUrl}/library/sections/${config.plexSectionId}/refresh`;
  const params: Record<string, string> = {
    'X-Plex-Token': config.plexToken ?? '',
  };
  if (path) {
    params.path = path;
  }
  const status = await fetchStatus(url, params);

  console.log(`Plex refresh HTTP status for ${label}: ${status}`);
  if (status === 200 || status === 201 || status === 204) {
    return true;
  }

  console.log(`WARNING: Plex refresh request failed for ${label} (HTTP ${status})`);
  return false;
}

async function notifyPushover(config: PlexConfig, message: string): Promise<void> {
  if (!config.pushoverToken || !config.pushoverUser) {
    return;
  }

  const form = new URLSearchParams({
    token: config.pushoverToken,
    user: config.pushoverUser,
    title: 'svtplay-dl -> Plex Refresh',
    message,
  });

  try {
    const response = await httpClient.post(config.pushoverUrl, {
      form,
    });

    if (response.statusCode === 200) {
      console.log('Pushover notification sent');
    } else {
      console.log(`WARNING: Pushover notification failed (${response.statusCode})`);
    }
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      console.log(`WARNING: Failed to send Pushover notification (${error.response.statusCode})`);
      return;
    }

    const messageString = error instanceof Error ? error.message : String(error);
    console.log(`WARNING: Failed to send Pushover notification (${messageString})`);
  }
}

export async function refreshPlex(
  config: PlexConfig,
  downloadPath: string,
  reason: string
): Promise<boolean> {
  if (!config.plexToken) {
    console.log('WARNING: PLEX_TOKEN missing, skipping Plex refresh');
    return false;
  }

  const success = await refreshSection(config, 'svtplay-dl', downloadPath || '');

  if (success) {
    await notifyPushover(config, reason);
  }

  return success;
}
