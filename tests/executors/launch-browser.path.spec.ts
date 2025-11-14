import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import { resolveChromeExecutablePath } from '../../lib/workflow/executor/LaunchBrowserExecutor';

describe('chrome executable path resolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  it('prefers PUPPETEER_EXECUTABLE_PATH when set', async () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chrome';
    vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => p === '/custom/chrome');
    const path = await resolveChromeExecutablePath('linux');
    expect(path).toBe('/custom/chrome');
  });

  it('auto-detects on Windows when env var not set', async () => {
    vi.spyOn(fs, 'existsSync').mockImplementation(
      (p: any) => typeof p === 'string' && p.includes('Program Files') && p.endsWith('chrome.exe')
    );
    const path = await resolveChromeExecutablePath('win32');
    expect(path.endsWith('chrome.exe')).toBe(true);
  });

  it('auto-detects on macOS when env var not set', async () => {
    vi.spyOn(fs, 'existsSync').mockImplementation(
      (p: any) => p === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    );
    const path = await resolveChromeExecutablePath('darwin');
    expect(path).toBe('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  });

  it('throws when Chrome cannot be found', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false as any);
    await expect(resolveChromeExecutablePath('linux')).rejects.toThrow(
      /Chrome executable not found/
    );
  });
});
