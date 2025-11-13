import { CaptchaProvider, CaptchaDetection, CaptchaSolution } from "./CaptchaStrategy";

export class HCaptchaProvider implements CaptchaProvider {
  detect(html: string): CaptchaDetection {
    const hasDiv = /hcaptcha/.test(html);
    const sitekeyMatch = html.match(/data-sitekey\s*=\s*"([^"]+)"/);
    return { type: hasDiv ? "hcaptcha" : "unknown", sitekey: sitekeyMatch?.[1] };
  }
  async solve(sitekey: string, pageUrl: string, credential?: string, action?: string): Promise<CaptchaSolution> {
    return { token: "", provider: "none" };
  }
}

