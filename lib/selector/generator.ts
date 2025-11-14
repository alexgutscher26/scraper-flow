import * as cheerio from 'cheerio';
import { CandidateSelector, GenerationInput, GenerationOptions, SelectorType } from './types';

/**
 * Normalizes a string by replacing multiple spaces with a single space and trimming it.
 */
function normalizeText(t: string) {
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a class name is likely dynamic based on specific patterns.
 */
function isLikelyDynamicClass(cls: string) {
  return /\b\w*\d{3,}\w*\b/.test(cls) || /[_-]{2,}/.test(cls);
}

function computePerformanceCost(sel: string) {
  let cost = 0;
  cost += (sel.match(/\s*>\s*/g) || []).length * 1.2;
  cost += (sel.match(/\s+/g) || []).length * 1.0;
  cost += (sel.match(/:\w+/g) || []).length * 0.8;
  cost += (sel.match(/\[.+?\]/g) || []).length * 0.7;
  return Math.max(0.1, 3 - cost);
}

/**
 * Compute the stability score of a given HTML element based on its attributes and classes.
 *
 * The function evaluates the element's ID, class attributes, and preferred attributes to calculate a score.
 * It adds points for the presence of an ID, counts stable classes, and checks for preferred attributes,
 * while also considering the tag name. The final score is returned as a numeric value.
 *
 * @param $ - The CheerioAPI instance used for parsing and manipulating the HTML.
 * @param el - The HTML element for which the stability score is being computed.
 * @param preferred - An array of preferred attribute names to check against the element.
 * @returns The computed stability score as a numeric value.
 */
function computeStabilityScore($: cheerio.CheerioAPI, el: cheerio.Element, preferred: string[]) {
  let s = 0;
  const id = (el.attribs || {}).id;
  if (id) s += 2.5;
  const classes = ((el.attribs || {}).class || '').split(/\s+/).filter(Boolean);
  const stableClasses = classes.filter((c) => !isLikelyDynamicClass(c));
  s += Math.min(2, stableClasses.length * 0.5);
  for (const attr of preferred) {
    if ((el.attribs || {})[attr]) s += 1.2;
  }
  const tagWeight = el.tagName ? 0.5 : 0;
  s += tagWeight;
  return s;
}

function cssEscape(v: string) {
  return v.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

function buildCssCandidates($: cheerio.CheerioAPI, el: cheerio.Element, opts: GenerationOptions) {
  const candidates: string[] = [];
  const id = (el.attribs || {}).id;
  if (id) candidates.push(`#${cssEscape(id)}`);
  const classes = ((el.attribs || {}).class || '').split(/\s+/).filter(Boolean);
  const stable = classes.filter((c) => !isLikelyDynamicClass(c));
  if (stable.length) candidates.push(`${el.tagName}.${stable.map((c) => cssEscape(c)).join('.')}`);
  if (el.tagName) candidates.push(el.tagName);
  for (const attr of opts.preferredAttributes || []) {
    const v = (el.attribs || {})[attr];
    if (v) candidates.push(`${el.tagName}[${attr}="${v.replace(/"/g, '\\"')}"]`);
  }
  const text = normalizeText($(el).text());
  if (text && opts.mode === 'strict')
    candidates.push(`${el.tagName}:contains("${text.substring(0, 64)}")`);
  return Array.from(new Set(candidates));
}

function buildXpathCandidates($: cheerio.CheerioAPI, el: cheerio.Element, opts: GenerationOptions) {
  const candidates: string[] = [];
  const tag = el.tagName || '*';
  const id = (el.attribs || {}).id;
  if (id) candidates.push(`//*[@id='${id.replace(/'/g, '&apos;')}']`);
  const classes = ((el.attribs || {}).class || '').split(/\s+/).filter(Boolean);
  const stable = classes.filter((c) => !isLikelyDynamicClass(c));
  if (stable.length) candidates.push(`//${tag}[contains(@class,'${stable[0]}')]`);
  for (const attr of opts.preferredAttributes || []) {
    const v = (el.attribs || {})[attr];
    if (v) candidates.push(`//${tag}[@${attr}='${v.replace(/'/g, '&apos;')}']`);
  }
  const text = normalizeText($(el).text());
  if (text && opts.mode === 'strict')
    candidates.push(`//${tag}[normalize-space(text())='${text.substring(0, 128)}']`);
  candidates.push(`//${tag}`);
  return Array.from(new Set(candidates));
}

/**
 * Generate a list of candidate selectors based on the provided input and options.
 *
 * The function first attempts to find elements matching the input description. If none are found, it defaults to a set of candidate elements.
 * It then builds CSS and XPath selectors for each target element, calculating scores based on uniqueness, stability, and performance.
 * Finally, it filters and sorts the selectors based on the provided options before returning the top candidates.
 *
 * @param input - The input containing HTML and an optional description for selector generation.
 * @param opts - Options that dictate the type of selectors to generate and other preferences.
 * @returns An array of candidate selectors sorted by their computed scores.
 */
export function generateSelectors(
  input: GenerationInput,
  opts: GenerationOptions
): CandidateSelector[] {
  const $ = cheerio.load(input.html);
  const targets: cheerio.Element[] = [];
  if (input.description) {
    const firstMatch = $('*')
      .filter((_, e) =>
        normalizeText($(e).text()).toLowerCase().includes(input.description!.toLowerCase())
      )
      .first();
    if (firstMatch.length) targets.push(firstMatch.get(0)!);
  }
  if (!targets.length) {
    const candidates = $('*[id], *[class], a, button, input, img, h1, h2, h3, h4, h5, h6');
    if (candidates.length) targets.push(candidates.get(0)!);
  }
  const preferred = opts.preferredAttributes || ['data-testid', 'data-qa', 'aria-label', 'name'];
  const all: CandidateSelector[] = [];
  for (const el of targets) {
    if (opts.type === 'css' || opts.type === 'both') {
      for (const s of buildCssCandidates($, el, opts)) {
        const count = $(s).length;
        const uniqueness = count === 0 ? 0 : 1 / count;
        const stability = computeStabilityScore($, el, preferred);
        const performance = computePerformanceCost(s);
        const score =
          uniqueness * 2.0 +
          stability * 1.5 +
          performance * 1.0 +
          (opts.mode === 'strict' ? 0.5 : 0);
        all.push({
          selector: s,
          type: 'css',
          score,
          metrics: { uniqueness, stability, performance, matchCount: count },
          source: 'heuristic',
        });
      }
    }
    if (opts.type === 'xpath' || opts.type === 'both') {
      for (const x of buildXpathCandidates($, el, opts)) {
        let count = 0;
        try {
          count = $(x.replace(/^\/\//, '')).length;
        } catch {
          count = 0;
        }
        const uniqueness = count === 0 ? 0 : 1 / count;
        const stability = computeStabilityScore($, el, preferred);
        const performance = Math.max(0.1, 2.5 - (x.match(/\//g) || []).length * 0.6);
        const score =
          uniqueness * 2.0 +
          stability * 1.4 +
          performance * 1.0 +
          (opts.mode === 'strict' ? 0.5 : 0);
        all.push({
          selector: x,
          type: 'xpath',
          score,
          metrics: { uniqueness, stability, performance, matchCount: count },
          source: 'heuristic',
        });
      }
    }
  }
  const filtered = all
    .filter((c) => !(opts.excludePatterns || []).some((r) => r.test(c.selector)))
    .sort((a, b) => b.score - a.score);
  const max = opts.maxCandidates || 10;
  return filtered.slice(0, max);
}

export function rerankWithOverride(
  candidates: CandidateSelector[],
  override?: { selector: string; type?: SelectorType }
) {
  if (!override) return candidates;
  const type = override.type || 'css';
  const head: CandidateSelector = {
    selector: override.selector,
    type,
    score: candidates[0]?.score || 5,
    metrics: { uniqueness: 1, stability: 1, performance: 1, matchCount: 1 },
    source: 'override',
  };
  const rest = candidates.filter((c) => c.selector !== override.selector);
  return [head, ...rest];
}
