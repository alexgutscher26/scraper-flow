import { ExecutionEnvironment } from "@/types/executor";
import { ExtractTableDataTask } from "../task/ExtractTableData";
import * as cheerio from "cheerio";

export async function ExtractTableDataExecutor(
  environment: ExecutionEnvironment<typeof ExtractTableDataTask>
): Promise<boolean> {
  try {
    const html = environment.getInput("Html");
    if (!html) {
      environment.log.error("Input HTML is required");
      return false;
    }

    const selector = environment.getInput("Table selector");
    if (!selector) {
      environment.log.error("Input Table selector is required");
      return false;
    }

    const outputFormat = environment.getInput("Output format") || "JSON";

    environment.log.info(`Extracting table data with selector: ${selector}`);

    const $ = cheerio.load(html);
    const table = $(selector).first();

    if (table.length === 0) {
      environment.log.error(`No table found with selector: ${selector}`);
      return false;
    }

    const rows: string[][] = [];
    const headers: string[] = [];

    // Extract headers
    table
      .find("thead tr, tr")
      .first()
      .find("th, td")
      .each((_, cell) => {
        headers.push($(cell).text().trim());
      });

    // Extract rows
    table.find("tbody tr, tr:not(:first-child)").each((_, row) => {
      const rowData: string[] = [];
      $(row)
        .find("td, th")
        .each((_, cell) => {
          rowData.push($(cell).text().trim());
        });
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    // If no headers were found in thead, use first row as headers
    if (headers.length === 0 && rows.length > 0) {
      headers.push(...rows[0]);
      rows.shift();
    }

    let result: string;

    if (outputFormat === "CSV") {
      // CSV format
      const csvRows = [headers, ...rows];
      result = csvRows
        .map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
    } else {
      // JSON format
      const jsonData = rows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });
      result = JSON.stringify(jsonData, null, 2);
    }

    environment.setOutput("Table data", result);
    environment.log.info(
      `Successfully extracted ${rows.length} rows from table in ${outputFormat} format`
    );

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to extract table data: ${e.message}`);
    return false;
  }
}
