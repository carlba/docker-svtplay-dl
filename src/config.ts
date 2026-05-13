export interface Config {
  commands: string[];
  outputDir: string;
  cronPattern?: string;
}

export function parseCommands(rawCommands: string): string[] {
  return rawCommands
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

export function loadConfig(): Config {
  const rawCommands = process.env.SVTPLAY_DL_COMMANDS?.trim();
  if (!rawCommands) {
    throw new Error('SVTPLAY_DL_COMMANDS is required.');
  }

  const outputDir = process.env.OUTPUT_DIR?.trim() || '/downloads';
  const cronPattern = process.env.CRON_PATTERN?.trim();

  return {
    commands: parseCommands(rawCommands),
    outputDir,
    cronPattern: cronPattern ? cronPattern : undefined
  };
}
