import { ExecutionEnvironment } from '@/types/executor';
import { InterceptNetworkTask } from '../task/InterceptNetwork';

/**
 * Intercepts network requests and responses based on specified criteria.
 *
 * This function retrieves input parameters such as URL pattern, resource type, method, duration, and max responses.
 * It sets up event handlers for network responses and finished requests, filtering them according to the specified criteria.
 * The collected data is then output as JSON. If any errors occur during processing, they are logged, and the function returns false.
 *
 * @param environment - The execution environment containing methods for logging and retrieving input parameters.
 * @returns A promise that resolves to true if the operation is successful, or false if it fails.
 */
export async function InterceptNetworkExecutor(
  environment: ExecutionEnvironment<typeof InterceptNetworkTask>
): Promise<boolean> {
  const page = environment.getPage();
  if (!page) {
    environment.log.error('Web page not found');
    return false;
  }

  try {
    const urlPattern = environment.getInput('URL pattern');
    const resourceType = environment.getInput('Resource type') || 'any';
    const method = environment.getInput('Method') || 'ANY';
    const duration = Number(environment.getInput('Duration (ms)'));
    const max = Number(environment.getInput('Max responses')) || Infinity;
    const includeBody = environment.getInput('Include body') === 'true';

    const matches: any[] = [];
    const isRegex = urlPattern && /^\/.+\/$/.test(urlPattern);
    const regex = isRegex ? new RegExp(urlPattern.slice(1, -1)) : null;

    const seen = new Set<string>();
    const pushItem = (item: any) => {
      const key = `${item.method}|${item.url}|${item.status}`;
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(item);
      if (matches.length >= max) {
        page.off('response', handlerResponse);
        page.off('requestfinished', handlerFinished);
      }
    };

    /**
     * Handles the response from a network request and processes it based on specified criteria.
     *
     * The function extracts the request details, including URL, method, and resource type, and checks them against provided filters.
     * If the response body is to be included, it attempts to parse it based on the content type.
     * Additionally, it captures any post data from the request and logs warnings for any errors encountered during processing.
     *
     * @param response - The response object from the network request.
     */
    const handlerResponse = async (response: any) => {
      try {
        const req = response.request();
        const url = response.url();
        const type = req.resourceType();
        const m = (req.method && req.method()) || 'GET';

        if (resourceType !== 'any' && type !== resourceType) return;
        if (method !== 'ANY' && m !== method) return;
        if (urlPattern) {
          if (regex) {
            if (!regex.test(url)) return;
          } else {
            if (!url.includes(urlPattern)) return;
          }
        }

        const item: any = {
          url,
          status: response.status(),
          resourceType: type,
          method: m,
          headers: response.headers(),
        };

        if (includeBody) {
          const ct = (await response.headers())['content-type'] || '';
          try {
            if (ct.includes('application/json')) {
              item.body = await response.json();
            } else {
              item.body = await response.text();
            }
          } catch (_) {
            item.body = null;
          }
        }

        try {
          const pd = req.postData && req.postData();
          item.postData = pd || null;
        } catch (_) {
          item.postData = null;
        }

        pushItem(item);
      } catch (err: any) {
        environment.log.warning(err?.message);
      }
    };

    /**
     * Handles the completion of a request and processes its details.
     *
     * This function extracts the URL, resource type, and method from the request. It checks if the resource type and method match specified criteria, and validates the URL against a pattern if provided. It then gathers the response details, including status, headers, and optionally the body and post data, before pushing the item to a collection. Errors during processing are logged for debugging purposes.
     *
     * @param request - The request object containing details about the completed request.
     */
    const handlerFinished = async (request: any) => {
      try {
        const url = request.url();
        const type = request.resourceType();
        const m = (request.method && request.method()) || 'GET';
        if (resourceType !== 'any' && type !== resourceType) return;
        if (method !== 'ANY' && m !== method) return;
        if (urlPattern) {
          if (regex) {
            if (!regex.test(url)) return;
          } else {
            if (!url.includes(urlPattern)) return;
          }
        }
        const resp = request.response();
        if (!resp) return;
        const item: any = {
          url,
          status: resp.status(),
          resourceType: type,
          method: m,
          headers: resp.headers(),
        };
        if (includeBody) {
          const ct = resp.headers()['content-type'] || '';
          try {
            if (ct.includes('application/json')) {
              item.body = await resp.json();
            } else {
              item.body = await resp.text();
            }
          } catch (_) {
            item.body = null;
          }
        }
        try {
          const pd = request.postData && request.postData();
          item.postData = pd || null;
        } catch (_) {
          item.postData = null;
        }
        pushItem(item);
      } catch (err: any) {
        environment.log.warning(err?.message);
      }
    };

    page.on('response', handlerResponse);
    page.on('requestfinished', handlerFinished);

    await new Promise<void>((resolve) => {
      setTimeout(
        () => {
          page.off('response', handlerResponse);
          page.off('requestfinished', handlerFinished);
          resolve();
        },
        Number.isFinite(duration) ? duration : 2000
      );
    });

    environment.setOutput('Responses JSON', JSON.stringify(matches));
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    try {
      page.off('response', () => {});
    } catch {}
    environment.log.error(e.message);
    return false;
  }
}
