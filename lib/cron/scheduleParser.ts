import parser from "cron-parser";
import cronstrue from "cronstrue";

/**
 * Parses a workflow schedule expression and validates it
 * Supports both standard cron expressions and simplified time intervals
 *
 * @param scheduleExpression The schedule expression to parse
 * @returns An object with information about the parsed schedule
 */
export function parseWorkflowSchedule(scheduleExpression: string): {
  isValid: boolean;
  type: "cron" | "interval" | "invalid";
  readableDescription: string;
  nextRunDate: Date | null;
} {
  // Check if this is a time interval expression (e.g., "2m", "1h", "30s")
  const intervalMatch = scheduleExpression.match(/^(\d+)([smhd])$/);
  if (intervalMatch) {
    const [, valueStr, unit] = intervalMatch;
    const value = parseInt(valueStr);

    if (isNaN(value) || value <= 0) {
      return {
        isValid: false,
        type: "invalid",
        readableDescription: "Invalid interval value",
        nextRunDate: null,
      };
    }

    let unitLabel = "";
    switch (unit) {
      case "s":
        unitLabel = value === 1 ? "second" : "seconds";
        break;
      case "m":
        unitLabel = value === 1 ? "minute" : "minutes";
        break;
      case "h":
        unitLabel = value === 1 ? "hour" : "hours";
        break;
      case "d":
        unitLabel = value === 1 ? "day" : "days";
        break;
    }

    return {
      isValid: true,
      type: "interval",
      readableDescription: `Every ${value} ${unitLabel}`,
      nextRunDate: calculateNextRunForInterval(value, unit),
    };
  }
  // Try to parse as standard cron expression
  try {
    const interval = parser.parseExpression(scheduleExpression, { utc: true });
    const nextDate = interval.next().toDate(); // Get human-readable description from cronstrue
    const readableDescription = cronstrue.toString(scheduleExpression, {
      verbose: true,
    });

    return {
      isValid: true,
      type: "cron",
      readableDescription: readableDescription,
      nextRunDate: nextDate,
    };
  } catch (error) {
    return {
      isValid: false,
      type: "invalid",
      readableDescription: "Invalid schedule expression",
      nextRunDate: null,
    };
  }
}

/**
 * Calculates the next run date for an interval-based schedule
 */
function calculateNextRunForInterval(value: number, unit: string): Date {
  const now = new Date();
  let ms = 0;

  switch (unit) {
    case "s":
      ms = value * 1000;
      break; // seconds
    case "m":
      ms = value * 60 * 1000;
      break; // minutes
    case "h":
      ms = value * 60 * 60 * 1000;
      break; // hours
    case "d":
      ms = value * 24 * 60 * 60 * 1000;
      break; // days
  }

  return new Date(now.getTime() + ms);
}
