import { ExecutionEnvironment } from "@/types/executor";
import { SolveCaptchaTask } from "../task/SolveCaptcha";
import { ReCaptchaProvider } from "./captcha/ReCaptchaProvider";
import { HCaptchaProvider } from "./captcha/HCaptchaProvider";

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
    environment.setOutput("Token", "");
    environment.setOutput("CaptchaSolved", false);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    environment.setOutput("CaptchaSolved", false);
    return false;
  }
}

