import { ExecutionEnvironment } from '@/types/executor';
import { TypeInputTask } from '../task/TypeInput';
import { sleep } from '@/lib/politeness/delay';

function isString(v: any) {
  return typeof v === 'string';
}

export async function TypeInputExecutor(
  environment: ExecutionEnvironment<typeof TypeInputTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('Input Selector is required');
      return false;
    }
    const value = environment.getInput('Value');
    if (!isString(value)) {
      environment.log.error('Input Value is required');
      return false;
    }
    const type = environment.getInput('Type');
    const debounceMsRaw = environment.getInput('DebounceMs');
    const debounceMs = Number(debounceMsRaw ?? 50);
    const pattern = environment.getInput('ValidatePattern');
    const maxLengthRaw = environment.getInput('MaxLength');
    const maxLength = maxLengthRaw ? Number(maxLengthRaw) : undefined;
    const clearBefore = Boolean(environment.getInput('ClearBeforeType'));
    const pressEnter = Boolean(environment.getInput('PressEnter'));

    const page = environment.getPage();
    if (!page) {
      environment.log.error('Web page is required');
      return false;
    }

    await page.waitForSelector(selector, { visible: true });

    const actualType = await (page as any).$eval(selector, (el: any) => el.type || '');
    if (type && actualType && type !== actualType) {
      environment.log.warning?.(`Expected type ${type} but found ${actualType}`);
    }

    if (maxLength && String(value).length > maxLength) {
      environment.log.error('Value exceeds MaxLength');
      return false;
    }
    if (pattern) {
      try {
        const re = new RegExp(String(pattern));
        if (!re.test(String(value))) {
          environment.log.error('Value does not match ValidatePattern');
          return false;
        }
      } catch {
        environment.log.error('Invalid ValidatePattern regex');
        return false;
      }
    }

    const handle = await (page as any).$(selector);
    if (!handle) {
      environment.log.error('Element not found');
      return false;
    }
    await handle.focus();
    if (clearBefore) {
      await (page as any).keyboard.down('Control');
      await (page as any).keyboard.press('KeyA');
      await (page as any).keyboard.up('Control');
      await (page as any).keyboard.press('Delete');
    }

    const str = String(value);
    if (debounceMs > 0 && str.length > 12) {
      const chunk = Math.max(4, Math.ceil(str.length / 3));
      for (let i = 0; i < str.length; i += chunk) {
        const part = str.slice(i, i + chunk);
        await (page as any).type(selector, part, { delay: 0 });
        await sleep(debounceMs);
      }
    } else {
      await (page as any).type(selector, str, { delay: 0 });
    }

    const finalVal = await (page as any).$eval(selector, (el: any) => el.value ?? '');
    environment.setOutput('TypedValue', finalVal);
    if (pressEnter) {
      await (page as any).keyboard.press('Enter');
    }
    environment.setOutput('Web page', page);
    environment.setOutput('Success', true);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    environment.setOutput('Success', false);
    return false;
  }
}
