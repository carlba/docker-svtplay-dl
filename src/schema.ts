import { z } from 'zod';

const parseCommands = z.preprocess(
  (value: unknown) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  },
  z.array(z.string()).min(1, { message: 'SVTPLAY_DL_COMMANDS is required.' })
);

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform(value => (value === '' ? undefined : value));

export const envSchema = z
  .object({
    SVTPLAY_DL_COMMANDS: parseCommands,
    OUTPUT_DIR: z.string().trim().default('/downloads'),
    CRON_PATTERN: optionalString,
    PLEX_URL: z.string().trim().url().default('http://plex:32400'),
    PLEX_TOKEN: optionalString,
    PLEX_SECTION_ID: optionalString,
    PUSHOVER_URL: z.string().trim().url().default('https://api.pushover.net/1/messages.json'),
    PUSHOVER_TOKEN: optionalString,
    PUSHOVER_USER: optionalString,
  })
  .transform(raw => ({
    commands: raw.SVTPLAY_DL_COMMANDS,
    outputDir: raw.OUTPUT_DIR,
    cronPattern: raw.CRON_PATTERN,
    plexUrl: raw.PLEX_URL,
    plexToken: raw.PLEX_TOKEN,
    plexSectionId: raw.PLEX_SECTION_ID,
    pushoverUrl: raw.PUSHOVER_URL,
    pushoverToken: raw.PUSHOVER_TOKEN,
    pushoverUser: raw.PUSHOVER_USER,
  }));

export type Config = z.infer<typeof envSchema>;
