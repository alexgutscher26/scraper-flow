import { ExecutionEnvironment } from '@/types/executor';
import { UploadFilesTask } from '../task/UploadFiles';
import fs from 'node:fs';
import path from 'node:path';

function parseFiles(input: any) {
  const s = String(input ?? '');
  return s
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function bytesToMb(n: number) {
  return n / (1024 * 1024);
}

export async function UploadExecutor(
  environment: ExecutionEnvironment<typeof UploadFilesTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    const files = parseFiles(environment.getInput('Files'));
    const acceptTypes = environment.getInput('AcceptTypes');
    const maxSizeMbRaw = environment.getInput('MaxSizeMB');
    const maxSizeMb = maxSizeMbRaw ? Number(maxSizeMbRaw) : undefined;
    const useDnD = Boolean(environment.getInput('UseDragAndDrop'));
    const dropTargetSelector = environment.getInput('DropTargetSelector') || selector;
    const strictMode = Boolean(environment.getInput('StrictMode'));
    if (!selector) {
      environment.log.error('Input Selector is required');
      return false;
    }
    if (!files.length) {
      environment.log.error('Files are required');
      return false;
    }
    const page = environment.getPage();
    if (!page) {
      environment.log.error('Web page is required');
      return false;
    }
    await page.waitForSelector(selector, { visible: true });

    const accepted: string[] = [];
    const errors: string[] = [];
    const total = files.length;
    for (const f of files) {
      const p = path.resolve(f);
      if (!fs.existsSync(p)) {
        const msg = `File not found: ${p}`;
        environment.log.error(msg);
        errors.push(msg);
        if (strictMode) {
          environment.setOutput('ErrorMessage', errors.join('\n'));
          environment.setOutput('UploadProgress', Math.floor((accepted.length / total) * 100));
          environment.setOutput('Success', false);
          return false;
        }
        continue;
      }
      const stat = fs.statSync(p);
      if (maxSizeMb && bytesToMb(stat.size) > maxSizeMb) {
        const msg = `File too large: ${p}`;
        environment.log.error(msg);
        errors.push(msg);
        if (strictMode) {
          environment.setOutput('ErrorMessage', errors.join('\n'));
          environment.setOutput('UploadProgress', Math.floor((accepted.length / total) * 100));
          environment.setOutput('Success', false);
          return false;
        }
        continue;
      }
      if (acceptTypes) {
        const ok = new RegExp(String(acceptTypes)).test(p);
        if (!ok) {
          const msg = `File type not accepted: ${p}`;
          environment.log.error(msg);
          errors.push(msg);
          if (strictMode) {
            environment.setOutput('ErrorMessage', errors.join('\n'));
            environment.setOutput('UploadProgress', Math.floor((accepted.length / total) * 100));
            environment.setOutput('Success', false);
            return false;
          }
          continue;
        }
      }
      accepted.push(p);
      environment.setOutput('UploadProgress', Math.floor((accepted.length / total) * 100));
    }

    if (useDnD) {
      const done = await page.evaluate(
        async ({ targetSel }) => {
          const target = document.querySelector(targetSel) as HTMLElement | null;
          if (!target) return false;
          const ev1 = new DragEvent('dragenter', { bubbles: true });
          const ev2 = new DragEvent('dragover', { bubbles: true });
          const ev3 = new DragEvent('drop', { bubbles: true });
          target.dispatchEvent(ev1);
          target.dispatchEvent(ev2);
          target.dispatchEvent(ev3);
          return true;
        },
        { targetSel: dropTargetSelector }
      );
      if (!done) {
        environment.log.warning?.('Drag-and-drop target not found');
      }
    }

    let handle = await page.$(selector);
    if (!handle) {
      environment.log.error('Element not found');
      return false;
    }
    try {
      // @ts-ignore
      await (handle as any).setInputFiles(accepted);
    } catch (err) {
      try {
        // @ts-ignore
        if (typeof (handle as any).uploadFile === 'function') {
          // @ts-ignore
          await (handle as any).uploadFile(...accepted);
        } else {
          // re-query and retry once
          await page.waitForSelector(selector);
          handle = await page.$(selector);
          // @ts-ignore
          await (handle as any).setInputFiles(accepted);
        }
      } catch (err2) {
        const msg = String((err2 as any)?.message || err2);
        environment.log.error(msg);
        errors.push(msg);
        environment.setOutput('ErrorMessage', errors.join('\n'));
        environment.setOutput('UploadProgress', Math.floor((accepted.length / total) * 100));
        environment.setOutput('Success', false);
        return false;
      }
    }

    environment.setOutput('UploadedFiles', accepted.join(','));
    environment.setOutput('UploadedCount', accepted.length);
    environment.setOutput('Web page', page);
    environment.setOutput('ErrorMessage', errors.join('\n'));
    environment.setOutput('UploadProgress', 100);
    environment.setOutput('Success', true);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    environment.setOutput('ErrorMessage', String(e?.message || e));
    environment.setOutput('Success', false);
    return false;
  }
}
