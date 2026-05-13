const PLEX_URL = process.env['PLEX_URL'] ?? 'http://plex:32400';
const PLEX_TOKEN = process.env['PLEX_TOKEN'] ?? '';
const PLEX_SECTION_ID = process.env['PLEX_SECTION_ID'] ?? '';
const PUSHOVER_URL = process.env['PUSHOVER_URL'] ?? 'https://api.pushover.net/1/messages.json';
const PUSHOVER_TOKEN = process.env['PUSHOVER_TOKEN'] ?? '';
const PUSHOVER_USER = process.env['PUSHOVER_USER'] ?? '';

async function fetchStatus(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'GET' });
    return response.status || 0;
  } catch {
    return 0;
  }
}

function buildRefreshUrl(sectionId: string, path: string): string {
  const query = new URLSearchParams({ 'X-Plex-Token': PLEX_TOKEN });
  if (path) {
    query.append('path', path);
  }
  return `${PLEX_URL}/library/sections/${sectionId}/refresh?${query.toString()}`;
}

async function refreshSection(sectionId: string, label: string, path: string): Promise<boolean> {
  if (!sectionId) {
    console.log(`WARNING: PLEX_SECTION_ID missing, skipping Plex refresh for ${label}`);
    return false;
  }

  const url = buildRefreshUrl(sectionId, path);
  const status = await fetchStatus(url);

  console.log(`Plex refresh HTTP status for ${label}: ${status}`);
  if (status === 200 || status === 201 || status === 204) {
    return true;
  }

  console.log(`WARNING: Plex refresh request failed for ${label} (HTTP ${status})`);
  return false;
}

async function notifyPushover(message: string): Promise<void> {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) {
    return;
  }

  const form = new URLSearchParams({
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    title: 'svtplay-dl -> Plex Refresh',
    message
  });

  try {
    const response = await fetch(PUSHOVER_URL, {
      method: 'POST',
      body: form
    });

    if (response.status === 200) {
      console.log('Pushover notification sent');
    } else {
      console.log(`WARNING: Pushover notification failed (${response.status})`);
    }
  } catch (error: unknown) {
    const messageString =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
    console.log(`WARNING: Failed to send Pushover notification (${messageString})`);
  }
}

export async function refreshPlex(downloadPath: string, reason: string): Promise<boolean> {
  if (!PLEX_TOKEN) {
    console.log('WARNING: PLEX_TOKEN missing, skipping Plex refresh');
    return false;
  }

  const path = downloadPath || '';
  const success = await refreshSection(PLEX_SECTION_ID, 'svtplay-dl', path);

  if (success) {
    await notifyPushover(reason);
  }

  return success;
}
