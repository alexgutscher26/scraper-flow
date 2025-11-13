import { ExecutionEnvironment } from "@/types/executor";
import { SelectOptionTask } from "../task/SelectOption";

/**
 * Parses a comma-separated string input into an array of trimmed values.
 */
function parseValues(input: any) {
  const s = String(input ?? "");
  return s.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * Selects options in a web page based on the provided execution environment and input parameters.
 *
 * The function retrieves various inputs such as selector, mode, values, and search query from the environment.
 * It checks for required inputs and waits for the selector to be visible. Depending on the tag type, it either
 * selects options directly or simulates keyboard interactions to select options. It also handles filtering
 * and logs errors if options are not found. Finally, it sets the output values in the environment.
 *
 * @param environment - The execution environment containing input methods and logging capabilities.
 * @returns A promise that resolves to a boolean indicating the success of the selection process.
 */
export async function SelectExecutor(
  environment: ExecutionEnvironment<typeof SelectOptionTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput("Selector");
    const mode = environment.getInput("Mode");
    const values = parseValues(environment.getInput("Values"));
    const searchQuery = environment.getInput("SearchQuery");
    const useKeyboard = Boolean(environment.getInput("UseKeyboard"));
    const optionFilter = environment.getInput("OptionFilter");
    const openTriggerSelector = environment.getInput("OpenTriggerSelector");
    const optionSelector = environment.getInput("OptionSelector");
    if (!selector) {
      environment.log.error("Input Selector is required");
      return false;
    }
    if (!mode) {
      environment.log.error("Input Mode is required");
      return false;
    }
    if (!values.length) {
      environment.log.error("Values are required");
      return false;
    }
    const page = environment.getPage();
    if (!page) {
      environment.log.error("Web page is required");
      return false;
    }

    await page.waitForSelector(selector, { visible: true });
    const tagName = await page.$eval(selector, (el: any) => el.tagName?.toLowerCase());

    if (tagName === "select") {
      const res = await page.select(selector, ...values);
      environment.setOutput("SelectedValues", res.join(","));
      environment.setOutput("Web page", page);
      environment.setOutput("Success", res.length > 0);
      return res.length > 0;
    }

    const triggerSel = openTriggerSelector || selector;
    await page.click(triggerSel);
    if (searchQuery) {
      await page.type(triggerSel, String(searchQuery));
    }

    if (useKeyboard) {
      for (const v of values) {
        let found = false;
        for (let i = 0; i < 50; i++) {
          await page.keyboard.press("ArrowDown");
          const ok = await page.evaluate((txt) => {
            const el = document.activeElement as HTMLElement | null;
            const t = el?.innerText || el?.textContent || "";
            return t?.toLowerCase().includes(String(txt).toLowerCase());
          }, v);
          if (ok) {
            await page.keyboard.press("Enter");
            found = true;
            break;
          }
        }
        if (!found) {
          environment.log.error("Option not found via keyboard");
          return false;
        }
      }
    } else {
      const filterRe = optionFilter ? new RegExp(String(optionFilter)) : null;
      const clicked = await page.evaluate(
        ({ containerSel, optSel, vals, filter, multi }) => {
          const container = document.querySelector(containerSel) as HTMLElement | null;
          const scope = container || document;
          const q = optSel ? scope.querySelectorAll(optSel) : scope.querySelectorAll("[role='option'], li, div");
          const want = new Set(vals.map((v: string) => v.toLowerCase()));
          let count = 0;
          q.forEach((el) => {
            const t = (el.textContent || "").trim();
            const matchText = want.has(t.toLowerCase());
            const matchFilter = filter ? new RegExp(filter).test(t) : true;
            if ((matchText || matchFilter) && count < want.size) {
              (el as HTMLElement).click();
              count++;
            }
          });
          return count;
        },
        { containerSel: selector, optSel: optionSelector, vals: values, filter: optionFilter, multi: mode === "multiple" }
      );
      if (clicked < values.length && mode === "single") {
        environment.log.error("Option not found for single select");
        return false;
      }
    }

    const out = values.join(",");
    environment.setOutput("SelectedValues", out);
    environment.setOutput("Web page", page);
    environment.setOutput("Success", true);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    environment.setOutput("Success", false);
    return false;
  }
}

