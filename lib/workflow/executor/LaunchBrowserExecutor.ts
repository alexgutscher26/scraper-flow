import puppeteer, { type Browser } from 'puppeteer';
import { type Browser as BrowserCore } from 'puppeteer-core';
const puppeteerCore = require('puppeteer-core');
import chromium from '@sparticuz/chromium-min';
import { ExecutionEnvironment } from '@/types/executor';
import { LaunchBrowserTask } from '../task/LaunchBrowser';
import { createLogger } from '@/lib/log';
import { applyHeaders } from '@/lib/politeness/userAgent';
import { isAllowed } from '@/lib/politeness/robots';
import { sleep } from '@/lib/politeness/delay';
import { ProxyManager } from '@/lib/network/proxyManager';
import fs from 'fs';
import os from 'os';

type StealthOptions = {
  enabled: boolean;
  fingerprintSpoofing?: boolean;
  mouseMovement?: boolean;
  randomizedDelays?: boolean;
  userAgentRotation?: boolean;
  cookieManagement?: boolean;
};

type EvasionParams = {
  mouse?: {
    pathPoints?: number;
    jitterPx?: number;
    minSpeed?: number;
    maxSpeed?: number;
  };
  delays?: {
    minMs?: number;
    maxMs?: number;
    jitterPct?: number;
  };
  fingerprint?: {
    languagesPool?: string[];
    platformPool?: string[];
    deviceMemoryRange?: [number, number];
    hardwareConcurrencyRange?: [number, number];
    webglSpoofing?: boolean;
  };
  uaOverride?: string;
  uaRotateStrategy?: 'perNavigation' | 'perDomain' | 'perSession';
};

type CookieSettings = {
  clearBefore?: boolean;
  set?: Array<any>;
  persist?: boolean;
};

type ResourceBlockOptions = {
  enabled: boolean;
  blockImages: boolean;
  blockFonts: boolean;
  blockAds: boolean;
  adUrlPatterns: string[];
};

/**
 * Derives stealth configuration from environment variables.
 */
function readStealthEnv(): {
  stealth: StealthOptions;
  evasion: EvasionParams;
  cookies: CookieSettings;
} {
  const stealthEnabled = process.env.STEALTH_MODE_ENABLED === 'true';
  const randomizedDelaysEnabled = process.env.STEALTH_RANDOM_DELAYS_ENABLED !== 'false';
  const mouseEnabled = process.env.STEALTH_MOUSE_MOVEMENT_ENABLED === 'true';
  const fingerprintEnabled = process.env.STEALTH_FINGERPRINT_SPOOFING_ENABLED !== 'false';
  const userAgentRotationEnabled = process.env.STEALTH_UA_ROTATION_ENABLED !== 'false';
  const cookieManagementEnabled = process.env.STEALTH_COOKIE_MANAGEMENT_ENABLED !== 'false';

  const delaysMin = Number(process.env.STEALTH_DELAY_MIN_MS ?? '50');
  const delaysMax = Number(process.env.STEALTH_DELAY_MAX_MS ?? '250');
  const delaysJitter = Number(process.env.STEALTH_DELAY_JITTER_PCT ?? '0.2');

  const mousePathPoints = Number(process.env.STEALTH_MOUSE_POINTS ?? '6');
  const mouseJitterPx = Number(process.env.STEALTH_MOUSE_JITTER_PX ?? '3');
  const mouseMinSpeed = Number(process.env.STEALTH_MOUSE_MIN_SPEED ?? '300');
  const mouseMaxSpeed = Number(process.env.STEALTH_MOUSE_MAX_SPEED ?? '800');

  const languagesPool = (
    process.env.STEALTH_LANGUAGES_POOL ?? 'en-US,en;q=0.9,fr-FR,fr;q=0.8'
  ).split(',');
  const platformPool = (process.env.STEALTH_PLATFORM_POOL ?? 'Win32,MacIntel,Linux x86_64').split(
    ','
  );
  const deviceMemMin = Number(process.env.STEALTH_DEVICE_MEMORY_MIN ?? '4');
  const deviceMemMax = Number(process.env.STEALTH_DEVICE_MEMORY_MAX ?? '16');
  const hwMin = Number(process.env.STEALTH_HW_CONCURRENCY_MIN ?? '4');
  const hwMax = Number(process.env.STEALTH_HW_CONCURRENCY_MAX ?? '16');
  const webglSpoofing = process.env.STEALTH_WEBGL_SPOOFING === 'true';

  const uaOverride = process.env.STEALTH_UA_OVERRIDE;
  const uaRotateStrategy = (process.env.STEALTH_UA_ROTATE_STRATEGY as any) ?? undefined;

  const clearBefore = process.env.STEALTH_COOKIE_CLEAR_BEFORE === 'true';
  const persist = process.env.STEALTH_COOKIE_PERSIST !== 'false';
  const cookieSetRaw = process.env.STEALTH_COOKIE_SET_JSON;
  let set: Array<any> | undefined = undefined;
  try {
    if (cookieSetRaw) set = JSON.parse(cookieSetRaw);
  } catch {}

  return {
    stealth: {
      enabled: stealthEnabled,
      fingerprintSpoofing: fingerprintEnabled,
      mouseMovement: mouseEnabled,
      randomizedDelays: randomizedDelaysEnabled,
      userAgentRotation: userAgentRotationEnabled,
      cookieManagement: cookieManagementEnabled,
    },
    evasion: {
      delays: { minMs: delaysMin, maxMs: delaysMax, jitterPct: delaysJitter },
      mouse: {
        pathPoints: mousePathPoints,
        jitterPx: mouseJitterPx,
        minSpeed: mouseMinSpeed,
        maxSpeed: mouseMaxSpeed,
      },
      fingerprint: {
        languagesPool,
        platformPool,
        deviceMemoryRange: [deviceMemMin, deviceMemMax],
        hardwareConcurrencyRange: [hwMin, hwMax],
        webglSpoofing,
      },
      uaOverride,
      uaRotateStrategy,
    },
    cookies: { clearBefore, set, persist },
  };
}

