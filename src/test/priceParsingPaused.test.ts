import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

describe("Price parsing remains paused", () => {
  for (const name of ["parse-drug-prices", "parse-lab-prices"]) {
    it(`${name} does not fetch prices or access the database`, async () => {
      const source = readFileSync(`supabase/functions/${name}/index.ts`, "utf8").replace(/^import .*;\s*/m, "");
      const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
      let handler: ((req: Request) => Promise<Response>) | undefined;
      const fetch = vi.fn(() => { throw new Error("Price requests must not run"); });
      const createClient = vi.fn(() => { throw new Error("Database writes must not run"); });
      const getEnv = vi.fn(() => { throw new Error("Paused handler must not need secrets"); });
      runInNewContext(code, {
        Deno: { serve: (fn: typeof handler) => { handler = fn; }, env: { get: getEnv } },
        Response, fetch, createClient,
      });
      if (!handler) throw new Error("Handler not registered");
      const response = await handler(new Request("https://example.test", { method: "POST", body: '{"batch":true}' }));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ disabled: true, processed: 0 });
      expect(fetch).not.toHaveBeenCalled();
      expect(createClient).not.toHaveBeenCalled();
      expect(getEnv).not.toHaveBeenCalled();
    });
  }
});