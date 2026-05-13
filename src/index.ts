import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { Cron } from 'croner';
import { loadConfig } from './config.js';

async function ensureOutputDir(outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
}

async function runCommand(command: string, outputDir: string): Promise<void> {
  const child = spawn('sh', ['-c', command], {
    stdio: 'inherit',
    env: { ...process.env, OUTPUT_DIR: outputDir }
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}: ${command}`);
  }
}

async function runCommands(commands: string[], outputDir: string): Promise<void> {
  for (const command of commands) {
    console.log(`Running: ${command}`);
    await runCommand(command, outputDir);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  await ensureOutputDir(config.outputDir);

  if (!config.cronPattern) {
    await runCommands(config.commands, config.outputDir);
    return;
  }

  console.log(`Scheduling downloads with CRON_PATTERN='${config.cronPattern}'`);
  await runCommands(config.commands, config.outputDir);

  new Cron(config.cronPattern, async () => {
    try {
      await runCommands(config.commands, config.outputDir);
    } catch (error) {
      console.error('Scheduled run failed:', error);
    }
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