function readResourceBlockEnv(): ResourceBlockOptions {
  const enabled = (process.env.RESOURCE_BLOCK_ENABLE ?? 'true') !== 'false';
  const blockImages = process.env.RESOURCE_BLOCK_IMAGES === 'true';
  const blockFonts = process.env.RESOURCE_BLOCK_FONTS === 'true';
  const blockAds = process.env.RESOURCE_BLOCK_ADS === 'true';
  const raw = process.env.RESOURCE_BLOCK_AD_PATTERNS ??
    'doubleclick.net,googlesyndication.com,adservice.google.com,ads.yahoo.com,adroll.com,/ads/,/adserver/';
  const adUrlPatterns = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  return { enabled, blockImages, blockFonts, blockAds, adUrlPatterns };
}

/**
 * Attaches fingerprint spoofing scripts before any document executes.
 *
 * This function modifies the properties of the navigator object to spoof various browser fingerprinting parameters, including languages, platform, hardware concurrency, and device memory. It also overrides the permissions query method to control notification permissions and optionally spoofs WebGL parameters if specified. The function utilizes a helper function to randomly select values from provided pools or defaults.
 *
 * @param page - The page object on which to evaluate the spoofing scripts.
 * @param params - The parameters for fingerprint spoofing, including languagesPool, platformPool, deviceMemoryRange, hardwareConcurrencyRange, and webglSpoofing.
 * @returns A promise that resolves when the scripts have been attached to the page.
 */
