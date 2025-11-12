import { ExecutionEnvironment } from "@/types/executor";
import { DownloadFileTask } from "../task/DownloadFile";
import * as fs from "fs";
import * as path from "path";

// Helper function to download files using browser page (for cases requiring authentication/cookies)
async function downloadWithBrowser(
  page: any,
  url: string,
  environment: any
): Promise<Buffer | null> {
  try {
    // Use page.evaluate to fetch the file using the browser's session
    const base64Data = await page.evaluate(async (downloadUrl: string) => {
      try {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
      } catch (error) {
        console.error("Browser fetch error:", error);
        return null;
      }
    }, url);

    if (!base64Data) {
      environment.log.error("Browser-based fetch returned no data");
      return null;
    }

    environment.log.info(
      `Browser fetch successful, base64 length: ${base64Data.length}`
    );
    return Buffer.from(base64Data, "base64");
  } catch (error: any) {
    environment.log.error(`Browser download error: ${error.message}`);
    return null;
  }
}

export async function DownloadFileExecutor(
  environment: ExecutionEnvironment<typeof DownloadFileTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const fileUrl = environment.getInput("File URL");
    const urlType = environment.getInput("URL type");
    const customFilename = environment.getInput("File name");

    if (!page || !fileUrl || !urlType) {
      environment.log.error("Web page, file URL, and URL type are required");
      return false;
    }

    let downloadUrl: string;
    let filename: string;
    if (urlType === "direct") {
      downloadUrl = fileUrl;

      // Validate the URL
      try {
        new URL(fileUrl);
      } catch (urlError) {
        environment.log.error(`Invalid URL provided: ${fileUrl}`);
        return false;
      }

      filename =
        customFilename ||
        path.basename(new URL(fileUrl).pathname) ||
        "downloaded_file";

      environment.log.info(
        `Using direct URL: ${downloadUrl} with filename: ${filename}`
      );
    } else {
      // Link selector
      try {
        const element = await page.$(fileUrl);
        if (!element) {
          environment.log.error(`Element not found with selector: ${fileUrl}`);
          return false;
        }

        // Get the URL from the element's href, src, or data-url attribute
        const downloadUrl_temp = await (page as any).evaluate((el: any) => {
          return (
            el.href ||
            el.src ||
            el.getAttribute("href") ||
            el.getAttribute("src") ||
            el.getAttribute("data-url")
          );
        }, element);

        downloadUrl = downloadUrl_temp;
        if (!downloadUrl) {
          environment.log.error("Could not extract download URL from element");
          return false;
        }

        // Handle relative URLs by resolving them against the current page URL
        if (
          !downloadUrl.startsWith("http://") &&
          !downloadUrl.startsWith("https://")
        ) {
          const pageUrl = page.url();
          try {
            downloadUrl = new URL(downloadUrl, pageUrl).href;
            environment.log.info(`Resolved relative URL to: ${downloadUrl}`);
          } catch (urlError) {
            environment.log.error(
              `Failed to resolve relative URL: ${downloadUrl} against ${pageUrl}`
            );
            return false;
          }
        }

        // Validate the final URL
        try {
          new URL(downloadUrl);
        } catch (urlError) {
          environment.log.error(
            `Invalid URL extracted from element: ${downloadUrl}`
          );
          return false;
        }

        environment.log.info(`Extracted URL from selector: ${downloadUrl}`);

        filename = customFilename || `element_download_${Date.now()}`;
      } catch (error: any) {
        environment.log.error(
          `Failed to extract download URL: ${error.message}`
        );
        return false;
      }
    }

    environment.log.info(`Starting download from: ${downloadUrl}`);

    // Create downloads directory if it doesn't exist
    const downloadDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    const filePath = path.join(downloadDir, filename); // Download the file
    environment.log.info(`Attempting to fetch: ${downloadUrl}`);

    // Add timeout to prevent hanging downloads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      environment.log.error("Download timed out after 30 seconds");
    }, 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(downloadUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        method: "GET",
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        environment.log.error("Download was aborted due to timeout");
      } else {
        environment.log.error(`Fetch failed: ${error.message}`);
      }
      return false;
    }
    clearTimeout(timeoutId);

    environment.log.info(
      `Fetch response status: ${response.status} ${response.statusText}`
    );
    environment.log.info(
      `Response headers: ${JSON.stringify(
        Object.fromEntries(response.headers.entries())
      )}`
    );

    // Initialize buffer variable
    let buffer: Buffer;

    if (!response.ok) {
      environment.log.error(
        `Direct fetch failed: ${response.status} ${response.statusText}`
      );

      // Try alternative method using browser page for downloads that require session/cookies
      environment.log.info("Attempting browser-based download as fallback...");
      try {
        const browserBuffer = await downloadWithBrowser(
          page,
          downloadUrl,
          environment
        );
        if (browserBuffer && browserBuffer.length > 0) {
          buffer = browserBuffer;
          environment.log.info(
            `Browser-based download successful, size: ${buffer.length} bytes`
          );
        } else {
          environment.log.error("Browser-based download also failed");
          return false;
        }
      } catch (browserError: any) {
        environment.log.error(
          `Browser-based download failed: ${browserError.message}`
        );
        return false;
      }
    } else {
      // Check content length if available
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        environment.log.info(`Expected content length: ${contentLength} bytes`);
      } else {
        environment.log.info("Content length not provided by server");
      }

      // Convert response to buffer with error handling
      try {
        const arrayBuffer = await response.arrayBuffer();
        environment.log.info(
          `ArrayBuffer received, size: ${arrayBuffer.byteLength} bytes`
        );

        if (arrayBuffer.byteLength === 0) {
          environment.log.error("Response arrayBuffer is empty");
          return false;
        }

        buffer = Buffer.from(arrayBuffer);
        environment.log.info(`Buffer created, size: ${buffer.length} bytes`);
      } catch (error: any) {
        environment.log.error(
          `Failed to convert response to buffer: ${error.message}`
        );
        return false;
      }
    }

    if (buffer.length === 0) {
      environment.log.error("Downloaded file is empty (0 bytes)");
      return false;
    }

    fs.writeFileSync(filePath, buffer);
    const fileSize = fs.statSync(filePath).size;
    environment.log.info(`File downloaded: ${filename} (${fileSize} bytes)`);

    // Verify file was written correctly
    if (fileSize === 0) {
      environment.log.error("File was written but has 0 bytes");
      return false;
    }

    // Convert to base64 with error handling
    let fileData = "";
    try {
      if (fileSize > 50 * 1024 * 1024) {
        // 50MB limit
        environment.log.warning(
          `File ${filename} is very large (${fileSize} bytes), base64 conversion may be slow`
        );
      }
      fileData = buffer.toString("base64");
      environment.log.info(
        `File data converted to base64 (${fileData.length} characters)`
      );
      if (fileData.length === 0) {
        environment.log.error("Base64 conversion resulted in empty string");
        return false;
      }
    } catch (error: any) {
      environment.log.error(
        `Failed to convert file to base64: ${error.message}`
      );
      return false; // Return false instead of continuing with empty data
    }

    // Additional validation to ensure we have valid file data
    if (!fileData || fileData.length === 0) {
      environment.log.error("No file data available after processing");
      return false;
    }

    // Pass the browser instance through - don't serialize the page object
    environment.setOutput("Web page", environment.getInput("Web page"));
    environment.setOutput("File name", filename);
    environment.setOutput("File data", fileData);

    environment.log.info(
      `File download completed: ${filename} (${fileSize} bytes, ${
        fileData.length > 0 ? "base64 data available" : "no base64 data"
      })`
    );

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to download file: ${e.message}`);
    return false;
  }
}
