import { timingSafeEqual } from 'crypto';
import { createLogger } from '@/lib/log';
import { validateAgainstHtml } from '@/lib/selector/validator';
import { CandidateSelector } from '@/lib/selector/types';

function isValidSecret(secret: string): boolean {
  const API_SECRET = process.env.API_SECRET;
  if (!API_SECRET) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch {
    return false;
  }
}

/**
 * Handles the POST request for validating candidate selectors against HTML.
 *
 * The function first checks for a valid Bearer token in the authorization header. If the token is invalid or missing, it returns a 401 Unauthorized response. It then parses the request body to extract the HTML and candidates, ensuring both are provided. Each candidate is validated against the HTML, and the results are logged and returned in the response.
 *
 * @param req - The incoming request object containing headers and body.
 * @returns A JSON response containing the validation results or an error message.
 * @throws Response If the authorization header is missing or invalid, or if the required fields are not present in the request body.
 */
export async function POST(req: Request) {
  const logger = createLogger('api/selectors/validate');
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  if (!isValidSecret(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const html: string = body.html;
    const candidates: CandidateSelector[] = body.candidates || [];
    if (!html || !Array.isArray(candidates)) {
      return Response.json({ error: 'html and candidates are required' }, { status: 400 });
    }
    const results = candidates.map((c) => validateAgainstHtml(html, c));
    logger.info(`Validated ${results.length} selectors`);
    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('aborted') || (error as any)?.name === 'AbortError') {
      return Response.json({ error: 'Request aborted' }, { status: 408 });
    }
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