async function attachFingerprintSpoofing(
  page: any,
  params: NonNullable<EvasionParams['fingerprint']>
) {
  /**
   * Returns a random element from the array or a fallback value if the array is empty or not an array.
   */
  const pick = <T>(arr: T[], fallback: T) =>
    Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : fallback;
  const languages = params.languagesPool ?? ['en-US', 'en'];
  const platform = pick(params.platformPool ?? ['Win32'], 'Win32');
  const deviceMemoryRange = params.deviceMemoryRange ?? [4, 16];
  const hardwareConcurrencyRange = params.hardwareConcurrencyRange ?? [4, 16];
  const deviceMemory = Math.max(
    deviceMemoryRange[0],
    Math.min(
      deviceMemoryRange[1],
      Math.round(
        deviceMemoryRange[0] + Math.random() * (deviceMemoryRange[1] - deviceMemoryRange[0])
      )
    )
  );
  const hardwareConcurrency = Math.max(
    hardwareConcurrencyRange[0],
    Math.min(
      hardwareConcurrencyRange[1],
      Math.round(
        hardwareConcurrencyRange[0] +
          Math.random() * (hardwareConcurrencyRange[1] - hardwareConcurrencyRange[0])
      )
    )
  );

  await page.evaluateOnNewDocument(
    (opts: any) => {
      try {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => opts.languages });
        Object.defineProperty(navigator, 'platform', { get: () => opts.platform });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => opts.hardwareConcurrency,
        });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => opts.deviceMemory });
        // minimal window.chrome
        // @ts-ignore
        window.chrome = window.chrome || { runtime: {} };
        const originalQuery = Notification?.permission
          ? navigator.permissions && navigator.permissions.query
          : undefined;
        if (
          (navigator as any).permissions &&
          typeof (navigator as any).permissions.query === 'function'
        ) {
          const query = (navigator as any).permissions.query.bind((navigator as any).permissions);
          (navigator as any).permissions.query = (parameters: any) => {
            if (parameters && parameters.name === 'notifications') {
              return Promise.resolve({
                state: Notification.permission === 'granted' ? 'granted' : 'prompt',
              });
            }
            return query(parameters);
          };
        }
        if (opts.webglSpoofing) {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter: any) {
            if (parameter === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
            if (parameter === 37446) return 'ANGLE (Intel, Intel(R) UHD Graphics, Direct3D11)'; // UNMASKED_RENDERER_WEBGL
            return getParameter.call(this, parameter);
          };
        }
      } catch {}
    },
    {
      languages,
      platform,
      hardwareConcurrency,
      deviceMemory,
      webglSpoofing: !!params.webglSpoofing,
    }
  );
}

/**
 * Applies a small randomized delay to mimic human pacing.
 *
 * This function calculates a delay duration based on the provided parameters, ensuring that the minimum delay is at least 50 milliseconds and the maximum is at least equal to the minimum. It introduces a jitter effect to the delay, which is a percentage of the base delay, to create variability. Finally, it awaits the completion of a sleep function for the calculated duration.
 *
 * @param {NonNullable<EvasionParams["delays"]>} [params] - Optional parameters to configure the delay settings, including minMs, maxMs, and jitterPct.
 */
async function applySmallDelay(params?: NonNullable<EvasionParams['delays']>) {
  const min = Math.max(0, params?.minMs ?? 50);
  const max = Math.max(min, params?.maxMs ?? 250);
  const jitterPct = params?.jitterPct ?? 0.2;
  const base = min + Math.random() * (max - min);
  const jitter = base * jitterPct;
  const ms = Math.round(base + (Math.random() < 0.5 ? -jitter : jitter));
  await sleep(ms);
}

/**
 * Simulates human-like mouse movement along random waypoints.
 *
 * The function generates a series of random points within the viewport dimensions, applying jitter based on the provided parameters.
 * It then moves the mouse cursor to each point in sequence, calculating the distance and speed for a more natural movement effect.
 * A small delay is applied between movements to further mimic human behavior.
 *
 * @param page - The page object representing the context in which the mouse movement occurs.
 * @param params - Optional parameters for customizing the mouse movement behavior, including path points, jitter, and speed.
 */
async function simulateMouseMovement(page: any, params?: NonNullable<EvasionParams['mouse']>) {
  const vp = await page.viewport();
  const points = Math.max(2, params?.pathPoints ?? 6);
  const jitter = Math.max(0, params?.jitterPx ?? 3);
  const minSpeed = Math.max(100, params?.minSpeed ?? 300);
  const maxSpeed = Math.max(minSpeed, params?.maxSpeed ?? 800);
  const path: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const x =
      Math.floor(Math.random() * (vp.width - 20)) +
      10 +
      Math.floor((Math.random() - 0.5) * 2 * jitter);
    const y =
      Math.floor(Math.random() * (vp.height - 20)) +
      10 +
      Math.floor((Math.random() - 0.5) * 2 * jitter);
    path.push({ x, y });
  }
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const cur = path[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const steps = Math.max(1, Math.round(dist / (speed / 60)));
    await page.mouse.move(cur.x, cur.y, { steps });
    await applySmallDelay({ minMs: 10, maxMs: 40, jitterPct: 0.3 });
  }
}

