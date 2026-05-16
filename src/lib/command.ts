import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import fs from 'node:fs/promises';
import { buildCommandEnvironment } from './config.js';
import { attachAbortSignalToChild } from './utils.js';

export async function listFiles(rootPath: string): Promise<string[]> {
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
      return [];
    }
    throw error;
  }

  return results;
}

export async function ensureOutputDir(outputDir: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
}

export async function runCommand(
  command: string,
  outputDir: string,
  signal?: AbortSignal
): Promise<string[]> {
  const beforeFiles = new Set(await listFiles(outputDir));

  const child = spawn('sh', ['-c', command], {
    stdio: 'inherit',
    detached: true,
    env: buildCommandEnvironment(outputDir),
    signal,
  });

  if (signal) {
    attachAbortSignalToChild(child, signal);
  }

  try {
    const closePromise = once(child, 'close');
    const errorPromise = once(child, 'error').then(([error]) => {
      throw error;
    });

    const [code] = (await Promise.race([closePromise, errorPromise])) as [number, NodeJS.Signals];

    if (code !== 0) {
      throw new Error(`Command exited with code ${String(code)}: ${command}`);
    }

    const afterFiles = await listFiles(outputDir);
    return afterFiles.filter(file => !beforeFiles.has(file));
  } finally {
    child.removeAllListeners();
  }
}
