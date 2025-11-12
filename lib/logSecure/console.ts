import { sanitizeString } from "./sanitizer";

type ConsoleMethod = (...args: any[]) => void;

function wrap(fn: ConsoleMethod): ConsoleMethod {
  return (...args: any[]) => {
    const out = args.map((a) => {
      if (typeof a === "string") return sanitizeString(a);
      try {
        return sanitizeString(JSON.stringify(a));
      } catch {
        return a;
      }
    });
    fn(...out);
  };
}

export function initSecureConsole() {
  if ((globalThis as any).__secureConsole__) return;
  console.log = wrap(console.log);
  console.warn = wrap(console.warn);
  console.error = wrap(console.error);
  (globalThis as any).__secureConsole__ = true;
}

