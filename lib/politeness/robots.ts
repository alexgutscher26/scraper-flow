import { PolitenessConfig, PolitenessState, RobotsRules } from '@/types/politeness';
import { http } from '@/lib/http';

async function fetchRobots(domain: string, ua?: string) {
  try {
    const text = await http.request<string>(`https://${domain}/robots.txt`, {
      headers: ua ? { 'user-agent': ua } : undefined,
    });
    if (!text) return '';
    return text;
  } catch {
    return '';
  }
}

export function parseRobots(content: string): RobotsRules {
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const groups: { agents: string[]; allow: string[]; disallow: string[] }[] = [];
  let current: { agents: string[]; allow: string[]; disallow: string[] } | null = null;
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [rawKey, ...rest] = line.split(':');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.toLowerCase().trim();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      current = { agents: [value.toLowerCase()], allow: [], disallow: [] };
      groups.push(current);
      continue;
    }
    if (!current) continue;
    if (key === 'allow') current.allow.push(value);
    if (key === 'disallow') current.disallow.push(value);
  }
  if (groups.length === 0) groups.push({ agents: ['*'], allow: [], disallow: [] });
  return { groups };
}

function pathMatchesRule(path: string, rule: string) {
  if (!rule) return false;
  if (rule === '/') return true;
  return path.startsWith(rule);
}

function pickGroup(rules: RobotsRules, ua: string) {
  const lowerUA = ua.toLowerCase();
  let best = rules.groups.find((g) => g.agents.some((a) => a !== '*' && lowerUA.includes(a)));
  if (best) return best;
  best = rules.groups.find((g) => g.agents.includes('*'));
  return best ?? { agents: ['*'], allow: [], disallow: [] };
}

export async function isAllowed(
  url: string,
  config: PolitenessConfig,
  state: PolitenessState,
  ua: string
) {
  if (!config.robots.enabled) return true;
  let domain: string;
  let path: string;
  try {
    const u = new URL(url);
    domain = u.host;
    path = u.pathname;
  } catch {
    return true;
  }
  let rules = state.robotsCache.get(domain);
  if (!rules) {
    const content = await fetchRobots(domain, ua);
    rules = parseRobots(content);
    state.robotsCache.set(domain, rules);
  }
  const group = pickGroup(rules, ua);
  for (const dis of group.disallow) {
    if (pathMatchesRule(path, dis)) return false;
  }
  return true;
}
