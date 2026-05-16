import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';

import * as commandModule from './lib/command.js';
import * as plex from './lib/plex.js';
import { runOnce } from './index.js';
import type { Config } from './lib/config.js';

const baseConfig: Config = {
  commands: ['echo hello'],
  outputDir: '/mnt/downloads',
  cronPattern: undefined,
  plexUrl: 'http://plex:32400',
  plexToken: 'test-token',
  plexSectionId: '1',
  plexBasePath: '/streaming/svt',
  pushoverUrl: 'https://api.pushover.net/1/messages.json',
  pushoverToken: undefined,
  pushoverUser: undefined,
};

let tempOutputDir = '';

async function makeTempConfig(): Promise<Config> {
  tempOutputDir = await fs.mkdtemp(join(os.tmpdir(), 'docker-svtplay-dl-'));
  return { ...baseConfig, outputDir: tempOutputDir };
}

describe('runOnce', () => {
  afterEach(async () => {
    vi.restoreAllMocks();

    if (tempOutputDir) {
      await fs.rm(tempOutputDir, { recursive: true, force: true });
      tempOutputDir = '';
    }
  });

  it('refreshes Plex when a command creates new files', async () => {
    const config = await makeTempConfig();
    const runCommandMock = vi
      .spyOn(commandModule, 'runCommand')
      .mockResolvedValue(['new-file.mp4']);
    const refreshPlexMock = vi.spyOn(plex, 'refreshPlex').mockResolvedValue(true);

    await runOnce(config);

    expect(runCommandMock).toHaveBeenCalledOnce();
    expect(refreshPlexMock).toHaveBeenCalledWith(
      join('/streaming/svt', '.'),
      config,
      expect.stringContaining('New episodes were downloaded')
    );
  });

  it('should refresh Plex when a command produces files in a nested folder', async () => {
    const config = await makeTempConfig();
    const runCommandMock = vi
      .spyOn(commandModule, 'runCommand')
      .mockResolvedValue(['example-channel/new-video.mp4']);
    const refreshPlexMock = vi.spyOn(plex, 'refreshPlex').mockResolvedValue(true);

    await runOnce(config);

    expect(runCommandMock).toHaveBeenCalledOnce();
    expect(refreshPlexMock).toHaveBeenCalledTimes(1);
    expect(refreshPlexMock).toHaveBeenCalledWith(
      join('/streaming/svt', 'example-channel'),
      config,
      expect.stringContaining('New episodes were downloaded')
    );
  });

  it('does not refresh Plex when there are no changed files', async () => {
    const config = await makeTempConfig();
    const runCommandMock = vi.spyOn(commandModule, 'runCommand').mockResolvedValue([]);
    const refreshPlexMock = vi.spyOn(plex, 'refreshPlex').mockResolvedValue(true);

    await runOnce(config);

    expect(runCommandMock).toHaveBeenCalledOnce();
    expect(refreshPlexMock).not.toHaveBeenCalled();
  });
});
