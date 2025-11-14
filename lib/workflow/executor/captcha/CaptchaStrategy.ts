export type CaptchaDetection = {
  type: 'recaptcha' | 'hcaptcha' | 'unknown';
  sitekey?: string;
  action?: string;
};

export type CaptchaSolution = {
  token: string;
  provider: string;
};

export interface CaptchaProvider {
  detect(html: string): CaptchaDetection;
  solve(
    sitekey: string,
    pageUrl: string,
    credential?: string,
    action?: string
  ): Promise<CaptchaSolution>;
}
