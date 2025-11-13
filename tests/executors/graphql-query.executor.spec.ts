import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { GraphQLQueryExecutor } from "@/lib/workflow/executor/GraphQLQueryExecutor";

function env(inputs: Record<string, any>) {
  const outputs: Record<string, any> = {};
  const log = {
    info: (_: string) => {},
    error: (_: string) => {},
    warning: (_?: string) => {},
    getAll: () => [],
  } as any;
  return {
    getInput: (n: any) => inputs[n],
    setOutput: (n: any, v: any) => (outputs[n] = v),
    getPage: () => undefined,
    setPage: (_: any) => {},
    getBrowser: () => undefined,
    setBrowser: (_: any) => {},
    log,
    getPolitenessConfig: () => undefined,
    getPolitenessState: () => undefined,
    outputs,
  } as any;
}

describe("GraphQLQueryExecutor", () => {
  let server: any;
  let port: number;
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/graphql") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ data: { ok: true } }));
        });
      } else {
        res.setHeader("content-type", "text/plain");
        res.end("ok");
      }
    });
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    port = (server.address() as any).port;
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("posts query and returns JSON", async () => {
    const inputs = {
      "Endpoint URL": `http://localhost:${port}/graphql`,
      "Query": "query { ok }",
      "Variables JSON": "{}",
      "Use browser context": "false",
    };
    const e = env(inputs);
    const ok = await GraphQLQueryExecutor(e);
    expect(ok).toBe(true);
    const data = JSON.parse(e.outputs["Response JSON"]);
    expect(data).toEqual({ data: { ok: true } });
  });
});

