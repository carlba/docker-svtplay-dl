import { describe, expect, it } from 'vitest';
import { envSchema } from '../schema.js';
import { parseConfig } from './config.js';

describe('config module', () => {
  it('parses environment into typed config values', () => {
    const result = parseConfig(envSchema, {
      SVTPLAY_DL_COMMANDS: ' command one\ncommand two ',
      OUTPUT_DIR: ' /downloads ',
      CRON_PATTERN: '0 * * * *',
      PLEX_URL: 'http://plex:32400',
      PUSHOVER_URL: 'https://api.pushover.net/1/messages.json',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      commands: ['command one', 'command two'],
      outputDir: '/downloads',
      cronPattern: '0 * * * *',
      plexUrl: 'http://plex:32400',
      plexToken: undefined,
      plexSectionId: undefined,
      plexBasePath: '/streaming/svt',
      pushoverUrl: 'https://api.pushover.net/1/messages.json',
      pushoverToken: undefined,
      pushoverUser: undefined,
    });
  });

  it('produces a validation error when required config is missing', () => {
    const result = parseConfig(envSchema, {});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['SVTPLAY_DL_COMMANDS']);
  });
});
