import { timingSafeEqual } from "crypto";
import { createLogger } from "@/lib/log";
import { generateSelectors, rerankWithOverride } from "@/lib/selector/generator";
import { validateAgainstHtml } from "@/lib/selector/validator";
import { GenerationInput, GenerationOptions } from "@/lib/selector/types";

/**
 * Validates a secret against the API secret stored in the environment.
 *
 * This function retrieves the API_SECRET from the environment variables and checks if it exists.
 * If it does, it uses the timingSafeEqual function to compare the provided secret with the API_SECRET
 * in a secure manner. If the API_SECRET is not set or an error occurs during comparison, it returns false.
 *
 * @param secret - The secret string to validate against the API secret.
 */
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
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("aborted") || (error as any)?.name === "AbortError") {
      return Response.json({ error: "Request aborted" }, { status: 408 });
    }
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
