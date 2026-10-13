import "dotenv/config";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TABLES = ["people", "source_profiles", "dating_profiles", "conversations", "messages"];

async function check(name: string, run: () => Promise<string>): Promise<boolean> {
  try {
    console.log(`ok    ${name}: ${await run()}`);
    return true;
  } catch (error) {
    console.log(`FAIL  ${name}: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  const env = serverEnv();

  const results = await Promise.all([
    check("Apify", async () => {
      const response = await fetch("https://api.apify.com/v2/users/me", {
        headers: { Authorization: `Bearer ${env.APIFY_API_TOKEN}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
      return `signed in as ${body.data.username}`;
    }),
    check("OpenRouter", async () => {
      const response = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
      return `key valid, model ${env.OPENROUTER_MODEL}`;
    }),
    ...TABLES.map((table) =>
      check(`Supabase table ${table}`, async () => {
        const { count, error } = await supabaseAdmin().from(table).select("id", { count: "exact" }).limit(1);
        if (error) throw new Error(error.message || error.code || "query failed");
        return `${count ?? 0} rows`;
      }),
    ),
  ]);

  if (results.includes(false)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
