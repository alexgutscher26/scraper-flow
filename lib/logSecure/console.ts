import { sanitizeString } from './sanitizer';

type ConsoleMethod = (...args: any[]) => void;

function wrap(fn: ConsoleMethod): ConsoleMethod {
  return (...args: any[]) => {
    const out = args.map((a) => {
      if (typeof a === 'string') return sanitizeString(a);
      try {
        return sanitizeString(JSON.stringify(a));
      } catch {
        return a;
      }
    });
    fn(...out);
  };
}

/**
 * Initializes a secure console by wrapping the default console methods.
 *
 * This function checks if the secure console has already been initialized by looking for a property on globalThis.
 * If not, it wraps the console.log, console.warn, and console.error methods to enhance their functionality.
 * Finally, it sets a flag on globalThis to indicate that the secure console is now active.
 */
export function initSecureConsole() {
  if ((globalThis as any).__secureConsole__) return;
  console.log = wrap(console.log);
  console.warn = wrap(console.warn);
  console.error = wrap(console.error);
  (globalThis as any).__secureConsole__ = true;
}
