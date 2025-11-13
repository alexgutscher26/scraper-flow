import { ExecutionEnvironment } from "@/types/executor";
import { RegexExtractTask } from "../task/RegexExtract";

export async function RegexExtractExecutor(
  environment: ExecutionEnvironment<typeof RegexExtractTask>
): Promise<boolean> {
  try {
    const text = environment.getInput("Text") || "";
    const pattern = environment.getInput("Pattern") || "";
    const flags = environment.getInput("Flags") || "";
    if (!pattern) {
      environment.log.error("Pattern is required");
      return false;
    }
    let matches: any[] = [];
    try {
      const re = new RegExp(pattern, flags);
      if (flags.includes("g")) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          matches.push({ index: m.index, groups: Array.from(m) });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        const m = text.match(re);
        if (m) matches.push({ index: (m as any).index ?? 0, groups: Array.from(m) });
      }
    } catch (e: any) {
      environment.log.error("Invalid regex: " + e.message);
      return false;
    }
    environment.setOutput("Matches", matches);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