/**
 * Clears all browser cookies using the Chrome DevTools Protocol (CDP).
 *
 * This function establishes a CDP session with the provided page and sends a command to clear all browser cookies.
 * It handles any potential errors silently, ensuring that the operation does not disrupt the flow of execution.
 *
 * @param {any} page - The page object from which to create a CDP session for cookie management.
 */
async function clearCookies(page: any) {
  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
  } catch {}
}

/**
 * Probes for common bot-detection signals.
 *
 * This function evaluates the content of the provided page to identify potential bot-detection signals.
 * It checks the inner text of the document body for specific keywords associated with bot detection,
 * such as "captcha" and "Access Denied". Additionally, it checks for a Cloudflare challenge signal
 * if present. The function returns an object indicating whether any signals were detected and the
 * list of detected signals.
 *
 * @param page - The page object to evaluate for bot-detection signals.
 */
async function probeBotDetection(page: any): Promise<{ detected: boolean; signals: string[] }> {
  const signals = await page.evaluate(() => {
    const text = document.body ? document.body.innerText || '' : '';
    const marks = [
      'captcha',
      'verify you are human',
      'unusual traffic',
      'Access Denied',
      'blocked by bot',
      'perimeterx',
      'datadome',
      'cloudflare',
    ];
    const hits = marks.filter((m) => text.toLowerCase().includes(m));
    const cf = (window as any).__cf_chl_opt ? 'cloudflare_challenge' : undefined;
    if (cf) hits.push(cf);
    return hits;
  });
  return { detected: signals.length > 0, signals };
}

/**
 * Launches a browser instance to navigate to a specified website URL.
 *
 * The function retrieves the website URL and network settings from the provided environment. It handles browser launching in both production and development modes, manages request interception for resource blocking, and applies stealth techniques such as fingerprint spoofing and user-agent rotation. It also logs various metrics related to resource blocking and evasion attempts, and returns a boolean indicating the success of the operation.
 *
 * @param environment - The execution environment containing configurations and methods for browser and network management.
 * @returns A promise that resolves to a boolean indicating whether the browser was successfully launched.
 */
