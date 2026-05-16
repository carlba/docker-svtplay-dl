import { pathToFileURL } from 'node:url';
import { Cron } from 'croner';
import path from 'node:path';
import { getConfig, type Config } from './lib/config.js';
import { refreshPlex } from './lib/plex.js';
import { ensureOutputDir, runCommand } from './lib/command.js';
import { envSchema } from './schema.js';

function setupSignalForwarding(controller: AbortController): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  for (const signal of signals) {
    process.on(signal, () => {
      controller.abort(signal);
      process.exit(0);
    });
  }
}

export async function runOnce(config: Config, signal?: AbortSignal): Promise<void> {
  await ensureOutputDir(config.outputDir);

  for (const command of config.commands) {
    console.log(`Running: ${command}`);
    const changedFiles = await runCommand(command, config.outputDir, signal);

    if (changedFiles.length > 0) {
      console.log(`Detected ${changedFiles.length} new/changed file(s) after command.`);
      try {
        await refreshPlex(
          path.join(config.plexBasePath, path.dirname(changedFiles[0])),
          config,
          `New episodes were downloaded ${['\n', ...changedFiles].join('\n')}`
        );
      } catch (error) {
        console.error('Plex refresh failed:', error);
      }
    } else {
      console.log('No file changes detected after command, skipping Plex refresh.');
    }
  }
}

async function run(config: Config, signal?: AbortSignal): Promise<void> {
  const cronPattern = config.cronPattern;
  if (!cronPattern) {
    await runOnce(config, signal);
    return;
  }

  console.log(`Scheduling downloads with CRON_PATTERN='${cronPattern}'`);
  await runOnce(config, signal);

  new Cron(cronPattern, async () => {
    try {
      await runOnce(config, signal);
    } catch (error) {
      console.error('Scheduled run failed:', error);
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const abortController = new AbortController();
  setupSignalForwarding(abortController);
  run(getConfig(envSchema), abortController.signal).catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
