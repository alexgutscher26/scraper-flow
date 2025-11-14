import { timingSafeEqual } from "crypto";
import { createLogger } from "@/lib/log";
import { validateAgainstHtml } from "@/lib/selector/validator";
import { CandidateSelector } from "@/lib/selector/types";

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
  const logger = createLogger("api/selectors/validate");
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
    const candidates: CandidateSelector[] = body.candidates || [];
    if (!html || !Array.isArray(candidates)) {
      return Response.json({ error: "html and candidates are required" }, { status: 400 });
    }
    const results = candidates.map((c) => validateAgainstHtml(html, c));
    logger.info(`Validated ${results.length} selectors`);
    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("aborted") || (error as any)?.name === "AbortError") {
      return Response.json({ error: "Request aborted" }, { status: 408 });
    }
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
