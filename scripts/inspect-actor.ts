import "dotenv/config";

async function main() {
  const actorId = process.argv[2];
  if (!actorId) throw new Error("Usage: npm run inspect-actor -- <owner~actor-name>");

  const headers = { Authorization: `Bearer ${process.env.APIFY_API_TOKEN}` };
  const build = await fetch(`https://api.apify.com/v2/acts/${actorId}/builds/default`, { headers });
  const body = await build.json();
  if (!build.ok) throw new Error(body?.error?.message ?? `HTTP ${build.status}`);

  const schema = body.data?.inputSchema ? JSON.parse(body.data.inputSchema) : body.data?.actorDefinition?.input;
  const properties = schema?.properties ?? {};
  console.log(`required: ${JSON.stringify(schema?.required ?? [])}`);
  for (const [name, spec] of Object.entries<Record<string, unknown>>(properties)) {
    console.log(`${name}: ${spec.type}${spec.enum ? ` ${JSON.stringify(spec.enum)}` : ""} — ${String(spec.title ?? "")}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
