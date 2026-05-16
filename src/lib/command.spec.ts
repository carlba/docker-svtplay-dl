import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';
import { listFiles, runCommand } from './command.js';
import { buildCommandEnvironment } from './config.js';
import type { ChildProcess } from 'node:child_process';

const mockSpawn = vi.mocked(spawn);

function makeFakeChild(exitCode: number | null = 0): EventEmitter & ChildProcess {
  const child = new EventEmitter() as EventEmitter & ChildProcess;
  setTimeout(() => child.emit('close', exitCode), 10);
  child.removeAllListeners = vi.fn();
  return child;
}

describe('command module', () => {
  const tempDir = os.tmpdir();
  let outputDir = '';

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(join(tempDir, 'docker-svtplay-dl-'));
  });

  afterEach(async () => {
    vi.clearAllMocks();
    if (outputDir) {
      await fs.rm(outputDir, { recursive: true, force: true });
    }
  });

  it('listFiles returns nested file names', async () => {
    await fs.mkdir(join(outputDir, 'subdir'), { recursive: true });
    await fs.writeFile(join(outputDir, 'subdir', 'video.mp4'), '');
    const files = await listFiles(outputDir);

    expect(files).toEqual(['subdir/video.mp4']);
  });

  it('runCommand returns new files after command completes', async () => {
    const command = 'echo hi';
    const child = makeFakeChild(0);
    mockSpawn.mockReturnValueOnce(child as ReturnType<typeof spawn>);

    await fs.writeFile(join(outputDir, 'before.txt'), '');
    const result = await runCommand(command, outputDir);

    expect(mockSpawn).toHaveBeenCalledWith(
      'sh',
      ['-c', command],
      expect.objectContaining({
        stdio: 'inherit',
        detached: true,
        env: buildCommandEnvironment(outputDir),
      })
    );
    expect(result).toEqual([]);
  });

  it('runCommand throws when the child exits with code 1', async () => {
    const command = 'false';
    const child = makeFakeChild(1);
    mockSpawn.mockReturnValueOnce(child as ReturnType<typeof spawn>);

    await expect(runCommand(command, outputDir)).rejects.toThrow(
      'Command exited with code 1: false'
    );
  });
});
