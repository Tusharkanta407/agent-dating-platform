import "dotenv/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Deletes every saved date (messages cascade) so the dating board starts fresh. Profiles are kept. */
async function main() {
  const { count, error } = await supabaseAdmin()
    .from("conversations")
    .delete({ count: "exact" })
    .not("id", "is", null);
  if (error) throw new Error(error.message);
  console.log(`Deleted ${count ?? 0} dates. Dating profiles are unchanged.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
