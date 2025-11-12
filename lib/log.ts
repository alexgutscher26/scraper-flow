import {
  Log,
  LogCollector,
  LogFunction,
  LogLevel,
  LogLevels,
} from "@/types/log";

export function createLogCollector(): LogCollector {
  const logs: Log[] = [];

  const getAll = () => logs;

  const logFunctions = {} as Record<LogLevel, LogFunction>;
  LogLevels.forEach((level) => {
    logFunctions[level] = (message: string) => {
      logs.push({
        message,
        level,
        timestamp: new Date(),
      });
    };
  });
  return {
    getAll,
    ...logFunctions,
  };
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function getEnvLogLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw && (LogLevels as readonly string[]).includes(raw)) {
    return raw as LogLevel;
  }
  return "info";
}

function shouldLog(level: LogLevel, current: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[current];
}

function consoleMethod(level: LogLevel): (...args: any[]) => void {
  if (level === "error") return console.error;
  if (level === "warning") return console.warn;
  return console.log;
}

export function createLogger(scope?: string, collector?: LogCollector) {
  const currentLevel = getEnvLogLevel();

  const format = (level: LogLevel, message: string) => {
    const ts = new Date().toISOString();
    return scope ? `[${ts}] [${scope}] ${message}` : `[${ts}] ${message}`;
  };

  const log = (level: LogLevel, message: string) => {
    if (!shouldLog(level, currentLevel)) return;
    const fn = consoleMethod(level);
    fn(format(level, message));
    if (collector && typeof collector[level] === "function") {
      collector[level](message);
    }
  };

  return {
    info: (message: string) => log("info", message),
    error: (message: string) => log("error", message),
    warning: (message: string) => log("warning", message),
  } as Record<LogLevel, LogFunction>;
}