export async function LaunchBrowserExecutor(
  environment: ExecutionEnvironment<typeof LaunchBrowserTask>
): Promise<boolean> {
  const logger = createLogger('executor/LaunchBrowser');
  try {
    const websiteUrl = environment.getInput('Website Url');
    const net = environment.getNetwork?.();
    const proxyMgr = net?.proxy as ProxyManager | undefined;
    const selection = proxyMgr ? await proxyMgr.select(websiteUrl) : ({ url: websiteUrl } as any);
    const { stealth, evasion, cookies } = readStealthEnv();
    const blocking = readResourceBlockEnv();
    let evasionAttempts = 0;
    let evasionFailures = 0;
    let detectionsFound = 0;
    let browser: Browser | BrowserCore | undefined = environment.getBrowser?.();
    const tStart = Date.now();
    logger.info(`@process.......... ${process.env.NODE_ENV} ${process.env.VERCEL_ENV}`);
    if (!browser) {
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        logger.info('Launching in production mode...');
        const executionPath =
          'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar';
        const launchArgs: string[] = [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--hide-scrollbars',
          '--disable-web-security',
        ];
        if (selection.proxy) launchArgs.push(`--proxy-server=${selection.proxy}`);
        browser = await puppeteerCore.launch({
          executablePath: await chromium.executablePath(executionPath),
          args: launchArgs,
          defaultViewport: chromium.defaultViewport,
          headless: chromium.headless,
          // @ts-ignore
          ignoreHTTPSErrors: true,
        });
        environment.log.info('Browser launched successfully.');
      } else {
        logger.info('Launching in development mode...');
        const execPath = await resolveChromeExecutablePath();
        const devArgs: string[] = ['--no-sandbox', '--disable-setuid-sandbox'];
        if (selection.proxy) devArgs.push(`--proxy-server=${selection.proxy}`);
        browser = await puppeteer.launch({
          headless: true,
          args: devArgs,
          executablePath: execPath,
        });
        environment.log.info('Browser launched successfully.');
      }
    } else {
      environment.log.info('Browser reused');
    }

    environment.setBrowser(browser);
    let page = environment.getPage?.();
    if (!page || (page as any).isClosed?.()) {
      page = await (browser as any).newPage();
    } else {
      try {
        (page as any).removeAllListeners?.('request');
      } catch {}
    }
    if (selection.auth) {
      try {
        await (page as any).authenticate(selection.auth);
      } catch {}
    }
    await page.setViewport({ width: 1080, height: 1024 });
    let totalRequests = 0;
    let blockedTotal = 0;
    let blockedImages = 0;
    let blockedFonts = 0;
    let blockedAds = 0;
    if (blocking.enabled) {
      try {
        await (page as any).setRequestInterception(true);
        (page as any).on('request', (req: any) => {
          const url: string = String(req.url()).toLowerCase();
          const type: string = String(req.resourceType?.());
          totalRequests += 1;
          let shouldBlock = false;
          if (blocking.blockImages && type === 'image') shouldBlock = true;
          if (
            !shouldBlock &&
            blocking.blockFonts &&
            (type === 'font' ||
              url.endsWith('.woff') ||
              url.endsWith('.woff2') ||
              url.endsWith('.ttf') ||
              url.endsWith('.otf'))
          )
            shouldBlock = true;
          if (!shouldBlock && blocking.blockAds) {
            for (const p of blocking.adUrlPatterns) {
              if (p && url.includes(p.toLowerCase())) {
                shouldBlock = true;
                break;
              }
            }
          }
          if (shouldBlock) {
            blockedTotal += 1;
            if (type === 'image') blockedImages += 1;
            else if (type === 'font' || url.endsWith('.woff') || url.endsWith('.woff2') || url.endsWith('.ttf') || url.endsWith('.otf')) blockedFonts += 1;
            else if (blocking.blockAds) blockedAds += 1;
            try {
              req.abort('blockedbyclient');
            } catch {
              try {
                req.continue();
              } catch {}
            }
          } else {
            try {
              req.continue();
            } catch {}
          }
        });
        environment.log.info(
          `RESOURCE_BLOCKING: enabled=${blocking.enabled} images=${blocking.blockImages} fonts=${blocking.blockFonts} ads=${blocking.blockAds}`
        );
      } catch {}
    }
    if (stealth.enabled && stealth.fingerprintSpoofing && evasion.fingerprint) {
      evasionAttempts++;
      try {
        await attachFingerprintSpoofing(page as any, evasion.fingerprint);
        environment.log.info('FINGERPRINT_APPLIED');
      } catch {
        evasionFailures++;
        environment.log.warning('EVASION_FALLBACK: fingerprint spoofing failed');
      }
    }
    const cfg = environment.getPolitenessConfig?.();
    const st = environment.getPolitenessState?.();
    if (cfg && st) {
      const ua = await applyHeaders(page as any, cfg, st, websiteUrl);
      const usedUA = ua || cfg.robots.userAgentOverride || '*';
      const allowed = await isAllowed(websiteUrl, cfg, st, usedUA);
      if (!allowed) {
        environment.log.error(`Blocked by robots.txt: ${websiteUrl}`);
        if (cfg.robots.enforcement === 'strict') {
          return false;
        }
      }
      if (stealth.enabled && evasion.uaOverride) {
        try {
          await (page as any).setUserAgent(evasion.uaOverride);
          environment.log.info('User-Agent override applied');
        } catch {}
      }
      if (stealth.enabled && evasion.uaRotateStrategy && cfg.userAgent?.pool?.length) {
        try {
          const pool = cfg.userAgent.pool;
          const nextUA = pool[Math.floor(Math.random() * pool.length)];
          await (page as any).setUserAgent(nextUA);
          environment.log.info('User-Agent rotated (stealth)');
        } catch {}
      }
    }
    if (stealth.enabled && stealth.cookieManagement && cookies.clearBefore) {
      evasionAttempts++;
      try {
        await clearCookies(page as any);
        environment.log.info('COOKIE_CLEAR');
      } catch {
        evasionFailures++;
        environment.log.warning('EVASION_FALLBACK: cookie clear failed');
      }
    }
    // Restore cookies from session manager if configured
    if (net?.cookies?.enabled && net?.cookies?.persist && (net.session as any)) {
      try {
        const jar = (net.session as any).jarRef?.();
        const header = jar?.cookieHeaderFor(websiteUrl);
        if (header) {
          const pairs = header.split(/;\s*/).map((kv) => {
            const [name, value] = kv.split('=');
            return { name, value, url: websiteUrl } as any;
          });
          if (pairs.length) await (page as any).setCookie(...pairs);
        }
      } catch {}
    }
    if (stealth.enabled && stealth.cookieManagement && cookies.set && cookies.set.length) {
      evasionAttempts++;
      try {
        await (page as any).setCookie(...cookies.set);
        environment.log.info('COOKIE_SET');
      } catch {
        evasionFailures++;
        environment.log.warning('EVASION_FALLBACK: cookie set failed');
      }
    }
    if (stealth.enabled && stealth.randomizedDelays) {
      await applySmallDelay(evasion.delays);
      environment.log.info('DELAY_APPLIED: pre-navigation');
    }
    if (stealth.enabled && stealth.mouseMovement) {
      evasionAttempts++;
      try {
        await simulateMouseMovement(page as any, evasion.mouse);
        environment.log.info('MOUSE_SIMULATION: pre-navigation');
      } catch {
        evasionFailures++;
        environment.log.warning('EVASION_FALLBACK: mouse simulation failed');
      }
    }
    await page.goto(websiteUrl, { waitUntil: 'domcontentloaded' });
    if (stealth.enabled && stealth.randomizedDelays) {
      await applySmallDelay(evasion.delays);
      environment.log.info('DELAY_APPLIED: post-navigation');
    }
    const tEnd = Date.now();
    if (stealth.enabled) {
      const probe = await probeBotDetection(page as any);
      if (probe.detected) {
        detectionsFound += 1;
        environment.log.warning(`DETECTION_PROBE: ${probe.signals.join(',')}`);
        if (evasion.uaOverride || (cfg && cfg.userAgent?.pool?.length)) {
          try {
            const pool = (cfg && cfg.userAgent?.pool) || [];
            if (!evasion.uaOverride && pool.length) {
              const nextUA = pool[Math.floor(Math.random() * pool.length)];
              await (page as any).setUserAgent(nextUA);
            }
            await page.reload({ waitUntil: 'domcontentloaded' });
            const probe2 = await probeBotDetection(page as any);
            if (probe2.detected) {
              detectionsFound += 1;
              environment.log.warning(
                `DETECTION_PROBE: retry still detected ${probe2.signals.join(',')}`
              );
            } else {
              environment.log.info('EVASION_RETRY: detection cleared after UA change');
            }
          } catch {
            environment.log.warning('EVASION_FALLBACK: retry failed');
          }
        }
      }
    }
    environment.setPage(page);
    environment.log.info(`Opened the website successfully. URL:${websiteUrl}`);
    environment.log.info(
      `RESOURCE_BLOCKING_METRIC: total=${totalRequests} blocked=${blockedTotal} blockedImages=${blockedImages} blockedFonts=${blockedFonts} blockedAds=${blockedAds}`
    );
    environment.log.info(`PERF_METRIC: domContentLoadedMs=${tEnd - tStart}`);
    if (stealth.enabled) {
      environment.log.info(
        `EVASION_METRIC: attempts=${evasionAttempts} failures=${evasionFailures} detections=${detectionsFound}`
      );
    }

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to launch browser: ${e.message}`);
    logger.error(`Error while launching puppeteer: ${e instanceof Error ? e.message : String(e)}`);
    try {
      const b = environment.getBrowser?.();
      if (!b) throw new Error('noop');
      if ((b as any).isConnected?.()) {
        await (b as any).close?.();
      }
    } catch {}
    return false;
  }
}

export async function resolveChromeExecutablePath(platform?: NodeJS.Platform): Promise<string> {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const p = platform ?? process.platform;
  const candidates: string[] = [];
  if (p === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || `${os.homedir()}\\AppData\\Local`;
    candidates.push(
      'C\\\u005c\u005cProgram Files\\\u005c\u005cGoogle\\\u005c\u005cChrome\\\u005c\u005cApplication\\\u005c\u005cchrome.exe',
      'C\\\u005c\u005cProgram Files (x86)\\\u005c\u005cGoogle\\\u005c\u005cChrome\\\u005c\u005cApplication\\\u005c\u005cchrome.exe',
      `${localAppData}\\\u005c\u005cGoogle\\\u005c\u005cChrome\\\u005c\u005cApplication\\\u005c\u005cchrome.exe`
    );
  } else if (p === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    );
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    'Chrome executable not found; set PUPPETEER_EXECUTABLE_PATH or install Chrome/Chromium'
  );
}
