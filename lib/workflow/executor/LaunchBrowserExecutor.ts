import puppeteer, { type Browser } from "puppeteer";
import { type Browser as BrowserCore } from "puppeteer-core";
const puppeteerCore = require("puppeteer-core");
// const chromium = require("@sparticuz/chromium-min");
import chromium from "@sparticuz/chromium-min";
import { ExecutionEnvironment } from "@/types/executor";
import { LaunchBrowserTask } from "../task/LaunchBrowser";
import { createLogger } from "@/lib/log";

export async function LaunchBrowserExecutor(
  environment: ExecutionEnvironment<typeof LaunchBrowserTask>
): Promise<boolean> {
  const logger = createLogger("executor/LaunchBrowser");
  try {
    const websiteUrl = environment.getInput("Website Url");
    let browser: Browser | BrowserCore;
    logger.info(
      `@process.......... ${process.env.NODE_ENV} ${process.env.VERCEL_ENV}`
    );
    if (
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production"
    ) {
      logger.info("Launching in production mode...");
      // Updated production configuration
      const executionPath =
        "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar";

      // "https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar"
      // "/opt/nodejs/node_modules/@sparticuz/chromium/bin"

      browser = await puppeteerCore.launch({
        executablePath: await chromium.executablePath(executionPath),
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--hide-scrollbars",
          "--disable-web-security",
        ],
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        // @ts-ignore
        ignoreHTTPSErrors: true,
      });
    } else {
      logger.info("Launching in development mode...");
      const localExecutablePath =
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      browser = await puppeteer.launch({
        headless: true, //testing in headful modes
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: localExecutablePath,
      });
    }

    environment.log.info("Browser launched successfully.");
    environment.setBrowser(browser);
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto(websiteUrl, { waitUntil: "domcontentloaded" });
    environment.setPage(page);
    environment.log.info(`Opened the website successfully. URL:${websiteUrl}`);

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to launch browser: ${e.message}`);
    logger.error(
      `Error while launching puppeteer: ${e instanceof Error ? e.message : String(e)}`
    );
    return false;
  }
}
