import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { Cron } from 'croner';
import { buildCommandEnvironment, initConfig } from './lib/config.js';
import { envSchema, type Config } from './schema.js';
import { refreshPlex } from './plex.js';
import fs from 'node:fs/promises';

let currentChild: ChildProcess | null = null;

function forwardSignal(signal: NodeJS.Signals): void {
  if (currentChild && !currentChild.killed) {
    console.log(`Forwarding ${signal} to child process ${currentChild.pid}`);
    currentChild.kill(signal);
  }
}

function setupSignalForwarding(): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  for (const signal of signals) {
    process.on(signal, () => {
      forwardSignal(signal);
      process.exit(0);
    });
  }
}

async function ensureOutputDir(outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
}

async function listFiles(rootPath: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(rootPath, entry.name);
      if (entry.isDirectory()) {
        const nested = await listFiles(fullPath);
        for (const nestedPath of nested) {
          results.push(path.join(entry.name, nestedPath));
        }
      } else if (entry.isFile()) {
        results.push(entry.name);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(error, 'Error while listing files');
      return [];
    }
    throw error;
  }

  return results;
}

async function runCommand(command: string, outputDir: string): Promise<string[]> {
  const beforeFiles = new Set(await listFiles(outputDir));

  const child = spawn('sh', ['-c', command], {
    stdio: 'inherit',
    env: buildCommandEnvironment(outputDir),
  });

  currentChild = child;

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => {
      resolve(code ?? 0);
    });
  }).finally(() => {
    currentChild = null;
  });

  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}: ${command}`);
  }

  const afterFiles = await listFiles(outputDir);
  return afterFiles.filter(file => !beforeFiles.has(file));
}

async function runCommands(config: Config, commands: string[], outputDir: string): Promise<void> {
  for (const command of commands) {
    console.log(`Running: ${command}`);
    const changedFiles = await runCommand(command, outputDir);

    if (changedFiles.length > 0) {
      console.log(`Detected ${changedFiles.length} new/changed file(s) after command.`);
      try {
        await refreshPlex(
          config,
          outputDir,
          `New episodes were downloaded ${JSON.stringify(changedFiles)}`
        );
      } catch (error) {
        console.error('Plex refresh failed:', error);
      }
    } else {
      console.log('No file changes detected after command, skipping Plex refresh.');
    }
  }
}

async function main(): Promise<void> {
  const logger = {
    info: console.info.bind(console),
    error: console.error.bind(console),
  };

  const config = initConfig(envSchema, logger);
  setupSignalForwarding();
  await ensureOutputDir(config.outputDir);

  const cronPattern = config.cronPattern;
  if (!cronPattern) {
    await runCommands(config, config.commands, config.outputDir);
    return;
  }

  console.log(`Scheduling downloads with CRON_PATTERN='${cronPattern}'`);
  await runCommands(config, config.commands, config.outputDir);

  new Cron(cronPattern, async () => {
    try {
      await runCommands(config, config.commands, config.outputDir);
    } catch (error) {
      console.error('Scheduled run failed:', error);
    }
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
