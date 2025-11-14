import { Log, LogCollector, LogFunction, LogLevel, LogLevels, LogContext } from "@/types/log";
import { sanitizeString } from "./logSecure/sanitizer";
import { initSecureConsole } from "./logSecure/console";

try {
  if (process.env.LOG_SECURE_ENABLED !== "false") initSecureConsole();
} catch {}

/**
 * Creates a log collector that stores log messages with their levels and timestamps.
 */
export function createLogCollector(context?: LogContext): LogCollector {
  const logs: Log[] = [];

  const getAll = () => logs;

  const logFunctions = {} as Record<LogLevel, LogFunction>;
  LogLevels.forEach((level) => {
    logFunctions[level] = (message: string) => {
      const sanitized = sanitizeString(message);
      logs.push({
        message: sanitized,
        level,
        timestamp: new Date(),
        phaseId: context?.phaseId,
        taskType: context?.taskType,
        metadata: context?.metadata,
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

/**
 * Creates a logger function with specified logging levels.
 *
 * This function initializes a logger that formats messages with a timestamp and an optional scope.
 * It checks the current logging level and determines whether to log messages based on that level.
 * The logger supports three levels: info, error, and warning, and can also send logs to a provided LogCollector.
 *
 * @param {string} [scope] - An optional string to categorize log messages.
 * @param {LogCollector} [collector] - An optional LogCollector to handle log messages.
 */
export function createLogger(scope?: string, collector?: LogCollector) {
  const currentLevel = getEnvLogLevel();

  const format = (level: LogLevel, message: string) => {
    const ts = new Date().toISOString();
    return scope ? `[${ts}] [${scope}] ${message}` : `[${ts}] ${message}`;
  };

  /**
   * Logs a message at the specified log level.
   *
   * This function checks if the message should be logged based on the current logging level.
   * If logging is enabled, it retrieves the appropriate console method, sanitizes the message,
   * and formats it before logging. Additionally, if a collector function exists for the log level,
   * it invokes that function with the sanitized message.
   *
   * @param level - The log level at which to log the message.
   * @param message - The message to be logged.
   */
  const log = (level: LogLevel, message: string) => {
    if (!shouldLog(level, currentLevel)) return;
    const fn = consoleMethod(level);
    const sanitized = sanitizeString(message);
    fn(format(level, sanitized));
    if (collector && typeof collector[level] === "function") {
      collector[level](sanitized);
    }
  };

  return {
    info: (message: string) => log("info", message),
    error: (message: string) => log("error", message),
    warning: (message: string) => log("warning", message),
  } as Record<LogLevel, LogFunction>;
}
