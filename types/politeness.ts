export type PolitenessEnforcementMode = 'strict' | 'lenient';

export type DelayStrategy = 'uniform' | 'normal';

export type UserAgentRotateStrategy = 'perNavigation' | 'perDomain' | 'perSession';

export type PolitenessConfig = {
  robots: {
    enabled: boolean;
    enforcement: PolitenessEnforcementMode;
    userAgentOverride?: string;
  };
  delays: {
    enabled: boolean;
    minMs: number;
    maxMs: number;
    jitterPct: number;
    strategy: DelayStrategy;
  };
  userAgent: {
    enabled: boolean;
    pool?: string[];
    rotateStrategy: UserAgentRotateStrategy;
    headers?: Record<string, string>;
    acceptLanguageRandomization?: boolean;
  };
};

export type PolitenessState = {
  robotsCache: Map<string, RobotsRules>;
  uaPerSession?: string;
  uaPerDomain: Map<string, string>;
  lastDelayAt?: number;
};

export type RobotsGroup = {
  agents: string[];
  allow: string[];
  disallow: string[];
};

export type RobotsRules = {
  groups: RobotsGroup[];
};

export function defaultPolitenessConfig(): PolitenessConfig {
  const robotsEnabled = process.env.POLITENESS_ROBOTS_ENABLED === 'false' ? false : true;
  const delaysEnabled = process.env.POLITENESS_DELAYS_ENABLED === 'false' ? false : true;
  const uaEnabled = process.env.POLITENESS_UA_ENABLED === 'false' ? false : true;

  const minMs = Number(process.env.POLITENESS_DELAY_MIN_MS ?? 500);
  const maxMs = Number(process.env.POLITENESS_DELAY_MAX_MS ?? 1500);
  const jitterPct = Number(process.env.POLITENESS_DELAY_JITTER_PCT ?? 0.15);

  const enforcement =
    (process.env.POLITENESS_ROBOTS_ENFORCEMENT as PolitenessEnforcementMode) ?? 'strict';
  const rotateStrategy =
    (process.env.POLITENESS_UA_ROTATE_STRATEGY as UserAgentRotateStrategy) ?? 'perNavigation';

  return {
    robots: {
      enabled: robotsEnabled,
      enforcement,
      userAgentOverride: process.env.POLITENESS_ROBOTS_UA_OVERRIDE,
    },
    delays: {
      enabled: delaysEnabled,
      minMs: Number.isFinite(minMs) ? minMs : 500,
      maxMs: Number.isFinite(maxMs) ? maxMs : 1500,
      jitterPct: Number.isFinite(jitterPct) ? jitterPct : 0.15,
      strategy: (process.env.POLITENESS_DELAY_STRATEGY as DelayStrategy) ?? 'uniform',
    },
    userAgent: {
      enabled: uaEnabled,
      rotateStrategy,
      acceptLanguageRandomization:
        process.env.POLITENESS_ACCEPT_LANGUAGE_RANDOMIZE === 'false' ? false : true,
    },
  };
}
