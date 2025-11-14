import { ExecutionEnvironment } from '@/types/executor';
import { GenerateSelectorTask } from '../task/GenerateSelector';
import { generateSelectors, rerankWithOverride } from '@/lib/selector/generator';
import { validateAgainstHtml, validateAgainstPage } from '@/lib/selector/validator';
import { CandidateSelector, GenerationInput, GenerationOptions } from '@/lib/selector/types';
import OpenAI from 'openai';

export async function GenerateSelectorExecutor(
  environment: ExecutionEnvironment<typeof GenerateSelectorTask>
): Promise<boolean> {
  try {
    const html = environment.getInput('Html');
    if (!html) {
      environment.log.error('Input Html is required');
      return false;
    }
    const page = environment.getInput('Web page') || environment.getPage();
    const description = environment.getInput('Target description') || undefined;
    const mode = (environment.getInput('Mode') as any) || 'flexible';
    const specificityLevel = Number(environment.getInput('Specificity level') || 1);
    const strategy = (environment.getInput('Strategy') as any) || 'both';
    const preferredStr = environment.getInput('Preferred attributes') || '';
    const overrideSel = environment.getInput('Manual override selector') || undefined;
    const credentials = environment.getInput('Credentials') || undefined;

    const preferred = preferredStr
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length);

    const genInput: GenerationInput = { html, description };
    const genOpts: GenerationOptions = {
      type: strategy as any,
      mode: mode as any,
      specificityLevel,
      preferredAttributes: preferred.length ? preferred : undefined,
      maxCandidates: 8,
    };

    let candidates: CandidateSelector[] = generateSelectors(genInput, genOpts);

    if (credentials) {
      try {
        let apiKey: string;
        try {
          const cfg = JSON.parse(credentials);
          apiKey = cfg.apiKey || cfg.key;
        } catch {
          apiKey = credentials as string;
        }
        const openai = new OpenAI({ apiKey });
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Given HTML and a description, propose robust CSS and XPath selectors. Return JSON {selectors: [{type, selector}]} only.',
            },
            { role: 'user', content: html },
            { role: 'user', content: description || '' },
          ],
          temperature: 0.2,
        });
        const content = resp.choices[0].message.content || '{}';
        const parsed = JSON.parse(content);
        const aiSelectors = Array.isArray(parsed.selectors) ? parsed.selectors : [];
        const aiCandidates: CandidateSelector[] = aiSelectors
          .filter((s: any) => s.selector && (s.type === 'css' || s.type === 'xpath'))
          .map((s: any) => ({
            selector: s.selector,
            type: s.type,
            score: 3.5,
            metrics: { uniqueness: 0.5, stability: 1, performance: 1, matchCount: 0 },
            source: 'ai',
          }));
        candidates = [...aiCandidates, ...candidates];
      } catch (e: any) {
        environment.log.warning(`AI generation failed: ${e.message}`);
      }
    }

    candidates = rerankWithOverride(
      candidates,
      overrideSel ? { selector: overrideSel } : undefined
    );

    const validations: any[] = [];
    for (const c of candidates) {
      const resHtml = validateAgainstHtml(html, c);
      validations.push({
        stage: 'html',
        selector: c.selector,
        type: c.type,
        valid: resHtml.valid,
        matched: resHtml.matched,
      });
      if (page) {
        const resPage = await validateAgainstPage(page, c);
        validations.push({
          stage: 'page',
          selector: c.selector,
          type: c.type,
          valid: resPage.valid,
          matched: resPage.matched,
          latencyMs: resPage.selector.metrics.latencyMs,
        });
      }
    }

    const primary = candidates.find((c) => {
      const vHtml = validations.find(
        (v) => v.stage === 'html' && v.selector === c.selector && v.type === c.type
      );
      return vHtml && vHtml.valid;
    });

    let selected = primary || candidates[0];
    if (!selected) {
      environment.log.error('No selector candidates generated');
      return false;
    }

    const primaryValidation = validations.find(
      (v) => v.stage === 'html' && v.selector === selected.selector && v.type === selected.type
    );
    if (!primaryValidation?.valid) {
      const fallback = candidates.find((c) =>
        validations.find(
          (v) => v.stage === 'html' && v.selector === c.selector && v.type === c.type && v.valid
        )
      );
      if (fallback) selected = fallback;
    }

    const fallbacks = candidates.filter((c) => c.selector !== selected.selector).slice(0, 5);
    environment.log.info(`Primary selector chosen: ${selected.type}:${selected.selector}`);
    environment.log.info(`Fallback count: ${fallbacks.length}`);

    environment.setOutput(
      'Primary selector',
      JSON.stringify({ selector: selected.selector, type: selected.type })
    );
    environment.setOutput(
      'Fallback selectors',
      JSON.stringify(fallbacks.map((f) => ({ selector: f.selector, type: f.type })))
    );
    environment.setOutput(
      'Selector report',
      JSON.stringify({
        candidates: candidates.map((c) => ({
          selector: c.selector,
          type: c.type,
          score: c.score,
          metrics: c.metrics,
        })),
        validations,
      })
    );

    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
