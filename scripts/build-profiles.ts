import "dotenv/config";
import { buildNextProfile, ProfileBuildError } from "@/lib/profiles/build-next";

async function main() {
  const attempted = new Set<string>();
  const failed: string[] = [];
  const incomplete: string[] = [];

  for (;;) {
    let result;
    try {
      result = await buildNextProfile(attempted);
    } catch (error) {
      if (!(error instanceof ProfileBuildError)) throw error;
      attempted.add(error.personId);
      failed.push(error.personName);
      console.error(`FAILED ${error.personName}: ${error.message}`);
      continue;
    }

    if (!result.personName || !result.personId) {
      console.log(`Done: ${result.completed}/${result.total} dating profiles saved.`);
      break;
    }

    attempted.add(result.personId);
    if (result.sources && Object.values(result.sources).includes("failed")) incomplete.push(result.personName);

    const sources = result.sources ? ` (linkedin: ${result.sources.linkedin}, instagram: ${result.sources.instagram})` : "";
    console.log(`${result.completed}/${result.total} ${result.personName}${sources}`);
  }

  if (failed.length > 0) console.error(`\nNo profile saved for: ${failed.join(", ")}`);
  if (incomplete.length > 0) console.error(`\nSaved, but a source scrape failed for: ${incomplete.join(", ")}`);
  if (failed.length > 0 || incomplete.length > 0) {
    console.error("Run npm run build-profiles again to retry them.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
