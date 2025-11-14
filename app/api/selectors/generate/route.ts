import { timingSafeEqual } from "crypto";
import { createLogger } from "@/lib/log";
import { generateSelectors, rerankWithOverride } from "@/lib/selector/generator";
import { validateAgainstHtml } from "@/lib/selector/validator";
import { GenerationInput, GenerationOptions } from "@/lib/selector/types";

function isValidSecret(secret: string): boolean {
  const API_SECRET = process.env.API_SECRET;
  if (!API_SECRET) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const logger = createLogger("api/selectors/generate");
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  if (!isValidSecret(token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const html: string = body.html;
  if (!html) return Response.json({ error: "html is required" }, { status: 400 });
  const description: string | undefined = body.description;
  const mode: string = body.mode || "flexible";
  const specificityLevel: number = Number(body.specificityLevel || 1);
  const strategy: string = body.strategy || "both";
  const preferredAttributes: string[] | undefined = body.preferredAttributes;
  const override: { selector: string; type?: string } | undefined = body.override;

  const input: GenerationInput = { html, description };
  const opts: GenerationOptions = {
    type: strategy as any,
    mode: mode as any,
    specificityLevel,
    preferredAttributes,
    maxCandidates: 12,
  };
  const candidates = rerankWithOverride(generateSelectors(input, opts), override as any);
  const validations = candidates.map((c) => validateAgainstHtml(html, c));
  logger.info(`Generated ${candidates.length} selector candidates`);
  return Response.json({ candidates, validations });
}
