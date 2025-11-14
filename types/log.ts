export const LogLevels = ['info', 'error', 'warning'] as const;
export type LogLevel = (typeof LogLevels)[number];

export type LogFunction = (message: string) => void;

export type Log = {
  message: string;
  level: LogLevel;
  timestamp: Date;
  phaseId?: string;
  taskType?: string;
  metadata?: Record<string, any>;
};

export type LogCollector = {
  getAll(): Log[];
} & {
  [K in LogLevel]: LogFunction;
};

export type LogContext = {
  phaseId?: string;
  taskType?: string;
  metadata?: Record<string, any>;
};

export type ExecutionLogMetadata = {
  scope?: string;
  [key: string]: any;
};
