import { ExecutionEnvironment } from "@/types/executor";
import { SolveCaptchaTask } from "../task/SolveCaptcha";
import { ReCaptchaProvider } from "./captcha/ReCaptchaProvider";
import { HCaptchaProvider } from "./captcha/HCaptchaProvider";
import { http } from "@/lib/http";
import { formatCredentialForExecutor } from "@/lib/credential/credentialHelper";

export async function CaptchaExecutor(
  environment: ExecutionEnvironment<typeof SolveCaptchaTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error("Web page is required");
      return false;
    }
    const credential = environment.getInput("CaptchaCredential");
    const securityLevel = String(environment.getInput("SecurityLevel") || "medium");
    const captchaTypePref = String(environment.getInput("CaptchaType") || "auto");
    const html = await page.content();
    const rec = new ReCaptchaProvider().detect(html);
    const hc = new HCaptchaProvider().detect(html);
    let type = "unknown" as const;
    let sitekey: string | undefined;
    if (rec.type === "recaptcha") {
      type = "recaptcha";
      sitekey = rec.sitekey;
    } else if (hc.type === "hcaptcha") {
      type = "hcaptcha";
      sitekey = hc.sitekey;
    }
    if (type === "unknown" || !sitekey) {
      environment.log.error("Captcha not detected");
      environment.setOutput("CaptchaSolved", false);
      return false;
    }
    environment.setOutput("Provider", type);

    // Attempt token extraction from page
    let token = "";
    if (type === "recaptcha") {
      try {
        token = await page.evaluate(async ({ prefer }) => {
          // Try hidden textarea first
          const ta = document.querySelector("#g-recaptcha-response") as HTMLTextAreaElement | null;
          if (ta && ta.value) return ta.value;
          // Try grecaptcha.execute for invisible
          // @ts-ignore
          const g = (window as any).grecaptcha;
          if (g && typeof g.execute === "function" && (prefer === "auto" || prefer === "invisible")) {
            try {
              const sitekeyEl = document.querySelector("[data-sitekey]") as HTMLElement | null;
              const sk = sitekeyEl?.getAttribute("data-sitekey");
              if (!sk) return "";
              const t = await g.execute(sk, { action: "submit" });
              return String(t || "");
            } catch {}
          }
          return "";
        }, { prefer: captchaTypePref });
      } catch {}
    } else if (type === "hcaptcha") {
      try {
        token = await page.evaluate(() => {
          const inp = document.querySelector("textarea[name='h-captcha-response']") as HTMLTextAreaElement | null;
          return inp?.value || "";
        });
      } catch {}
    }

    environment.setOutput("Token", token);

    // If no token, cannot solve automatically
    if (!token) {
      environment.log.warning?.("Captcha token not available; manual solve or provider integration required");
      environment.setOutput("CaptchaSolved", false);
      environment.setOutput("VerificationPassed", false);
      return true; // detection succeeded
    }

    // Verify token via provider endpoint when credential secret is available
    let verified = false;
    let endpoint = "";
    if (type === "recaptcha") endpoint = "https://www.google.com/recaptcha/api/siteverify";
    if (type === "hcaptcha") endpoint = "https://hcaptcha.com/siteverify";

    let secret: string | undefined;
    try {
      if (credential) {
        const parsed = typeof credential === "string" ? JSON.parse(credential) : credential;
        secret = parsed.apiKey || parsed.secret || undefined;
      }
    } catch {}

    if (!secret) {
      environment.log.warning?.("Captcha secret not provided; skipping verification");
      environment.setOutput("CaptchaSolved", Boolean(token));
      environment.setOutput("VerificationPassed", false);
      return true;
    }

    try {
      const res = await http.post<any>(endpoint, {
        body: { secret, response: token },
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });
      // Endpoints expect form-urlencoded; http client sends JSON; retry with fetch form if needed
      if (!res || (res.success === undefined)) {
        const form = new URLSearchParams({ secret, response: token });
        const raw = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
        const j = await raw.json();
        verified = Boolean(j.success);
      } else {
        verified = Boolean((res as any).success);
      }
    } catch (err: any) {
      environment.log.error(String(err?.message || err));
      verified = false;
    }

    environment.setOutput("CaptchaSolved", Boolean(token));
    environment.setOutput("VerificationPassed", verified);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    environment.setOutput("CaptchaSolved", false);
    environment.setOutput("VerificationPassed", false);
    return false;
  }
}
